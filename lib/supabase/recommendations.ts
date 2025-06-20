/**
 * Supabase Recommendations Client
 * Functions for managing content recommendations between users
 */

import { createClient } from '@/lib/supabase/client';
import {
  ContentRecommendation,
  ContentRecommendationWithUsers,
  CreateRecommendationInput,
  UpdateRecommendationStatusInput,
  RecommendationStats,
  RecommendationQueryOptions,
  RecommendationInbox,
  RecommendationOutbox,
  RecommendationStatus,
} from '@/types/recommendations';

const supabase = createClient();

/**
 * Create a new content recommendation
 */
export async function createRecommendation(
  recommendationData: CreateRecommendationInput
): Promise<ContentRecommendation> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create a recommendation');
  }

  // Validate that recipient exists and is not the same as sender
  if (recommendationData.recipient_id === user.id) {
    throw new Error('Cannot recommend content to yourself');
  }

  const { data: recipient } = await supabase
    .from('users')
    .select('id')
    .eq('id', recommendationData.recipient_id)
    .single();

  if (!recipient) {
    throw new Error('Recipient user not found');
  }

  // Check for existing pending recommendation for the same content
  const { data: existingRec } = await supabase
    .from('content_recommendations')
    .select('id')
    .eq('sender_id', user.id)
    .eq('recipient_id', recommendationData.recipient_id)
    .eq('tmdb_id', recommendationData.tmdb_id)
    .eq('media_type', recommendationData.media_type)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingRec) {
    throw new Error('You already have a pending recommendation for this content to this user');
  }

  const { data, error } = await supabase
    .from('content_recommendations')
    .insert({
      sender_id: user.id,
      ...recommendationData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating recommendation:', error);
    throw new Error('Failed to create recommendation');
  }

  return data;
}

/**
 * Get a specific recommendation by ID
 */
export async function getRecommendation(
  recommendationId: string
): Promise<ContentRecommendationWithUsers | null> {
  const { data, error } = await supabase
    .from('content_recommendations')
    .select(`
      *,
      sender:users!sender_id(id, display_name, avatar_url),
      recipient:users!recipient_id(id, display_name, avatar_url)
    `)
    .eq('id', recommendationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No recommendation found
    }
    console.error('Error fetching recommendation:', error);
    throw new Error('Failed to fetch recommendation');
  }

  return data;
}

/**
 * Update recommendation status (accept, decline, mark as watched)
 */
export async function updateRecommendationStatus(
  recommendationId: string,
  statusUpdate: UpdateRecommendationStatusInput
): Promise<ContentRecommendation> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to update recommendation');
  }

  const updateData = {
    status: statusUpdate.status,
    response_date: new Date().toISOString(),
    response_message: statusUpdate.response_message,
  };

  const { data, error } = await supabase
    .from('content_recommendations')
    .update(updateData)
    .eq('id', recommendationId)
    .eq('recipient_id', user.id) // Ensure user can only update their own received recommendations
    .select()
    .single();

  if (error) {
    console.error('Error updating recommendation status:', error);
    throw new Error('Failed to update recommendation status');
  }

  return data;
}

/**
 * Delete a recommendation (only pending ones by sender)
 */
export async function deleteRecommendation(recommendationId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to delete recommendation');
  }

  const { error } = await supabase
    .from('content_recommendations')
    .delete()
    .eq('id', recommendationId)
    .eq('sender_id', user.id) // Ensure user can only delete their own sent recommendations
    .eq('status', 'pending'); // Can only delete pending recommendations

  if (error) {
    console.error('Error deleting recommendation:', error);
    throw new Error('Failed to delete recommendation');
  }
}

/**
 * Get user's inbox (recommendations received)
 */
export async function getRecommendationInbox(
  options: RecommendationQueryOptions = {}
): Promise<RecommendationInbox> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to view inbox');
  }

  const { filters, sort, pagination } = options;
  
  let query = supabase
    .from('content_recommendations')
    .select(`
      *,
      sender:users!sender_id(id, display_name, avatar_url),
      recipient:users!recipient_id(id, display_name, avatar_url)
    `)
    .eq('recipient_id', user.id);

  // Apply filters
  if (filters?.status) {
    query = query.in('status', filters.status);
  }
  if (filters?.media_type) {
    query = query.in('media_type', filters.media_type);
  }
  if (filters?.is_urgent !== undefined) {
    query = query.eq('is_urgent', filters.is_urgent);
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

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching recommendation inbox:', error);
    throw new Error('Failed to fetch recommendation inbox');
  }

  const recommendations = data || [];

  // Group by status
  const inbox: RecommendationInbox = {
    pending: recommendations.filter(r => r.status === 'pending'),
    accepted: recommendations.filter(r => r.status === 'accepted'),
    declined: recommendations.filter(r => r.status === 'declined'),
    watched: recommendations.filter(r => r.status === 'watched'),
    total_count: count || recommendations.length,
  };

  return inbox;
}

