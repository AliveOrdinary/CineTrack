/**
 * User-related utility functions for recommendations
 */

import { createClient } from '@/lib/supabase/client';

export interface User {
  id: string;
  display_name: string;
  avatar_url?: string;
}

/**
 * Get users that the current user can recommend content to
 * This includes users they follow and users that follow them
 */
export async function getRecommendableUsers(): Promise<User[]> {
  const supabase = createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  // Get users that current user follows
  const { data: followingData } = await supabase
    .from('follows')
    .select(`
      following_id,
      users!follows_following_id_fkey(id, display_name, avatar_url)
    `)
    .eq('follower_id', user.id);

  // Get users that follow the current user
  const { data: followersData } = await supabase
    .from('follows')
    .select(`
      follower_id,
      users!follows_follower_id_fkey(id, display_name, avatar_url)
    `)
    .eq('following_id', user.id);

  // Combine and deduplicate users
  const userMap = new Map<string, User>();

  // Add users that current user follows
  if (followingData) {
    followingData.forEach((follow: any) => {
      const userData = follow.users;
      if (userData) {
        userMap.set(userData.id, {
          id: userData.id,
          display_name: userData.display_name || 'Unknown User',
          avatar_url: userData.avatar_url,
        });
      }
    });
  }

  // Add users that follow current user
  if (followersData) {
    followersData.forEach((follow: any) => {
      const userData = follow.users;
      if (userData) {
        userMap.set(userData.id, {
          id: userData.id,
          display_name: userData.display_name || 'Unknown User',
          avatar_url: userData.avatar_url,
        });
      }
    });
  }

  // Convert to array and sort by display name
  return Array.from(userMap.values()).sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  );
}

/**
 * Search users by name for recommendation targets
 */
export async function searchUsersForRecommendation(query: string, limit: number = 10): Promise<User[]> {
  const supabase = createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  if (!query.trim()) {
    return [];
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .neq('id', user.id) // Exclude current user
    .or(`display_name.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    console.error('Error searching users:', error);
    throw new Error('Failed to search users');
  }

  return (data || []).map(userData => ({
    id: userData.id,
    display_name: userData.display_name || 'Unknown User',
    avatar_url: userData.avatar_url,
  }));
}

/**
 * Get all users for recommendation (fallback when no follows)
 */
export async function getAllUsersForRecommendation(limit: number = 50): Promise<User[]> {
  const supabase = createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .neq('id', user.id) // Exclude current user
    .order('display_name', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error getting all users:', error);
    throw new Error('Failed to get users');
  }

  return (data || []).map(userData => ({
    id: userData.id,
    display_name: userData.display_name || 'Unknown User',
    avatar_url: userData.avatar_url,
  }));
}