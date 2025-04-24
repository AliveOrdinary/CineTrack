'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useUser from '@/hooks/useUser';
import UserAvatar from '@/components/user-avatar';
import { UserProfile } from '@cinetrack/shared/types';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import FollowButton from '@/components/follow-button';
import { useQuery } from '@tanstack/react-query'; // Import useQuery
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import Link from 'next/link';

// Type for follow counts
interface FollowCounts {
  followers: number;
  following: number;
}

// Function to fetch follow counts
const fetchFollowCounts = async (userId: string): Promise<FollowCounts> => {
    const supabase = createClient();
    
    const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId)
    ]);

    if (followersRes.error) {
        console.error("Error fetching followers count:", followersRes.error);
        throw new Error('Could not fetch followers count.');
    }
     if (followingRes.error) {
        console.error("Error fetching following count:", followingRes.error);
        throw new Error('Could not fetch following count.');
    }

    return {
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
    };
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user: currentUser, isLoading: isUserLoading } = useUser(); // Get the currently logged-in user

  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Fetch Profile Data
  useEffect(() => {
    if (!userId) {
      setProfileError("User ID not found in URL.");
      setIsLoadingProfile(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      setProfileError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            throw new Error('User profile not found.');
          } else {
            throw fetchError;
          }
        }
        setProfile(data as UserProfile);
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        setProfileError(err.message || "Failed to load user profile.");
        setProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [userId, supabase]);

  // Fetch Follow Counts using React Query
  const { data: followCounts, isLoading: isLoadingCounts, error: countsError } = useQuery<FollowCounts, Error>(
    { 
      queryKey: ['followCounts', userId], 
      queryFn: () => fetchFollowCounts(userId),
      enabled: !!userId, // Only run if userId is available
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  // Redirect to own profile page if viewing self
  useEffect(() => {
    if (currentUser && userId === currentUser.id) {
        router.replace('/profile');
    }
  }, [currentUser, userId, router]);

  // Combined loading state
  const isLoading = isLoadingProfile || (!!userId && isLoadingCounts) || isUserLoading;
  const error = profileError || (countsError instanceof Error ? countsError.message : null);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="w-full max-w-4xl mx-auto bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-800">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
             <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full flex-shrink-0" />
             <div className="flex-1 space-y-3 text-center md:text-left">
                 <Skeleton className="h-8 w-3/4 mx-auto md:mx-0" />
                 <Skeleton className="h-4 w-1/2 mx-auto md:mx-0" />
                 <div className="flex justify-center md:justify-start gap-4 mt-4">
                     <Skeleton className="h-5 w-16" />
                     <Skeleton className="h-5 w-16" />
                     <Skeleton className="h-5 w-20" />
                 </div>
                 <Skeleton className="h-10 w-24 mt-4 mx-auto md:mx-0" />
             </div>
          </div>
        </div>
        <div className="w-full max-w-4xl mx-auto mt-6">
            <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  if (!profile) {
     return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-400">User profile could not be loaded.</p>
         <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  // --- Render profile page if user and userData are available ---
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-800 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <UserAvatar 
              avatarUrl={profile.avatar_url}
              name={profile.display_name}
              email={null} // Don't show other users' emails
              size="xl"
            />
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-between gap-2 mb-2">
                 <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                 {/* Follow Button - Render only if userId is valid and not current user */}
                 {currentUser && userId && currentUser.id !== userId && (
                    <FollowButton profileUserId={userId} />
                 )}
                 {!currentUser && userId && (
                     <Button variant="outline" size="sm" onClick={() => router.push(`/login?redirect=/profile/${userId}`)}>
                         Log in to follow
                     </Button>
                 )}
              </div>
              
              {profile.bio && (
                <p className="mt-1 text-gray-300">{profile.bio}</p>
              )}
              
              <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-gray-400">
                {/* Link Follower/Following Counts */}
                <Link href={`/profile/${userId}/followers`} className="hover:text-white cursor-pointer">
                  <span className="font-bold text-white">{followCounts?.followers ?? 0}</span> Followers
                </Link>
                <Link href={`/profile/${userId}/following`} className="hover:text-white cursor-pointer">
                  <span className="font-bold text-white">{followCounts?.following ?? 0}</span> Following
                </Link>
                 
                {profile.region && (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.33 6.33a6 6 0 1111.34 0 6 6 0 01-11.34 0zM10 4a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
                    </svg>
                    {profile.region}
                  </span>
                )}
                <span className="flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Joined: {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TODO: Add sections for user's activity, lists, reviews etc. */}
         <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Activity</h2>
            <p className="text-gray-500 text-center py-8">User activity section coming soon.</p>
         </div>

      </div>
    </div>
  );
} 