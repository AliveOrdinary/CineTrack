/**
 * TypeScript types for the Content Recommendations System
 */

export type RecommendationStatus = 'pending' | 'accepted' | 'declined' | 'watched';

export type RecommendationTag = 
  | 'horror' 
  | 'comedy' 
  | 'drama' 
  | 'action' 
  | 'romance' 
  | 'sci-fi' 
  | 'fantasy' 
  | 'thriller' 
  | 'documentary' 
  | 'classic' 
  | 'must-watch' 
  | 'binge-watch' 
  | 'date-night' 
  | 'family-friendly' 
  | 'comfort-watch' 
  | 'mind-bending' 
  | 'character-driven' 
  | 'visually-stunning' 
  | 'thought-provoking' 
  | 'feel-good' 
  | 'tearjerker' 
  | 'underrated' 
  | 'trending';

// Base recommendation interface from database
export interface ContentRecommendation {
  id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  sender_id: string;
  recipient_id: string;
  message?: string;
  personal_rating?: number;
  recommended_date: string;
  status: RecommendationStatus;
  response_date?: string;
  response_message?: string;
  is_urgent: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// Recommendation with user information
export interface ContentRecommendationWithUsers {
  id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  sender: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  recipient: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  message?: string;
  personal_rating?: number;
  recommended_date: string;
  status: RecommendationStatus;
  response_date?: string;
  response_message?: string;
  is_urgent: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// Input type for creating a new recommendation
export interface CreateRecommendationInput {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  recipient_id: string;
  message?: string;
  personal_rating?: number;
  is_urgent?: boolean;
  tags?: string[];
}

// Input type for updating recommendation status
export interface UpdateRecommendationStatusInput {
  status: RecommendationStatus;
  response_message?: string;
}

// Recommendation stats from the database view
export interface RecommendationStats {
  user_id: string;
  display_name: string;
  recommendations_sent: number;
  recommendations_received: number;
  recommendations_accepted: number;
  recommendations_watched: number;
  avg_rating_given?: number;
  last_recommendation_date?: string;
}

// Filter and sorting options for recommendations
export interface RecommendationFilters {
  status?: RecommendationStatus[];
  media_type?: ('movie' | 'tv')[];
  tags?: string[];
  is_urgent?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface RecommendationSortOptions {
  field: 'created_at' | 'recommended_date' | 'personal_rating' | 'status';
  direction: 'asc' | 'desc';
}

// Pagination options
export interface RecommendationPaginationOptions {
  limit: number;
  offset: number;
}

// Combined query options
export interface RecommendationQueryOptions {
  filters?: RecommendationFilters;
  sort?: RecommendationSortOptions;
  pagination?: RecommendationPaginationOptions;
}

// Recommendation inbox/outbox types
export interface RecommendationInbox {
  pending: ContentRecommendationWithUsers[];
  accepted: ContentRecommendationWithUsers[];
  declined: ContentRecommendationWithUsers[];
  watched: ContentRecommendationWithUsers[];
  total_count: number;
}

export interface RecommendationOutbox {
  pending: ContentRecommendationWithUsers[];
  accepted: ContentRecommendationWithUsers[];
  declined: ContentRecommendationWithUsers[];
  watched: ContentRecommendationWithUsers[];
  total_count: number;
}

// Predefined recommendation tags with metadata
export const RECOMMENDATION_TAGS: Record<RecommendationTag, {
  label: string;
  emoji: string;
  description: string;
  color: string;
}> = {
  horror: {
    label: 'Horror',
    emoji: '😱',
    description: 'Scary and suspenseful content',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  },
  comedy: {
    label: 'Comedy',
    emoji: '😂',
    description: 'Funny and lighthearted content',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  },
  drama: {
    label: 'Drama',
    emoji: '🎭',
    description: 'Emotional and character-driven stories',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  action: {
    label: 'Action',
    emoji: '💥',
    description: 'High-energy and thrilling content',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  },
  romance: {
    label: 'Romance',
    emoji: '💕',
    description: 'Love stories and romantic content',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
  },
  'sci-fi': {
    label: 'Sci-Fi',
    emoji: '🚀',
    description: 'Science fiction and futuristic themes',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  fantasy: {
    label: 'Fantasy',
    emoji: '🧙‍♂️',
    description: 'Magical and fantastical worlds',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
  },
  thriller: {
    label: 'Thriller',
    emoji: '🔪',
    description: 'Suspenseful and intense content',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  },
  documentary: {
    label: 'Documentary',
    emoji: '📽️',
    description: 'Educational and factual content',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  classic: {
    label: 'Classic',
    emoji: '🏛️',
    description: 'Timeless and influential content',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
  },
  'must-watch': {
    label: 'Must Watch',
    emoji: '⭐',
    description: 'Essential viewing recommendation',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  },
  'binge-watch': {
    label: 'Binge Watch',
    emoji: '📺',
    description: 'Perfect for marathon viewing',
    color: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200'
  },
  'date-night': {
    label: 'Date Night',
    emoji: '🍿',
    description: 'Great for romantic evenings',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
  },
  'family-friendly': {
    label: 'Family Friendly',
    emoji: '👨‍👩‍👧‍👦',
    description: 'Suitable for all ages',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
  },
  'comfort-watch': {
    label: 'Comfort Watch',
    emoji: '☕',
    description: 'Cozy and comforting content',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
  },
  'mind-bending': {
    label: 'Mind Bending',
    emoji: '🧠',
    description: 'Complex and thought-provoking',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
  },
  'character-driven': {
    label: 'Character Driven',
    emoji: '🎪',
    description: 'Focus on character development',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
  },
  'visually-stunning': {
    label: 'Visually Stunning',
    emoji: '🎨',
    description: 'Beautiful cinematography and visuals',
    color: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200'
  },
  'thought-provoking': {
    label: 'Thought Provoking',
    emoji: '💭',
    description: 'Makes you think deeply',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
  },
  'feel-good': {
    label: 'Feel Good',
    emoji: '😊',
    description: 'Uplifting and positive content',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  tearjerker: {
    label: 'Tearjerker',
    emoji: '😭',
    description: 'Emotional and moving content',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  underrated: {
    label: 'Underrated',
    emoji: '💎',
    description: 'Hidden gems and overlooked content',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  trending: {
    label: 'Trending',
    emoji: '🔥',
    description: 'Currently popular content',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
};

// Status display configurations
export const RECOMMENDATION_STATUS_CONFIG: Record<RecommendationStatus, {
  label: string;
  emoji: string;
  description: string;
  color: string;
}> = {
  pending: {
    label: 'Pending',
    emoji: '⏳',
    description: 'Waiting for response',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  },
  accepted: {
    label: 'Accepted',
    emoji: '✅',
    description: 'Added to watchlist',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  declined: {
    label: 'Declined',
    emoji: '❌',
    description: 'Not interested',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  },
  watched: {
    label: 'Watched',
    emoji: '👀',
    description: 'Already watched',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }
};

// Utility functions
export function getTagConfig(tag: string) {
  return RECOMMENDATION_TAGS[tag as RecommendationTag] || {
    label: tag,
    emoji: '🏷️',
    description: 'Custom tag',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  };
}

export function getStatusConfig(status: RecommendationStatus) {
  return RECOMMENDATION_STATUS_CONFIG[status];
}

export function formatRecommendationDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${Math.floor(diffInDays)} day${Math.floor(diffInDays) !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function validatePersonalRating(rating?: number): boolean {
  if (rating === undefined) return true;
  return rating >= 1 && rating <= 10;
}

export function canUpdateRecommendation(
  recommendation: ContentRecommendation,
  currentUserId: string
): boolean {
  return (
    recommendation.recipient_id === currentUserId &&
    recommendation.status === 'pending'
  );
}

export function canDeleteRecommendation(
  recommendation: ContentRecommendation,
  currentUserId: string
): boolean {
  return (
    recommendation.sender_id === currentUserId &&
    recommendation.status === 'pending'
  );
}