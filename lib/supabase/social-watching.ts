/**
 * Supabase Social Watching Client
 * Functions for managing social watching tags and relationships
 */

import { createClient } from '@/lib/supabase/client';
import {
  SocialWatching,
  SocialWatchingWithUser,
  CreateSocialWatchingInput,
  UpdateSocialWatchingInput,
  SocialWatchingStats,
  WatchPartner,
  SocialWatchingQueryOptions,
  WatchedContentWithSocialWatching,
} from '@/types/social-watching';

const supabase = createClient();

/**
 * Create a new social watching entry
 */
export async function createSocialWatching(
  socialWatchingData: CreateSocialWatchingInput
): Promise<SocialWatching> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create social watching entry');
  }

  // Verify that the watched content belongs to the current user
  const { data: watchedContent } = await supabase
    .from('watched_content')
    .select('user_id')
    .eq('id', socialWatchingData.watched_content_id)
    .single();

  if (!watchedContent || watchedContent.user_id !== user.id) {
    throw new Error('Can only add social watching tags to your own watched content');
  }

  // Verify that the user being tagged exists
  const { data: taggedUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', socialWatchingData.watched_with_user_id)
    .single();

  if (!taggedUser) {
    throw new Error('Tagged user not found');
  }

  // Prevent self-tagging
  if (socialWatchingData.watched_with_user_id === user.id) {
    throw new Error('Cannot tag yourself in social watching');
  }

  const { data, error } = await supabase
    .from('social_watching')
    .insert(socialWatchingData)
    .select()
    .single();

  if (error) {
    console.error('Error creating social watching:', error);
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('This user is already tagged for this watched content');
    }
    throw new Error('Failed to create social watching entry');
  }

  return data;
}

/**
 * Get social watching entries for a watched content item
 */
export async function getSocialWatchingForContent(
  watchedContentId: string
): Promise<SocialWatchingWithUser[]> {
  const { data, error } = await supabase
    .from('social_watching')
    .select(`
      *,
      watched_with_user:users!watched_with_user_id(id, display_name, avatar_url)
    `)
    .eq('watched_content_id', watchedContentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching social watching:', error);
    throw new Error('Failed to fetch social watching entries');
  }

  return data || [];
}

/**
 * Get watched content with social watching information
 */
export async function getWatchedContentWithSocialWatching(
  userId?: string,
  options: SocialWatchingQueryOptions = {}
): Promise<WatchedContentWithSocialWatching[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;
  const { filters, sort, pagination } = options;

  let query = supabase
    .from('watched_content')
    .select(`
      *,
      social_watching(
        *,
        watched_with_user:users!watched_with_user_id(id, display_name, avatar_url)
      )
    `)
    .eq('user_id', targetUserId);

  // Apply filters
  if (filters?.date_range) {
    query = query
      .gte('watched_date', filters.date_range.start)
      .lte('watched_date', filters.date_range.end);
  }

  // Apply sorting
  const sortField = sort?.field === 'partner_name' ? 'watched_date' : (sort?.field || 'watched_date');
  const sortDirection = sort?.direction || 'desc';
  query = query.order(sortField, { ascending: sortDirection === 'asc' });

  // Apply pagination
  if (pagination) {
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching watched content with social watching:', error);
    throw new Error('Failed to fetch watched content with social watching');
  }

  return data || [];
}

/**
 * Update a social watching entry
 */
export async function updateSocialWatching(
  socialWatchingId: string,
  updates: UpdateSocialWatchingInput
): Promise<SocialWatching> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to update social watching');
  }

  const { data, error } = await supabase
    .from('social_watching')
    .update(updates)
    .eq('id', socialWatchingId)
    .select(`
      *,
      watched_content!inner(user_id)
    `)
    .single();

  if (error) {
    console.error('Error updating social watching:', error);
    throw new Error('Failed to update social watching entry');
  }

  // Verify ownership through the select result
  if ((data as any).watched_content.user_id !== user.id) {
    throw new Error('Can only update social watching for your own content');
  }

  return data;
}

/**
 * Delete a social watching entry
 */
export async function deleteSocialWatching(socialWatchingId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to delete social watching');
  }

  // First verify ownership
  const { data: socialWatching } = await supabase
    .from('social_watching')
    .select(`
      id,
      watched_content!inner(user_id)
    `)
    .eq('id', socialWatchingId)
    .single();

  if (!socialWatching) {
    throw new Error('Social watching entry not found');
  }

  if ((socialWatching as any).watched_content.user_id !== user.id) {
    throw new Error('Can only delete social watching for your own content');
  }

  const { error } = await supabase
    .from('social_watching')
    .delete()
    .eq('id', socialWatchingId);

  if (error) {
    console.error('Error deleting social watching:', error);
    throw new Error('Failed to delete social watching entry');
  }
}

