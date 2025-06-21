/**
 * Enhanced Review System Supabase Client
 * Unified system combining detailed ratings and comprehensive reviews
 */

import { createClient } from '@/lib/supabase/client';
import {
  EnhancedReview,
  EnhancedReviewWithDetails,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewInteraction,
  ContentRatingAverages,
  ReviewRecommendation,
  ReviewQueryOptions,
  UserReviewStats,
  validateReviewInput
} from '@/types/enhanced-reviews';

const supabase = createClient();

/**
 * Create a new enhanced review
 */
export async function createEnhancedReview(input: CreateReviewInput): Promise<EnhancedReview> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create a review');
  }

  // Validate input
  const validation = validateReviewInput(input);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Prepare emotional reactions
  const emotionalReactions = input.emotional_reactions || {};

  const reviewData = {
    user_id: user.id,
    tmdb_id: input.tmdb_id,
    media_type: input.media_type,
    title: input.title,
    content: input.content,
    overall_rating: input.overall_rating,
    
    // Category ratings
    acting_rating: input.acting_rating,
    story_rating: input.story_rating,
    directing_rating: input.directing_rating,
    cinematography_rating: input.cinematography_rating,
    music_rating: input.music_rating,
    production_rating: input.production_rating,
    
    // Emotional reactions
    made_me_cry: emotionalReactions.made_me_cry || false,
    made_me_laugh: emotionalReactions.made_me_laugh || false,
    was_scary: emotionalReactions.was_scary || false,
    was_inspiring: emotionalReactions.was_inspiring || false,
    was_thought_provoking: emotionalReactions.was_thought_provoking || false,
    was_nostalgic: emotionalReactions.was_nostalgic || false,
    was_romantic: emotionalReactions.was_romantic || false,
    was_intense: emotionalReactions.was_intense || false,
    was_confusing: emotionalReactions.was_confusing || false,
    was_boring: emotionalReactions.was_boring || false,
    
    // Metadata
    contains_spoilers: input.contains_spoilers || false,
    is_anonymous: input.is_anonymous || false,
    review_type: input.review_type || 'full',
    visibility: input.visibility || 'public',
    
    // Watch context
    watched_date: input.watched_date,
    rewatch_number: input.rewatch_number || 1,
    watch_method: input.watch_method,
  };

  const { data, error } = await supabase
    .from('enhanced_reviews')
    .insert(reviewData)
    .select()
    .single();

  if (error) {
    console.error('Error creating enhanced review:', error);
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('You have already reviewed this content');
    }
    throw new Error('Failed to create review');
  }

  return data;
}

/**
 * Update an existing enhanced review
 */
export async function updateEnhancedReview(input: UpdateReviewInput): Promise<EnhancedReview> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to update a review');
  }

  // Extract ID and prepare update data
  const { id, emotional_reactions, ...updateData } = input;

  // Merge emotional reactions if provided
  if (emotional_reactions) {
    Object.assign(updateData, {
      made_me_cry: emotional_reactions.made_me_cry,
      made_me_laugh: emotional_reactions.made_me_laugh,
      was_scary: emotional_reactions.was_scary,
      was_inspiring: emotional_reactions.was_inspiring,
      was_thought_provoking: emotional_reactions.was_thought_provoking,
      was_nostalgic: emotional_reactions.was_nostalgic,
      was_romantic: emotional_reactions.was_romantic,
      was_intense: emotional_reactions.was_intense,
      was_confusing: emotional_reactions.was_confusing,
      was_boring: emotional_reactions.was_boring,
    });
  }

  const { data, error } = await supabase
    .from('enhanced_reviews')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the review
    .select()
    .single();

  if (error) {
    console.error('Error updating enhanced review:', error);
    throw new Error('Failed to update review');
  }

  if (!data) {
    throw new Error('Review not found or you do not have permission to update it');
  }

  return data;
}

/**
 * Delete an enhanced review
 */
export async function deleteEnhancedReview(reviewId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to delete a review');
  }

  const { error } = await supabase
    .from('enhanced_reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', user.id); // Ensure user owns the review

  if (error) {
    console.error('Error deleting enhanced review:', error);
    throw new Error('Failed to delete review');
  }
}

/**
 * Get enhanced reviews with optional filtering
 */
