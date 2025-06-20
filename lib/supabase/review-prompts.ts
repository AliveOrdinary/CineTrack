/**
 * Supabase Review Prompts Client
 * Functions for managing review prompts and responses
 */

import { createClient } from '@/lib/supabase/client';
import {
  ReviewPrompt,
  ReviewResponse,
  ReviewResponseWithPrompt,
  CreateReviewResponseInput,
  UpdateReviewResponseInput,
  ReviewPromptsGroup,
  ReviewWithResponses,
  ReviewPromptsStats,
  ReviewPromptCategory,
} from '@/types/review-prompts';

const supabase = createClient();

/**
 * Get all active review prompts
 */
export async function getReviewPrompts(
  mediaType?: 'movie' | 'tv'
): Promise<ReviewPrompt[]> {
  let query = supabase
    .from('review_prompts')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (mediaType) {
    query = query.in('media_type', [mediaType, 'both']);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching review prompts:', error);
    throw new Error('Failed to fetch review prompts');
  }

  return data || [];
}

/**
 * Get review prompts grouped by category
 */
export async function getReviewPromptsByCategory(
  mediaType?: 'movie' | 'tv'
): Promise<ReviewPromptsGroup[]> {
  let query = supabase
    .from('review_prompts_by_category')
    .select('*');

  if (mediaType) {
    query = query.in('media_type', [mediaType, 'both']);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching review prompts by category:', error);
    throw new Error('Failed to fetch review prompts by category');
  }

  return data || [];
}

/**
 * Create review responses for a review
 */
export async function createReviewResponses(
  reviewId: string,
  responses: Record<string, string>
): Promise<ReviewResponse[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create review responses');
  }

  // Verify that the review belongs to the current user
  const { data: review } = await supabase
    .from('reviews')
    .select('user_id')
    .eq('id', reviewId)
    .single();

  if (!review || review.user_id !== user.id) {
    throw new Error('Can only add responses to your own reviews');
  }

  // Filter out empty responses and create input objects
  const responseInputs: CreateReviewResponseInput[] = Object.entries(responses)
    .filter(([_, responseText]) => responseText.trim().length > 0)
    .map(([promptId, responseText]) => ({
      review_id: reviewId,
      prompt_id: promptId,
      response_text: responseText.trim(),
    }));

  if (responseInputs.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('review_responses')
    .insert(responseInputs)
    .select();

  if (error) {
    console.error('Error creating review responses:', error);
    throw new Error('Failed to create review responses');
  }

  return data || [];
}

/**
 * Update review responses for a review
 */
export async function updateReviewResponses(
  reviewId: string,
  responses: Record<string, string>
): Promise<ReviewResponse[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to update review responses');
  }

  // Verify that the review belongs to the current user
  const { data: review } = await supabase
    .from('reviews')
    .select('user_id')
    .eq('id', reviewId)
    .single();

  if (!review || review.user_id !== user.id) {
    throw new Error('Can only update responses for your own reviews');
  }

  // Get existing responses
  const { data: existingResponses } = await supabase
    .from('review_responses')
    .select('*')
    .eq('review_id', reviewId);

  const existingResponseMap = new Map(
    (existingResponses || []).map(response => [response.prompt_id, response])
  );

  const operations = [];

  // Process each response
  for (const [promptId, responseText] of Object.entries(responses)) {
    const trimmedText = responseText.trim();
    const existingResponse = existingResponseMap.get(promptId);

    if (trimmedText.length === 0) {
      // Delete if exists and text is empty
      if (existingResponse) {
        operations.push(
          supabase
            .from('review_responses')
            .delete()
            .eq('id', existingResponse.id)
        );
      }
    } else if (existingResponse) {
      // Update existing response
      if (existingResponse.response_text !== trimmedText) {
        operations.push(
          supabase
            .from('review_responses')
            .update({ response_text: trimmedText })
            .eq('id', existingResponse.id)
        );
      }
    } else {
      // Create new response
      operations.push(
        supabase
          .from('review_responses')
          .insert({
            review_id: reviewId,
            prompt_id: promptId,
            response_text: trimmedText,
          })
      );
    }
  }

  // Execute all operations
  if (operations.length > 0) {
    const results = await Promise.all(operations);
    
    // Check for errors
    for (const result of results) {
      if (result.error) {
        console.error('Error updating review responses:', result.error);
        throw new Error('Failed to update review responses');
      }
    }
  }

  // Return updated responses
  const { data: updatedResponses, error } = await supabase
    .from('review_responses')
    .select('*')
    .eq('review_id', reviewId);

  if (error) {
    console.error('Error fetching updated responses:', error);
    throw new Error('Failed to fetch updated responses');
  }

  return updatedResponses || [];
}

/**
 * Get review responses for a specific review
 */
export async function getReviewResponses(
  reviewId: string
): Promise<ReviewResponseWithPrompt[]> {
  const { data, error } = await supabase
    .from('review_responses')
    .select(`
      *,
      prompt:review_prompts(*)
    `)
    .eq('review_id', reviewId)
    .order('prompt.sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching review responses:', error);
    throw new Error('Failed to fetch review responses');
  }

  return data || [];
}

