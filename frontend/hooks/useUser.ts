"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { UserProfile } from '@cinetrack/shared/types';
import { Database } from '@cinetrack/shared/types';
import { usePageFocus } from './usePageFocus';

interface UseUserReturn {
  user: User | null;
  userData: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  updateUserData: (profile: Partial<UserProfile>) => Promise<UserProfile | null>;
  uploadAvatar: (file: File) => Promise<string>;
}

/**
 * Custom hook to access the current authenticated user and their profile.
 * Relies on @supabase/ssr cookie management via middleware.
 */
export default function useUser(): UseUserReturn {
  // Memoize the client creation so it only happens once per hook instance
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  // isLoading is true until the initial auth check AND profile load completes
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const isPageFocused = usePageFocus();
  const [lastFocusCheckTime, setLastFocusCheckTime] = useState<number>(0);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null;
    try {
      console.log(`useUser: Fetching profile for user ${userId}`);
      const { data, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        // PGRST116: No rows found - this is expected if profile doesn't exist yet
        if (profileError.code === 'PGRST116') {
          console.warn(`useUser: Profile not found for user ${userId}, attempting to create.`);
          // Attempt to create profile (needs user email)
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user?.email) {
            const { data: newProfile, error: insertError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: authUser.user.email,
                display_name: authUser.user.email.split('@')[0] || 'New User',
              })
              .select()
              .single();
            if (insertError) {
              console.error('useUser: Error creating profile:', insertError);
              throw insertError; // Re-throw insert error
            }
            console.log('useUser: Profile created successfully');
            return newProfile as UserProfile;
          } else {
            console.error('useUser: Cannot create profile without auth user email.');
            return null; // Cannot create profile
          }
        } else {
          console.error('useUser: Error fetching profile:', profileError);
          throw profileError; // Re-throw other profile errors
        }
      }
      console.log('useUser: Profile fetched successfully');
      return data as UserProfile;
    } catch (err) {
      console.error('useUser: Failed in fetchProfile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true); 

    // Initial check function
    const initialCheck = async () => {
      console.log("useUser: Starting initialCheck...");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("useUser: initialCheck - getSession returned, session exists:", !!session);
        if (!isMounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const profile = await fetchProfile(currentUser.id);
          if (isMounted) {
            setUserData(profile);
            setError(null);
          }
        } else {
          setUserData(null);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('useUser: Error in initial check:', err);
          setError(err instanceof Error ? err : new Error('Failed initial auth check'));
        }
      } finally {
        // Set loading false after initial check attempt is complete
        if (isMounted) {
          console.log("useUser: Initial check complete. Setting isLoading=false.");
          setIsLoading(false); 
        }
      }
    };
    
    // Run initial check first
    initialCheck().then(() => {
        // Only set up the listener *after* the initial check is done
        if (!isMounted) return;
        console.log("useUser: Initial check finished, setting up onAuthStateChange listener.");
        
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log(`useUser: Auth event received: ${event}, Session: ${!!session}`);
            if (!isMounted) return;
    
            const currentUser = session?.user ?? null;
            const previousUser = user; // Capture previous user state
            
            // Determine if we need to fetch profile based on event type and user status
            const shouldRevalidateSession = 
                (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && currentUser;
            const userIdChanged = currentUser?.id !== previousUser?.id;
            const shouldFetchProfile = shouldRevalidateSession || userIdChanged;
            
            setUser(currentUser);
    
            if (shouldFetchProfile) {
              setIsLoading(true); // Set loading true when profile needs fetching
              try {
                // Explicitly get session again to ensure client state is fresh before fetching profile
                if (shouldRevalidateSession) {
                  console.log(`useUser: Revalidating session explicitly for event: ${event}`);
                  await supabase.auth.getSession(); // Force refresh internal state
                }

                if (currentUser) {
                  console.log(`useUser: Fetching profile for ${currentUser.id} due to event: ${event}`);
                  const profile = await fetchProfile(currentUser.id);
                  if (isMounted) {
                    setUserData(profile);
                    setError(null);
                  }
                } else {
                  // User is null (logged out)
                  // This case should be handled by event === 'SIGNED_OUT' or session being null
                  // Setting state below handles this
                }
              } catch (fetchError) {
                console.error("useUser: Error during profile fetch/create in auth listener:", fetchError);
              } finally {
                 if (isMounted) {
                   console.log(`useUser: Profile fetch attempt finished in listener. Setting isLoading=false.`);
                   setIsLoading(false);
                 }
              }
            } else if (event === 'SIGNED_OUT') {
                // Explicitly handle sign out event
                 if (isMounted) {
                   console.log("useUser: SIGNED_OUT event, clearing profile data.");
                   setUserData(null);
                   setError(null); 
                   setIsLoading(false); // Ensure loading is false on sign out
                 }
            } else {
                  // Event doesn't require profile fetch (e.g., USER_UPDATED, PASSWORD_RECOVERY)
                  // or user ID hasn't changed significantly. Ensure loading is false.
                  if (isMounted && isLoading) { 
                      console.log(`useUser: Event (${event}) received, no profile fetch needed, ensuring isLoading is false.`);
                      setIsLoading(false);
                  }
            }
          }
        );
        
        // Assign unsubscribe function for cleanup
        unsubscribe = authListener?.subscription?.unsubscribe;
    });

    let unsubscribe: (() => void) | undefined;

    return () => {
      isMounted = false;
      console.log("useUser: Component unmounting, unsubscribing from auth changes.");
      unsubscribe?.(); // Call the captured unsubscribe function
    };
  }, [supabase, fetchProfile]); // Dependencies should primarily be stable references

  // Effect to re-validate session on page focus
  useEffect(() => {
    // Only run if the page is focused AND we haven't checked recently
    // (debounce to avoid rapid checks if focus changes quickly)
    const now = Date.now();
    if (isPageFocused && now - lastFocusCheckTime > 5000) { // Check every 5s max on focus
      console.log("useUser: Page focused, re-validating session...");
      setLastFocusCheckTime(now);
      
      const revalidate = async () => {
        // Avoid setting loading=true unless we actually find a user potentially
        try {
          const { data: { session } } = await supabase.auth.getSession();

          const currentUser = session?.user ?? null;
          
          // Check if user state *actually* needs updating
          if (currentUser?.id !== user?.id) {
              console.log("useUser [Focus Check]: User state changed, updating...");
              setIsLoading(true);
              setUser(currentUser);
              if (currentUser) {
                  const profile = await fetchProfile(currentUser.id);
                  setUserData(profile);
              } else {
                  setUserData(null);
              }
              setError(null);
              // Don't set isLoading=false here, let the main effect's listener handle it if needed?
              // Or should we manage it here too? Let's set it here for now.
              setIsLoading(false);
          } else {
              console.log("useUser [Focus Check]: User state unchanged.");
              // Ensure loading is false if it somehow got stuck
              if (isLoading) setIsLoading(false);
          }
        } catch (err) {
            console.error('useUser [Focus Check]: Error re-validating session:', err);
            // Don't necessarily set error state here, maybe the main listener handles it
            if (isLoading) setIsLoading(false); // Ensure loading stops on error
        }
      };
      revalidate();
    }
  }, [isPageFocused, supabase, user, fetchProfile, lastFocusCheckTime, isLoading]); // Add dependencies

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('useUser: Error signing out:', signOutError);
        throw signOutError;
      }
      // State updates (user, userData, isLoading) handled by onAuthStateChange
      console.log('useUser: Sign out successful');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Sign out failed'));
      setIsLoading(false); // Ensure loading stops on error
      throw err; // Re-throw for the caller
    }
  };

  // Update user profile function
  const updateUserData = useCallback(async (profile: Partial<UserProfile>): Promise<UserProfile | null> => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      const updates = {
        ...profile,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedProfile, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('useUser: Error updating profile:', updateError);
        throw updateError;
      }

      if (updatedProfile) {
        // Update local state immediately
        setUserData(updatedProfile as UserProfile);
      }
      return updatedProfile as UserProfile;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      throw err; // Re-throw for the caller
    }
  }, [user, supabase]);

  // Upload avatar function
  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Ensure this bucket exists and has correct policies
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('useUser: Error uploading avatar:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update the user profile with the new avatar URL
      await updateUserData({ avatar_url: data.publicUrl });

      return data.publicUrl;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to upload avatar'));
      throw err; // Re-throw for the caller
    }
  }, [user, supabase, updateUserData]);

  return { user, userData, isLoading, error, signOut, updateUserData, uploadAvatar };
} 