export async function getEnhancedReviews(
  options: ReviewQueryOptions = {}
): Promise<EnhancedReviewWithDetails[]> {
  let query = supabase
    .from('enhanced_reviews_with_details')
    .select('*');

  // Apply filters
  if (options.tmdb_id) {
    query = query.eq('tmdb_id', options.tmdb_id);
  }
  if (options.media_type) {
    query = query.eq('media_type', options.media_type);
  }
  if (options.user_id) {
    query = query.eq('user_id', options.user_id);
  }
  if (options.review_type) {
    query = query.eq('review_type', options.review_type);
  }
  if (options.min_rating) {
    query = query.gte('overall_rating', options.min_rating);
  }
  if (options.max_rating) {
    query = query.lte('overall_rating', options.max_rating);
  }
  if (options.has_spoilers !== undefined) {
    query = query.eq('contains_spoilers', options.has_spoilers);
  }
  if (options.visibility && options.visibility.length > 0) {
    query = query.in('visibility', options.visibility);
  }

  // Apply sorting
  const sortBy = options.sort_by || 'created_at';
  const sortDirection = options.sort_direction || 'desc';
  query = query.order(sortBy, { ascending: sortDirection === 'asc' });

  // Apply pagination
  if (options.limit) {
    const offset = options.offset || 0;
    query = query.range(offset, offset + options.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching enhanced reviews:', error);
    throw new Error('Failed to fetch reviews');
  }

  return data || [];
}

/**
 * Get a single enhanced review by ID
 */
export async function getEnhancedReview(reviewId: string): Promise<EnhancedReviewWithDetails | null> {
  const { data, error } = await supabase
    .from('enhanced_reviews_with_details')
    .select('*')
    .eq('id', reviewId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Review not found
    }
    console.error('Error fetching enhanced review:', error);
    throw new Error('Failed to fetch review');
  }

  return data;
}

/**
 * Get user's review for specific content
 */
export async function getUserReviewForContent(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  userId?: string
): Promise<EnhancedReviewWithDetails | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetUserId = userId || user?.id;
  if (!targetUserId) {
    throw new Error('User ID required');
  }

  const { data, error } = await supabase
    .from('enhanced_reviews_with_details')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .eq('user_id', targetUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No review found
    }
    console.error('Error fetching user review:', error);
    throw new Error('Failed to fetch user review');
  }

  return data;
}

/**
 * Get content rating averages
 */
export async function getContentRatingAverages(
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<ContentRatingAverages | null> {
  const { data, error } = await supabase
    .from('content_rating_averages')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No ratings found
    }
    console.error('Error fetching content rating averages:', error);
    throw new Error('Failed to fetch rating averages');
  }

  return data;
}

/**
 * Create or update a review interaction (like, helpful, report)
 */
export async function createReviewInteraction(
  reviewId: string,
  interactionType: 'like' | 'helpful' | 'report',
  reportData?: { reason: string; details?: string }
): Promise<ReviewInteraction> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to interact with reviews');
  }

  const interactionData = {
    user_id: user.id,
    review_id: reviewId,
    interaction_type: interactionType,
    report_reason: reportData?.reason,
    report_details: reportData?.details,
  };

  const { data, error } = await supabase
    .from('review_interactions')
    .insert(interactionData)
    .select()
    .single();

  if (error) {
    console.error('Error creating review interaction:', error);
    if (error.code === '23505') { // Unique constraint violation
      throw new Error(`You have already ${interactionType}d this review`);
    }
    throw new Error('Failed to create interaction');
  }

  return data;
}

/**
 * Remove a review interaction
 */
export async function removeReviewInteraction(
  reviewId: string,
  interactionType: 'like' | 'helpful'
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to remove interactions');
  }

  const { error } = await supabase
    .from('review_interactions')
    .delete()
    .eq('user_id', user.id)
    .eq('review_id', reviewId)
    .eq('interaction_type', interactionType);

  if (error) {
    console.error('Error removing review interaction:', error);
    throw new Error('Failed to remove interaction');
  }
}

/**
 * Get review recommendations for a user
 */
