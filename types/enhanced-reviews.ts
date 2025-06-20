/**
 * Enhanced Review System Types
 * Combines detailed ratings, emotional reactions, and comprehensive reviews
 * This replaces both the basic review system and detailed ratings system
 */

// Core review interface
export interface EnhancedReview {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  
  // Basic review data
  title?: string;
  content?: string;
  overall_rating?: number; // 1-10 scale
  
  // Detailed category ratings (1-10 scale)
  acting_rating?: number;
  story_rating?: number;
  directing_rating?: number;
  cinematography_rating?: number;
  music_rating?: number;
  production_rating?: number;
  
  // Emotional reactions
  made_me_cry: boolean;
  made_me_laugh: boolean;
  was_scary: boolean;
  was_inspiring: boolean;
  was_thought_provoking: boolean;
  was_nostalgic: boolean;
  was_romantic: boolean;
  was_intense: boolean;
  was_confusing: boolean;
  was_boring: boolean;
  
  // Review metadata
  contains_spoilers: boolean;
  is_anonymous: boolean;
  review_type: ReviewType;
  
  // Social features
  likes_count: number;
  helpful_count: number;
  
  // Visibility and moderation
  visibility: 'public' | 'followers' | 'private';
  is_featured: boolean;
  is_moderated: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  
  // Watch context
  watched_date?: string;
  rewatch_number: number;
  watch_method?: WatchMethod;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Enhanced review with computed fields and user info
export interface EnhancedReviewWithDetails extends EnhancedReview {
  author_name: string;
  author_avatar?: string;
  calculated_rating?: number;
  emotional_reactions_count: number;
  is_liked_by_current_user: boolean;
  is_helpful_to_current_user: boolean;
}

// Review types
export type ReviewType = 'quick' | 'full' | 'detailed';

// Watch methods
export type WatchMethod = 'theater' | 'streaming' | 'tv' | 'physical' | 'other';

// Input types for creating/updating reviews
export interface CreateReviewInput {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  content?: string;
  overall_rating?: number;
  
  // Category ratings
  acting_rating?: number;
  story_rating?: number;
  directing_rating?: number;
  cinematography_rating?: number;
  music_rating?: number;
  production_rating?: number;
  
  // Emotional reactions
  emotional_reactions?: EmotionalReactions;
  
  // Metadata
  contains_spoilers?: boolean;
  is_anonymous?: boolean;
  review_type?: ReviewType;
  visibility?: 'public' | 'followers' | 'private';
  
  // Watch context
  watched_date?: string;
  rewatch_number?: number;
  watch_method?: WatchMethod;
}

export interface UpdateReviewInput extends Partial<CreateReviewInput> {
  id: string;
}

// Emotional reactions interface
export interface EmotionalReactions {
  made_me_cry?: boolean;
  made_me_laugh?: boolean;
  was_scary?: boolean;
  was_inspiring?: boolean;
  was_thought_provoking?: boolean;
  was_nostalgic?: boolean;
  was_romantic?: boolean;
  was_intense?: boolean;
  was_confusing?: boolean;
  was_boring?: boolean;
}

// Review interactions
export interface ReviewInteraction {
  id: string;
  user_id: string;
  review_id: string;
  interaction_type: 'like' | 'helpful' | 'report';
  report_reason?: string;
  report_details?: string;
  created_at: string;
}

// Content rating averages
export interface ContentRatingAverages {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  total_reviews: number;
  avg_overall_rating?: number;
  
  // Category averages
  avg_acting_rating?: number;
  avg_story_rating?: number;
  avg_directing_rating?: number;
  avg_cinematography_rating?: number;
  avg_music_rating?: number;
  avg_production_rating?: number;
  
  // Emotional reaction percentages
  cry_percentage?: number;
  laugh_percentage?: number;
  scary_percentage?: number;
  inspiring_percentage?: number;
  thought_provoking_percentage?: number;
  nostalgic_percentage?: number;
  romantic_percentage?: number;
  intense_percentage?: number;
  