/**
 * Get user's outbox (recommendations sent)
 */
export async function getRecommendationOutbox(
  options: RecommendationQueryOptions = {}
): Promise<RecommendationOutbox> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to view outbox');
  }

  const { filters, sort, pagination } = options;
  
  let query = supabase
    .from('content_recommendations')
    .select(`
      *,
      sender:users!sender_id(id, display_name, avatar_url),
      recipient:users!recipient_id(id, display_name, avatar_url)
    `)
    .eq('sender_id', user.id);

  // Apply filters (same as inbox)
  if (filters?.status) {
    query = query.in('status', filters.status);
  }
  if (filters?.media_type) {
    query = query.in('media_type', filters.media_type);
  }
  if (filters?.is_urgent !== undefined) {
    query = query.eq('is_urgent', filters.is_urgent);
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

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching recommendation outbox:', error);
    throw new Error('Failed to fetch recommendation outbox');
  }

  const recommendations = data || [];

  // Group by status
  const outbox: RecommendationOutbox = {
    pending: recommendations.filter(r => r.status === 'pending'),
    accepted: recommendations.filter(r => r.status === 'accepted'),
    declined: recommendations.filter(r => r.status === 'declined'),
    watched: recommendations.filter(r => r.status === 'watched'),
    total_count: count || recommendations.length,
  };

  return outbox;
}

/**
 * Get recommendations for a specific content item
 */
export async function getContentRecommendations(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  options: RecommendationQueryOptions = {}
): Promise<ContentRecommendationWithUsers[]> {
  const { sort, pagination } = options;
  
  let query = supabase
    .from('content_recommendations')
    .select(`
      *,
      sender:users!sender_id(id, display_name, avatar_url),
      recipient:users!recipient_id(id, display_name, avatar_url)
    `)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType);

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
    console.error('Error fetching content recommendations:', error);
    throw new Error('Failed to fetch content recommendations');
  }

  return data || [];
}

/**
 * Get user's recommendation statistics
 */
export async function getUserRecommendationStats(
  userId?: string
): Promise<RecommendationStats | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;

  const { data, error } = await supabase
    .from('recommendation_stats')
    .select('*')
    .eq('user_id', targetUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No stats found
    }
    console.error('Error fetching recommendation stats:', error);
    throw new Error('Failed to fetch recommendation stats');
  }

  return data;
}

/**
 * Get mutual recommendations between two users
 */
export async function getMutualRecommendations(
  userId1: string,
  userId2: string,
  options: RecommendationQueryOptions = {}
): Promise<ContentRecommendationWithUsers[]> {
  const { sort, pagination } = options;
  
  let query = supabase
    .from('content_recommendations')
    .select(`
      *,
      sender:users!sender_id(id, display_name, avatar_url),
      recipient:users!recipient_id(id, display_name, avatar_url)
    `)
    .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`);

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
    console.error('Error fetching mutual recommendations:', error);
    throw new Error('Failed to fetch mutual recommendations');
  }

  return data || [];
}

/**
 * Get recommendations by tag
 */
export async function getRecommendationsByTag(
  tag: string,
  options: RecommendationQueryOptions = {}
): Promise<ContentRecommendationWithUsers[]> {
  const { sort, pagination } = options;
  
  let query = supabase
    .from('content_recommendations')
    .select(`
      *,
      sender:users!sender_id(id, display_name, avatar_url),
      recipient:users!recipient_id(id, display_name, avatar_url)
    `)
    .contains('tags', [tag]);

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
    console.error('Error fetching recommendations by tag:', error);
    throw new Error('Failed to fetch recommendations by tag');
  }

  return data || [];
}

/**
 * Check if current user has already recommended specific content to a user
 */
export async function hasRecommended(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  recipientId: string
): Promise<ContentRecommendation | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('content_recommendations')
    .select('*')
    .eq('sender_id', user.id)
    .eq('recipient_id', recipientId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking recommendation:', error);
    return null;
  }

  return data;
}

/**
 * Get recent recommendations (for activity feeds)
 */
export async function getRecentRecommendations(
  limit: number = 20,
  followingOnly: boolean = false
): Promise<ContentRecommendationWithUsers[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to view recent recommendations');
  }

  let query = supabase
    .from('content_recommendations')
    .select(`
      *,
      sender:users!sender_id(id, display_name, avatar_url),
      recipient:users!recipient_id(id, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (followingOnly) {
    // Get users that current user follows
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (following && following.length > 0) {
      const followingIds = following.map(f => f.following_id);
      query = query.in('sender_id', followingIds);
    } else {
      // If not following anyone, return empty array
      return [];
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching recent recommendations:', error);
    throw new Error('Failed to fetch recent recommendations');
  }

  return data || [];
}