/**
 * Get user's social watching statistics
 */
export async function getUserSocialWatchingStats(
  userId?: string
): Promise<SocialWatchingStats | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;

  const { data, error } = await supabase
    .from('social_watching_stats')
    .select('*')
    .eq('user_id', targetUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No stats found
    }
    console.error('Error fetching social watching stats:', error);
    throw new Error('Failed to fetch social watching stats');
  }

  return data;
}

/**
 * Get user's watch partners
 */
export async function getUserWatchPartners(
  userId?: string,
  limit: number = 10
): Promise<WatchPartner[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;

  const { data, error } = await supabase.rpc('get_user_watch_partners', {
    target_user_id: targetUserId,
    partner_limit: limit,
  });

  if (error) {
    console.error('Error fetching watch partners:', error);
    throw new Error('Failed to fetch watch partners');
  }

  return data || [];
}

/**
 * Get social watching entries where user was tagged
 */
export async function getSocialWatchingTaggedIn(
  userId?: string,
  options: SocialWatchingQueryOptions = {}
): Promise<SocialWatchingWithUser[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;
  const { filters, sort, pagination } = options;

  let query = supabase
    .from('social_watching')
    .select(`
      *,
      watched_with_user:users!watched_with_user_id(id, display_name, avatar_url),
      watched_content!inner(
        *,
        user:users!user_id(id, display_name, avatar_url)
      )
    `)
    .eq('watched_with_user_id', targetUserId);

  // Apply filters
  if (filters?.watching_context) {
    query = query.in('watching_context', filters.watching_context);
  }
  if (filters?.date_range) {
    query = query
      .gte('created_at', filters.date_range.start)
      .lte('created_at', filters.date_range.end);
  }

  // Apply sorting
  const sortField = sort?.field || 'created_at';
  const sortDirection = sort?.direction || 'desc';
  query = query.order(sortField, { ascending: sortDirection === 'asc' });

  // Apply pagination
  if (pagination) {
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching social watching tagged in:', error);
    throw new Error('Failed to fetch social watching entries');
  }

  return data || [];
}

/**
 * Get social watching entries for a specific user pair
 */
export async function getMutualSocialWatching(
  userId1: string,
  userId2: string,
  options: SocialWatchingQueryOptions = {}
): Promise<SocialWatchingWithUser[]> {
  const { sort, pagination } = options;

  let query = supabase
    .from('social_watching')
    .select(`
      *,
      watched_with_user:users!watched_with_user_id(id, display_name, avatar_url),
      watched_content!inner(
        *,
        user:users!user_id(id, display_name, avatar_url)
      )
    `)
    .or(`and(watched_content.user_id.eq.${userId1},watched_with_user_id.eq.${userId2}),and(watched_content.user_id.eq.${userId2},watched_with_user_id.eq.${userId1})`);

  // Apply sorting
  const sortField = sort?.field || 'created_at';
  const sortDirection = sort?.direction || 'desc';
  query = query.order(sortField, { ascending: sortDirection === 'asc' });

  // Apply pagination
  if (pagination) {
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching mutual social watching:', error);
    throw new Error('Failed to fetch mutual social watching');
  }

  return data || [];
}

/**
 * Search social watching entries by partner name
 */
export async function searchSocialWatchingByPartner(
  searchQuery: string,
  userId?: string,
  limit: number = 20
): Promise<SocialWatchingWithUser[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;

  if (!searchQuery.trim()) {
    return [];
  }

  const { data, error } = await supabase
    .from('social_watching')
    .select(`
      *,
      watched_with_user:users!watched_with_user_id(id, display_name, avatar_url),
      watched_content!inner(user_id)
    `)
    .eq('watched_content.user_id', targetUserId)
    .ilike('watched_with_user.display_name', `%${searchQuery}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching social watching:', error);
    throw new Error('Failed to search social watching entries');
  }

  return data || [];
}

/**
 * Get recent social watching activity for followed users
 */
export async function getFollowingSocialWatchingActivity(
  limit: number = 20
): Promise<SocialWatchingWithUser[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  // Get users that current user follows
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  if (!followingData || followingData.length === 0) {
    return [];
  }

  const followingIds = followingData.map(f => f.following_id);

  const { data, error } = await supabase
    .from('social_watching')
    .select(`
      *,
      watched_with_user:users!watched_with_user_id(id, display_name, avatar_url),
      watched_content!inner(
        *,
        user:users!user_id(id, display_name, avatar_url)
      )
    `)
    .in('watched_content.user_id', followingIds)
    .eq('watched_content.visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching following social watching activity:', error);
    throw new Error('Failed to fetch social watching activity');
  }

  return data || [];
}