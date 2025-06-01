import { createClient } from '@/lib/supabase/client';
import { UserPreferences, UserPreferencesUpdate, DEFAULT_PREFERENCES } from '@/types/preferences';

const supabase = createClient();

/**
 * Get user preferences for the current user
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Authentication error: ${authError.message}`);
    }

    if (!user) {
      console.error('No authenticated user found');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, create default ones
        console.log('No preferences found, creating default preferences for user:', user.id);
        return await createUserPreferences();
      }
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw error;
  }
}

/**
 * Create default user preferences
 */
export async function createUserPreferences(): Promise<UserPreferences> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Authentication error: ${authError.message}`);
    }

    if (!user) {
      console.error('No authenticated user found');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id,
        ...DEFAULT_PREFERENCES,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating preferences:', error);
      throw new Error(`Failed to create preferences: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating user preferences:', error);
    throw error;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  updates: UserPreferencesUpdate
): Promise<UserPreferences> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Authentication error: ${authError.message}`);
    }

    if (!user) {
      console.error('No authenticated user found');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating preferences:', error);
      throw new Error(`Failed to update preferences: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

/**
 * Reset user preferences to defaults
 */
export async function resetUserPreferences(): Promise<UserPreferences> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Authentication error: ${authError.message}`);
    }

    if (!user) {
      console.error('No authenticated user found');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .update(DEFAULT_PREFERENCES)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error resetting preferences:', error);
      throw new Error(`Failed to reset preferences: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error resetting user preferences:', error);
    throw error;
  }
}

/**
 * Get user preferences by user ID (for admin or public access)
 */
export async function getUserPreferencesById(userId: string): Promise<UserPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No preferences found
      }
      console.error('Database error getting preferences by ID:', error);
      throw new Error(`Failed to get preferences: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error getting user preferences by ID:', error);
    throw error;
  }
}

/**
 * Update theme preference specifically
 */
export async function updateTheme(theme: 'light' | 'dark' | 'system'): Promise<UserPreferences> {
  return updateUserPreferences({ theme });
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  notifications: Partial<
    Pick<
      UserPreferences,
      | 'email_notifications'
      | 'push_notifications'
      | 'notify_on_follow'
      | 'notify_on_review_like'
      | 'notify_on_review_comment'
      | 'notify_on_list_like'
      | 'notify_on_list_comment'
      | 'notify_on_recommendation'
      | 'notify_on_system_updates'
    >
  >
): Promise<UserPreferences> {
  return updateUserPreferences(notifications);
}

/**
 * Update visibility preferences
 */
export async function updateVisibilityPreferences(
  visibility: Partial<
    Pick<
      UserPreferences,
      | 'default_review_visibility'
      | 'default_list_visibility'
      | 'default_watchlist_visibility'
      | 'default_activity_visibility'
    >
  >
): Promise<UserPreferences> {
  return updateUserPreferences(visibility);
}

/**
 * Update regional preferences
 */
export async function updateRegionalPreferences(
  regional: Partial<Pick<UserPreferences, 'language' | 'region' | 'timezone' | 'date_format'>>
): Promise<UserPreferences> {
  return updateUserPreferences(regional);
}

/**
 * Update content preferences
 */
export async function updateContentPreferences(
  content: Partial<
    Pick<
      UserPreferences,
      'adult_content' | 'spoiler_protection' | 'auto_mark_watched' | 'items_per_page'
    >
  >
): Promise<UserPreferences> {
  return updateUserPreferences(content);
}