export async function getReviewRecommendations(
  userId?: string,
  limit: number = 10
): Promise<ReviewRecommendation[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetUserId = userId || user?.id;
  if (!targetUserId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const { data, error } = await supabase.rpc('get_review_recommendations', {
    target_user_id: targetUserId,
    content_limit: limit,
  });

  if (error) {
    console.error('Error fetching review recommendations:', error);
    throw new Error('Failed to fetch recommendations');
  }

  return data || [];
}

/**
 * Get user review statistics
 */
export async function getUserReviewStats(userId?: string): Promise<UserReviewStats> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetUserId = userId || user?.id;
  if (!targetUserId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  // Get basic review stats
  const { data: reviewData, error: reviewError } = await supabase
    .from('enhanced_reviews')
    .select('overall_rating, likes_count, helpful_count, is_featured, created_at')
    .eq('user_id', targetUserId);

  if (reviewError) {
    console.error('Error fetching user review stats:', reviewError);
    throw new Error('Failed to fetch review statistics');
  }

  const reviews = reviewData || [];

  // Calculate statistics
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / totalReviews 
    : 0;
  const totalLikesReceived = reviews.reduce((sum, r) => sum + r.likes_count, 0);
  const totalHelpfulReceived = reviews.reduce((sum, r) => sum + r.helpful_count, 0);
  const featuredReviews = reviews.filter(r => r.is_featured).length;

  // Calculate review streak (consecutive days with reviews)
  const sortedDates = reviews
    .map(r => new Date(r.created_at).toDateString())
    .filter((date, index, arr) => arr.indexOf(date) === index)
    .sort();

  let reviewStreakDays = 0;
  if (sortedDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);
    let currentStreak = 0;
    
    for (let i = 0; i < 365; i++) { // Check up to a year
      const dateStr = checkDate.toDateString();
      if (sortedDates.includes(dateStr)) {
        currentStreak++;
      } else if (currentStreak > 0) {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    reviewStreakDays = currentStreak;
  }

  // Get emotional reactions count
  const { data: emotionalData } = await supabase
    .from('enhanced_reviews')
    .select('made_me_cry, made_me_laugh, was_scary, was_inspiring, was_thought_provoking, was_nostalgic, was_romantic, was_intense')
    .eq('user_id', targetUserId);

  const emotionalReactionsGiven = (emotionalData || []).reduce((sum, review) => {
    return sum + Object.values(review).filter(Boolean).length;
  }, 0);

  return {
    total_reviews: totalReviews,
    avg_rating: Math.round(avgRating * 10) / 10,
    total_likes_received: totalLikesReceived,
    total_helpful_received: totalHelpfulReceived,
    review_streak_days: reviewStreakDays,
    emotional_reactions_given: emotionalReactionsGiven,
    featured_reviews: featuredReviews,
    most_reviewed_genre: undefined, // Would need TMDB integration to calculate
  };
}

/**
 * Search reviews by content
 */
export async function searchReviews(
  query: string,
  options: Partial<ReviewQueryOptions> = {}
): Promise<EnhancedReviewWithDetails[]> {
  const searchOptions: ReviewQueryOptions = {
    ...options,
    limit: options.limit || 20,
    sort_by: options.sort_by || 'created_at',
    sort_direction: options.sort_direction || 'desc',
  };

  let supabaseQuery = supabase
    .from('enhanced_reviews_with_details')
    .select('*')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,author_name.ilike.%${query}%`);

  // Apply additional filters
  if (searchOptions.media_type) {
    supabaseQuery = supabaseQuery.eq('media_type', searchOptions.media_type);
  }
  if (searchOptions.min_rating) {
    supabaseQuery = supabaseQuery.gte('overall_rating', searchOptions.min_rating);
  }

  // Apply sorting and pagination
  supabaseQuery = supabaseQuery
    .order(searchOptions.sort_by!, { ascending: searchOptions.sort_direction === 'asc' })
    .limit(searchOptions.limit!);

  if (searchOptions.offset) {
    supabaseQuery = supabaseQuery.range(searchOptions.offset, searchOptions.offset + searchOptions.limit! - 1);
  }

  const { data, error } = await supabaseQuery;

  if (error) {
    console.error('Error searching reviews:', error);
    throw new Error('Failed to search reviews');
  }

  return data || [];
}

/**
 * Get featured reviews
 */
export async function getFeaturedReviews(
  mediaType?: 'movie' | 'tv',
  limit: number = 10
): Promise<EnhancedReviewWithDetails[]> {
  let query = supabase
    .from('enhanced_reviews_with_details')
    .select('*')
    .eq('is_featured', true)
    .order('likes_count', { ascending: false });

  if (mediaType) {
    query = query.eq('media_type', mediaType);
  }

  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching featured reviews:', error);
    throw new Error('Failed to fetch featured reviews');
  }

  return data || [];
}