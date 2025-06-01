import { useState, useEffect, useCallback } from 'react';
import { UserPreferences, UserPreferencesUpdate } from '@/types/preferences';
import { 
  getUserPreferences, 
  updateUserPreferences, 
  resetUserPreferences,
  updateTheme,
  updateNotificationPreferences,
  updateVisibilityPreferences,
  updateRegionalPreferences,
  updateContentPreferences
} from '@/lib/supabase/preferences';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './use-user';

export function useUserPreferences() {
  const { user, loading: userLoading } = useUser();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Load preferences
  const loadPreferences = useCallback(async () => {
    // Don't try to load preferences if user is still loading
    if (userLoading) {
      return;
    }

    // If no user, clear preferences and stop loading
    if (!user) {
      setPreferences(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserPreferences();
      setPreferences(data);
    } catch (err) {
      console.error('Error loading preferences:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preferences';
      setError(errorMessage);
      
      // If it's an authentication error, don't keep trying
      if (errorMessage.includes('not authenticated')) {
        setPreferences(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, userLoading]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: UserPreferencesUpdate) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const updatedPreferences = await updateUserPreferences(updates);
      setPreferences(updatedPreferences);
      return updatedPreferences;
    } catch (err) {
      console.error('Error updating preferences:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  // Reset preferences to defaults
  const resetPreferences = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const resetPrefs = await resetUserPreferences();
      setPreferences(resetPrefs);
      return resetPrefs;
    } catch (err) {
      console.error('Error resetting preferences:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset preferences';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  // Specific update functions
  const updateThemePreference = useCallback(async (theme: 'light' | 'dark' | 'system') => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const updatedPreferences = await updateTheme(theme);
      setPreferences(updatedPreferences);
      return updatedPreferences;
    } catch (err) {
      console.error('Error updating theme:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update theme';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  const updateNotifications = useCallback(async (notifications: Parameters<typeof updateNotificationPreferences>[0]) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const updatedPreferences = await updateNotificationPreferences(notifications);
      setPreferences(updatedPreferences);
      return updatedPreferences;
    } catch (err) {
      console.error('Error updating notifications:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notifications';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  const updateVisibility = useCallback(async (visibility: Parameters<typeof updateVisibilityPreferences>[0]) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const updatedPreferences = await updateVisibilityPreferences(visibility);
      setPreferences(updatedPreferences);
      return updatedPreferences;
    } catch (err) {
      console.error('Error updating visibility:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update visibility';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  const updateRegional = useCallback(async (regional: Parameters<typeof updateRegionalPreferences>[0]) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const updatedPreferences = await updateRegionalPreferences(regional);
      setPreferences(updatedPreferences);
      return updatedPreferences;
    } catch (err) {
      console.error('Error updating regional settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update regional settings';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  const updateContent = useCallback(async (content: Parameters<typeof updateContentPreferences>[0]) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const updatedPreferences = await updateContentPreferences(content);
      setPreferences(updatedPreferences);
      return updatedPreferences;
    } catch (err) {
      console.error('Error updating content settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update content settings';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  // Load preferences on mount and user change
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Set up real-time subscription for preferences changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_preferences_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Preferences changed:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            setPreferences(payload.new as UserPreferences);
          } else if (payload.eventType === 'INSERT' && payload.new) {
            setPreferences(payload.new as UserPreferences);
          } else if (payload.eventType === 'DELETE') {
            setPreferences(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  return {
    preferences,
    isLoading: isLoading || userLoading,
    error,
    updatePreferences,
    resetPreferences,
    updateThemePreference,
    updateNotifications,
    updateVisibility,
    updateRegional,
    updateContent,
    refetch: loadPreferences
  };
} 