/**
 * Get a review with all its prompt responses
 */
export async function getReviewWithResponses(
  reviewId: string
): Promise<ReviewWithResponses | null> {
  const { data, error } = await supabase
    .from('reviews_with_responses')
    .select('*')
    .eq('id', reviewId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Review not found
    }
    console.error('Error fetching review with responses:', error);
    throw new Error('Failed to fetch review with responses');
  }

  return data;
}

/**
 * Get reviews with responses for content
 */
export async function getContentReviewsWithResponses(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  limit: number = 10
): Promise<ReviewWithResponses[]> {
  const { data, error } = await supabase
    .from('reviews_with_responses')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching content reviews with responses:', error);
    throw new Error('Failed to fetch content reviews with responses');
  }

  return data || [];
}

/**
 * Get user's reviews with responses
 */
export async function getUserReviewsWithResponses(
  userId?: string,
  limit: number = 10
): Promise<ReviewWithResponses[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;

  const { data, error } = await supabase
    .from('reviews_with_responses')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user reviews with responses:', error);
    throw new Error('Failed to fetch user reviews with responses');
  }

  return data || [];
}

/**
 * Delete a review response
 */
export async function deleteReviewResponse(responseId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to delete review response');
  }

  const { error } = await supabase
    .from('review_responses')
    .delete()
    .eq('id', responseId);

  if (error) {
    console.error('Error deleting review response:', error);
    throw new Error('Failed to delete review response');
  }
}

/**
 * Get review prompts statistics
 */
export async function getReviewPromptsStats(): Promise<ReviewPromptsStats> {
  // Get total prompts and active prompts
  const { data: promptStats } = await supabase
    .from('review_prompts')
    .select('is_active, category')
    .order('category');

  // Get total responses
  const { count: totalResponses } = await supabase
    .from('review_responses')
    .select('*', { count: 'exact', head: true });

  // Get average responses per review
  const { data: reviewsWithResponseCounts } = await supabase
    .from('review_responses')
    .select('review_id')
    .order('review_id');

  // Get most used prompts
  const { data: promptUsage } = await supabase
    .from('review_responses')
    .select(`
      prompt_id,
      review_prompts!inner(prompt_text)
    `)
    .order('prompt_id');

  const prompts = promptStats || [];
  const totalPrompts = prompts.length;
  const activePrompts = prompts.filter(p => p.is_active).length;
  
  const promptsByCategory = prompts.reduce((acc, prompt) => {
    acc[prompt.category as ReviewPromptCategory] = (acc[prompt.category as ReviewPromptCategory] || 0) + 1;
    return acc;
  }, {} as Record<ReviewPromptCategory, number>);

  // Calculate average responses per review
  const reviewResponseCounts = (reviewsWithResponseCounts || []).reduce((acc, response) => {
    acc[response.review_id] = (acc[response.review_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueReviewsWithResponses = Object.keys(reviewResponseCounts).length;
  const averageResponsesPerReview = uniqueReviewsWithResponses > 0 
    ? (totalResponses || 0) / uniqueReviewsWithResponses 
    : 0;

  // Calculate most used prompts
  const promptUsageCounts = (promptUsage || []).reduce((acc, usage) => {
    acc[usage.prompt_id] = (acc[usage.prompt_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostUsedPrompts = Object.entries(promptUsageCounts)
    .map(([promptId, count]) => {
      const promptData = promptUsage?.find(p => p.prompt_id === promptId);
      return {
        prompt_id: promptId,
        prompt_text: promptData?.review_prompts?.prompt_text || 'Unknown prompt',
        usage_count: count,
      };
    })
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 10);

  return {
    total_prompts: totalPrompts,
    active_prompts: activePrompts,
    prompts_by_category: promptsByCategory,
    total_responses: totalResponses || 0,
    average_responses_per_review: Math.round(averageResponsesPerReview * 100) / 100,
    most_used_prompts: mostUsedPrompts,
  };
}

/**
 * Search reviews with responses by prompt content
 */
export async function searchReviewsByPromptResponse(
  searchQuery: string,
  category?: ReviewPromptCategory,
  mediaType?: 'movie' | 'tv',
  limit: number = 20
): Promise<ReviewWithResponses[]> {
  if (!searchQuery.trim()) {
    return [];
  }

  let query = supabase
    .from('reviews_with_responses')
    .select('*')
    .eq('visibility', 'public')
    .textSearch('prompt_responses', searchQuery)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (mediaType) {
    query = query.eq('media_type', mediaType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error searching reviews by prompt response:', error);
    throw new Error('Failed to search reviews');
  }

  // Filter by category if specified
  let results = data || [];
  if (category) {
    results = results.filter(review => 
      review.prompt_responses.some((response: any) => response.prompt_category === category)
    );
  }

  return results;
}