  // Quality metrics
  avg_likes_per_review?: number;
  avg_helpful_per_review?: number;
  last_review_date?: string;
}

// Review recommendations
export interface ReviewRecommendation {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  avg_rating: number;
  review_count: number;
  friend_reviews: number;
  recommendation_score: number;
}

// Query options for fetching reviews
export interface ReviewQueryOptions {
  tmdb_id?: number;
  media_type?: 'movie' | 'tv';
  user_id?: string;
  review_type?: ReviewType;
  min_rating?: number;
  max_rating?: number;
  has_spoilers?: boolean;
  visibility?: ('public' | 'followers' | 'private')[];
  sort_by?: 'created_at' | 'updated_at' | 'overall_rating' | 'likes_count' | 'helpful_count';
  sort_direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Review statistics for a user
export interface UserReviewStats {
  total_reviews: number;
  avg_rating: number;
  total_likes_received: number;
  total_helpful_received: number;
  most_reviewed_genre?: string;
  review_streak_days: number;
  emotional_reactions_given: number;
  featured_reviews: number;
}

// Rating category configuration
export interface RatingCategory {
  key: keyof Pick<EnhancedReview, 'acting_rating' | 'story_rating' | 'directing_rating' | 'cinematography_rating' | 'music_rating' | 'production_rating'>;
  label: string;
  description: string;
  icon: string;
  weight: number; // For calculating overall average
}

// Emotional reaction configuration
export interface EmotionalReactionConfig {
  key: keyof EmotionalReactions;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

// Configuration objects
export const RATING_CATEGORIES: RatingCategory[] = [
  {
    key: 'acting_rating',
    label: 'Acting',
    description: 'Performance quality and believability',
    icon: '🎭',
    weight: 1.2
  },
  {
    key: 'story_rating',
    label: 'Story',
    description: 'Plot, pacing, and narrative structure',
    icon: '📚',
    weight: 1.5
  },
  {
    key: 'directing_rating',
    label: 'Directing',
    description: 'Vision, execution, and style',
    icon: '🎬',
    weight: 1.3
  },
  {
    key: 'cinematography_rating',
    label: 'Cinematography',
    description: 'Visual composition and camera work',
    icon: '📷',
    weight: 1.0
  },
  {
    key: 'music_rating',
    label: 'Music & Sound',
    description: 'Score, soundtrack, and audio design',
    icon: '🎵',
    weight: 0.8
  },
  {
    key: 'production_rating',
    label: 'Production',
    description: 'Sets, costumes, effects, and overall quality',
    icon: '🏗️',
    weight: 0.9
  }
];

export const EMOTIONAL_REACTIONS: EmotionalReactionConfig[] = [
  {
    key: 'made_me_cry',
    label: 'Made me cry',
    emoji: '😭',
    description: 'Emotionally moving or sad',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  {
    key: 'made_me_laugh',
    label: 'Made me laugh',
    emoji: '😂',
    description: 'Funny or entertaining',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  },
  {
    key: 'was_scary',
    label: 'Scary',
    emoji: '😱',
    description: 'Frightening or suspenseful',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  },
  {
    key: 'was_inspiring',
    label: 'Inspiring',
    emoji: '✨',
    description: 'Motivational or uplifting',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  {
    key: 'was_thought_provoking',
    label: 'Thought-provoking',
    emoji: '🤔',
    description: 'Made me think deeply',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
  },
  {
    key: 'was_nostalgic',
    label: 'Nostalgic',
    emoji: '🌅',
    description: 'Brought back memories',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  },
  {
    key: 'was_romantic',
    label: 'Romantic',
    emoji: '💕',
    description: 'Sweet or romantic',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
  },
  {
    key: 'was_intense',
    label: 'Intense',
    emoji: '🔥',
    description: 'High energy or dramatic',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  },
  {
    key: 'was_confusing',
    label: 'Confusing',
    emoji: '😵',
    description: 'Hard to follow or understand',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  },
  {
    key: 'was_boring',
    label: 'Boring',
    emoji: '😴',
    description: 'Slow or uninteresting',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
];

export const REVIEW_TYPE_CONFIG = {
  quick: {
    label: 'Quick Review',
    description: 'Just a rating and optional brief thoughts',
    icon: '⚡',
    requiredFields: ['overall_rating']
  },
  full: {
    label: 'Full Review',
    description: 'Detailed written review with ratings',
    icon: '📝',
    requiredFields: ['overall_rating', 'content']
  },
  detailed: {
    label: 'Detailed Analysis',
    description: 'Comprehensive review with category ratings',
    icon: '🔍',
    requiredFields: ['overall_rating', 'content']
  }
};

export const WATCH_METHOD_CONFIG = {
  theater: { label: 'Theater', icon: '🎭', description: 'Watched in cinema' },
  streaming: { label: 'Streaming', icon: '📺', description: 'Watched on streaming service' },
  tv: { label: 'TV', icon: '📻', description: 'Watched on television' },
  physical: { label: 'Physical Media', icon: '💿', description: 'DVD, Blu-ray, etc.' },
  other: { label: 'Other', icon: '📱', description: 'Other viewing method' }
};

// Utility functions
export function calculateWeightedRating(review: EnhancedReview): number | null {
  const ratings = RATING_CATEGORIES.map(cat => ({
    rating: review[cat.key],
    weight: cat.weight
  })).filter(r => r.rating !== undefined && r.rating !== null);

  if (ratings.length === 0) return review.overall_rating || null;

  const weightedSum = ratings.reduce((sum, r) => sum + (r.rating! * r.weight), 0);
  const totalWeight = ratings.reduce((sum, r) => sum + r.weight, 0);

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

export function getEmotionalReactionSummary(review: EnhancedReview): EmotionalReactionConfig[] {
  return EMOTIONAL_REACTIONS.filter(reaction => review[reaction.key] === true);
}

export function formatReviewDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return date.toLocaleDateString();
}

export function validateReviewInput(input: CreateReviewInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields based on review type
  const typeConfig = REVIEW_TYPE_CONFIG[input.review_type || 'full'];
  if (typeConfig.requiredFields.includes('overall_rating') && !input.overall_rating) {
    errors.push('Overall rating is required');
  }
  if (typeConfig.requiredFields.includes('content') && !input.content?.trim()) {
    errors.push('Review content is required');
  }

  // Validate rating ranges
  const ratingFields = ['overall_rating', ...RATING_CATEGORIES.map(c => c.key)] as const;
  ratingFields.forEach(field => {
    const value = input[field];
    if (value !== undefined && value !== null && (value < 1 || value > 10)) {
      errors.push(`${field.replace('_', ' ')} must be between 1 and 10`);
    }
  });

  // Validate content length
  if (input.content && input.content.length > 5000) {
    errors.push('Review content must be 5000 characters or less');
  }

  if (input.title && input.title.length > 200) {
    errors.push('Review title must be 200 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getReviewCompleteness(review: EnhancedReview): {
  percentage: number;
  missingFields: string[];
} {
  const fields = [
    { key: 'title', label: 'Title', weight: 1 },
    { key: 'content', label: 'Content', weight: 3 },
    { key: 'overall_rating', label: 'Overall Rating', weight: 2 },
    { key: 'acting_rating', label: 'Acting Rating', weight: 1 },
    { key: 'story_rating', label: 'Story Rating', weight: 1 },
    { key: 'directing_rating', label: 'Directing Rating', weight: 1 },
    { key: 'watched_date', label: 'Watch Date', weight: 1 },
    { key: 'watch_method', label: 'Watch Method', weight: 0.5 }
  ];

  const emotionalReactionWeight = getEmotionalReactionSummary(review).length > 0 ? 1 : 0;

  let completedWeight = 0;
  let totalWeight = 0;
  const missingFields: string[] = [];

  fields.forEach(field => {
    totalWeight += field.weight;
    const value = review[field.key as keyof EnhancedReview];
    if (value !== undefined && value !== null && value !== '') {
      completedWeight += field.weight;
    } else {
      missingFields.push(field.label);
    }
  });

  // Add emotional reactions
  totalWeight += 1;
  completedWeight += emotionalReactionWeight;
  if (emotionalReactionWeight === 0) {
    missingFields.push('Emotional Reactions');
  }

  const percentage = Math.round((completedWeight / totalWeight) * 100);

  return { percentage, missingFields };
}