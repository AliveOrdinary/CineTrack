/**
 * Detailed Ratings Types
 * Types for the enhanced rating system with category ratings and emotional reactions
 */

export interface DetailedRating {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  
  // Category ratings (1-10 scale)
  acting_rating?: number;
  story_rating?: number;
  directing_rating?: number;
  cinematography_rating?: number;
  music_rating?: number;
  production_rating?: number;
  
  // Overall rating (calculated)
  overall_rating?: number;
  
  // Emotional reactions
  made_me_cry: boolean;
  made_me_laugh: boolean;
  was_scary: boolean;
  was_inspiring: boolean;
  was_thought_provoking: boolean;
  was_nostalgic: boolean;
  was_romantic: boolean;
  was_intense: boolean;
  
  // Notes
  notes?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface DetailedRatingInput {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  
  // Category ratings
  acting_rating?: number;
  story_rating?: number;
  directing_rating?: number;
  cinematography_rating?: number;
  music_rating?: number;
  production_rating?: number;
  
  // Emotional reactions
  made_me_cry?: boolean;
  made_me_laugh?: boolean;
  was_scary?: boolean;
  was_inspiring?: boolean;
  was_thought_provoking?: boolean;
  was_nostalgic?: boolean;
  was_romantic?: boolean;
  was_intense?: boolean;
  
  // Notes
  notes?: string;
}

export interface ContentDetailedRatings {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  total_ratings: number;
  
  // Average category ratings
  avg_acting?: number;
  avg_story?: number;
  avg_directing?: number;
  avg_cinematography?: number;
  avg_music?: number;
  avg_production?: number;
  avg_overall?: number;
  
  // Emotional reaction percentages
  cry_percentage: number;
  laugh_percentage: number;
  scary_percentage: number;
  inspiring_percentage: number;
  thought_provoking_percentage: number;
  nostalgic_percentage: number;
  romantic_percentage: number;
  intense_percentage: number;
}

export interface DetailedRatingWithUser extends DetailedRating {
  user: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

// Rating categories configuration
export const RATING_CATEGORIES = {
  acting: {
    label: 'Acting',
    description: 'Performance quality of the cast',
    icon: '🎭',
  },
  story: {
    label: 'Story',
    description: 'Plot, narrative, and character development',
    icon: '📖',
  },
  directing: {
    label: 'Directing',
    description: 'Direction and overall vision',
    icon: '🎬',
  },
  cinematography: {
    label: 'Cinematography',
    description: 'Visual style and camera work',
    icon: '📹',
  },
  music: {
    label: 'Music',
    description: 'Soundtrack and audio design',
    icon: '🎵',
  },
  production: {
    label: 'Production',
    description: 'Overall production quality and design',
    icon: '🏭',
  },
} as const;

export type RatingCategory = keyof typeof RATING_CATEGORIES;

// Emotional reactions configuration
export const EMOTIONAL_REACTIONS = {
  made_me_cry: {
    label: 'Made me cry',
    emoji: '😢',
    color: 'text-blue-500',
  },
  made_me_laugh: {
    label: 'Made me laugh',
    emoji: '😂',
    color: 'text-yellow-500',
  },
  was_scary: {
    label: 'Was scary',
    emoji: '😱',
    color: 'text-red-500',
  },
  was_inspiring: {
    label: 'Was inspiring',
    emoji: '✨',
    color: 'text-purple-500',
  },
  was_thought_provoking: {
    label: 'Was thought-provoking',
    emoji: '🤔',
    color: 'text-indigo-500',
  },
  was_nostalgic: {
    label: 'Was nostalgic',
    emoji: '🥺',
    color: 'text-pink-500',
  },
  was_romantic: {
    label: 'Was romantic',
    emoji: '💕',
    color: 'text-rose-500',
  },
  was_intense: {
    label: 'Was intense',
    emoji: '🔥',
    color: 'text-orange-500',
  },
} as const;

export type EmotionalReaction = keyof typeof EMOTIONAL_REACTIONS;

// Helper functions
export function calculateOverallRating(ratings: Partial<Record<RatingCategory, number>>): number | null {
  const values = Object.values(ratings).filter((rating): rating is number => 
    rating !== undefined && rating !== null && rating > 0
  );
  
  if (values.length === 0) return null;
  
  return Math.round((values.reduce((sum, rating) => sum + rating, 0) / values.length) * 10) / 10;
}

export function getRatingCategoryKey(category: RatingCategory): keyof DetailedRating {
  return `${category}_rating` as keyof DetailedRating;
}

export function getEmotionalReactionsSummary(ratings: DetailedRating[]): Record<EmotionalReaction, number> {
  const summary = {} as Record<EmotionalReaction, number>;
  
  Object.keys(EMOTIONAL_REACTIONS).forEach(reaction => {
    summary[reaction as EmotionalReaction] = ratings.filter(
      rating => rating[reaction as keyof DetailedRating] === true
    ).length;
  });
  
  return summary;
}

export function formatRatingDisplay(rating: number | null | undefined): string {
  if (!rating) return 'No rating';
  return `${rating.toFixed(1)}/10`;
}

export function getRatingColor(rating: number | null | undefined): string {
  if (!rating) return 'text-gray-400';
  
  if (rating >= 8) return 'text-green-500';
  if (rating >= 6) return 'text-yellow-500';
  if (rating >= 4) return 'text-orange-500';
  return 'text-red-500';
}