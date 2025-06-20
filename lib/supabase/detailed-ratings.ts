/**
 * Supabase Detailed Ratings Client
 * Functions for managing detailed ratings with category ratings and emotional reactions
 */

import { createClient } from '@/lib/supabase/client';
import {
  DetailedRating,
  DetailedRatingInput,
  DetailedRatingWithUser,
  ContentDetailedRatings,
} from '@/types/detailed-ratings';

const supabase = createClient();

/**
 * Create or update a detailed rating
 */
export async function upsertDetailedRating(ratingData: DetailedRatingInput): Promise<DetailedRating> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create a rating');
  }

  const { data, error } = await supabase
    .from('detailed_ratings')
    .upsert(
      {
        user_id: user.id,
        ...ratingData,
      },
      {
        onConflict: 'user_id,tmdb_id,media_type',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting detailed rating:', error);
    throw new Error('Failed to save detailed rating');
  }

  return data;
}

/**
 * Get detailed rating by user and content
 */
export async function getDetailedRating(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  userId?: string
): Promise<DetailedRating | null> {
  let query = supabase
    .from('detailed_ratings')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType);

  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    // Get current user's rating if no userId specified
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No rating found
    }
    console.error('Error fetching detailed rating:', error);
    throw new Error('Failed to fetch detailed rating');
  }

  return data;
}

/**
 * Get detailed ratings for content with user info
 */
export async function getContentDetailedRatings(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  limit: number = 10,
  offset: number = 0
): Promise<DetailedRatingWithUser[]> {
  const { data, error } = await supabase
    .from('detailed_ratings')
    .select(`
      *,
      user:users(id, display_name, avatar_url)
    `)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .not('overall_rating', 'is', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching content detailed ratings:', error);
    throw new Error('Failed to fetch detailed ratings');
  }

  return data || [];
}

/**
 * Get aggregated ratings for content
 */
export async function getContentRatingAggregates(
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<ContentDetailedRatings | null> {
  const { data, error } = await supabase
    .from('content_detailed_ratings')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No ratings found
    }
    console.error('Error fetching content rating aggregates:', error);
    throw new Error('Failed to fetch rating aggregates');
  }

  return data;
}

/**
 * Get user's detailed ratings
 */
export async function getUserDetailedRatings(
  userId?: string,
  limit: number = 20,
  offset: number = 0
): Promise<DetailedRating[]> {
  let targetUserId = userId;

  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated');
    }

    targetUserId = user.id;
  }

  const { data, error } = await supabase
    .from('detailed_ratings')
    .select('*')
    .eq('user_id', targetUserId)
    .not('overall_rating', 'is', null)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching user detailed ratings:', error);
    throw new Error('Failed to fetch user ratings');
  }

  return data || [];
}

/**
 * Delete a detailed rating
 */
export async function deleteDetailedRating(
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to delete a rating');
  }

  const { error } = await supabase
    .from('detailed_ratings')
    .delete()
    .eq('user_id', user.id)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType);

  if (error) {
    console.error('Error deleting detailed rating:', error);
    throw new Error('Failed to delete detailed rating');
  }
}

/**
 * Get top rated content by category
 */
export async function getTopRatedByCategory(
  category: 'acting' | 'story' | 'directing' | 'cinematography' | 'music' | 'production' | 'overall',
  mediaType?: 'movie' | 'tv',
  limit: number = 10
): Promise<ContentDetailedRatings[]> {
  const columnMap = {
    acting: 'avg_acting',
    story: 'avg_story',
    directing: 'avg_directing',
    cinematography: 'avg_cinematography',
    music: 'avg_music',
    production: 'avg_production',
    overall: 'avg_overall',
  };

  const orderColumn = columnMap[category];

  let query = supabase
    .from('content_detailed_ratings')
    .select('*')
    .not(orderColumn, 'is', null)
    .gte('total_ratings', 3) // Minimum 3 ratings
    .order(orderColumn, { ascending: false })
    .limit(limit);

  if (mediaType) {
    query = query.eq('media_type', mediaType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching top rated content:', error);
    throw new Error('Failed to fetch top rated content');
  }

  return data || [];
}

/**
 * Get content with highest emotional reaction percentages
 */
export async function getContentByEmotionalReaction(
  reaction: 'cry' | 'laugh' | 'scary' | 'inspiring' | 'thought_provoking' | 'nostalgic' | 'romantic' | 'intense',
  mediaType?: 'movie' | 'tv',
  limit: number = 10
): Promise<ContentDetailedRatings[]> {
  const columnMap = {
    cry: 'cry_percentage',
    laugh: 'laugh_percentage',
    scary: 'scary_percentage',
    inspiring: 'inspiring_percentage',
    thought_provoking: 'thought_provoking_percentage',
    nostalgic: 'nostalgic_percentage',
    romantic: 'romantic_percentage',
    intense: 'intense_percentage',
  };

  const orderColumn = columnMap[reaction];

  let query = supabase
    .from('content_detailed_ratings')
    .select('*')
    .gte('total_ratings', 3) // Minimum 3 ratings
    .gte(orderColumn, 20) // At least 20% reaction rate
    .order(orderColumn, { ascending: false })
    .limit(limit);

  if (mediaType) {
    query = query.eq('media_type', mediaType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching content by emotional reaction:', error);
    throw new Error('Failed to fetch content by emotional reaction');
  }

  return data || [];
}

/**
 * Get rating statistics for a user
 */
export async function getUserRatingStats(userId?: string): Promise<{
  totalRatings: number;
  averageRating: number;
  categoryAverages: Record<string, number>;
  emotionalReactions: Record<string, number>;
}> {
  let targetUserId = userId;

  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated');
    }

    targetUserId = user.id;
  }

  const { data, error } = await supabase
    .from('detailed_ratings')
    .select('*')
    .eq('user_id', targetUserId);

  if (error) {
    console.error('Error fetching user rating stats:', error);
    throw new Error('Failed to fetch user rating stats');
  }

  const ratings = data || [];
  const ratingsWithOverall = ratings.filter(r => r.overall_rating !== null);

  const categoryAverages = {
    acting: 0,
    story: 0,
    directing: 0,
    cinematography: 0,
    music: 0,
    production: 0,
  };

  const emotionalReactions = {
    made_me_cry: 0,
    made_me_laugh: 0,
    was_scary: 0,
    was_inspiring: 0,
    was_thought_provoking: 0,
    was_nostalgic: 0,
    was_romantic: 0,
    was_intense: 0,
  };

  // Calculate category averages
  (Object.keys(categoryAverages) as Array<keyof typeof categoryAverages>).forEach(category => {
    const categoryRatings = ratings
      .map(r => r[`${category}_rating` as keyof DetailedRating])
      .filter((r): r is number => r !== null && r !== undefined && typeof r === 'number');
    
    if (categoryRatings.length > 0) {
      categoryAverages[category] = categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length;
    }
  });

  // Count emotional reactions
  (Object.keys(emotionalReactions) as Array<keyof typeof emotionalReactions>).forEach(reaction => {
    emotionalReactions[reaction] = ratings.filter(r => r[reaction] === true).length;
  });

  return {
    totalRatings: ratingsWithOverall.length,
    averageRating: ratingsWithOverall.length > 0 
      ? ratingsWithOverall.reduce((sum, r) => sum + r.overall_rating, 0) / ratingsWithOverall.length 
      : 0,
    categoryAverages,
    emotionalReactions,
  };
}