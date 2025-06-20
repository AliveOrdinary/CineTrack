/**
 * TypeScript types for the Social Watching Tags System
 */

export type WatchingContext = 'theater' | 'home' | 'streaming' | 'other';

// Base social watching interface from database
export interface SocialWatching {
  id: string;
  watched_content_id: string;
  watched_with_user_id: string;
  notes?: string;
  watching_context: WatchingContext;
  created_at: string;
  updated_at: string;
}

// Social watching with user information
export interface SocialWatchingWithUser {
  id: string;
  watched_content_id: string;
  watched_with_user_id: string;
  notes?: string;
  watching_context: WatchingContext;
  created_at: string;
  updated_at: string;
  watched_with_user: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

// Input type for creating a new social watching entry
export interface CreateSocialWatchingInput {
  watched_content_id: string;
  watched_with_user_id: string;
  notes?: string;
  watching_context: WatchingContext;
}

// Input type for updating social watching entry
export interface UpdateSocialWatchingInput {
  notes?: string;
  watching_context?: WatchingContext;
}

// Social watching statistics from the database view
export interface SocialWatchingStats {
  user_id: string;
  display_name: string;
  unique_watch_partners: number;
  total_social_watches: number;
  theater_watches: number;
  home_watches: number;
  streaming_watches: number;
  last_social_watch_date?: string;
}

// Watch partner relationship data
export interface WatchPartner {
  partner_id: string;
  partner_name: string;
  partner_avatar?: string;
  shared_watches: number;
  last_watched_together: string;
}

// Watch partners from the database view
export interface WatchPartnerRelationship {
  user1_id: string;
  user2_id: string;
  user1_name: string;
  user2_name: string;
  user1_avatar?: string;
  user2_avatar?: string;
  total_shared_watches: number;
  last_watched_together: string;
}

// Extended watched content with social watching info
export interface WatchedContentWithSocialWatching {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  watched_date?: string;
  user_rating?: number;
  is_rewatch?: boolean;
  rewatch_count?: number;
  notes?: string;
  contains_spoilers?: boolean;
  visibility?: 'public' | 'followers' | 'private';
  created_at: string;
  updated_at: string;
  social_watching?: SocialWatchingWithUser[];
}

// Predefined watching contexts with metadata
export const WATCHING_CONTEXTS: Record<WatchingContext, {
  label: string;
  emoji: string;
  description: string;
  color: string;
}> = {
  theater: {
    label: 'Theater',
    emoji: '🎬',
    description: 'Watched at a movie theater',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  },
  home: {
    label: 'At Home',
    emoji: '🏠',
    description: 'Watched at home together',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  streaming: {
    label: 'Streaming',
    emoji: '📱',
    description: 'Watched via streaming service',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  other: {
    label: 'Other',
    emoji: '📺',
    description: 'Other watching context',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
};

// Social watching aggregation for content
export interface ContentSocialWatchingAggregation {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  total_social_watches: number;
  unique_watch_groups: number;
  most_common_context: WatchingContext;
  theater_percentage: number;
  home_percentage: number;
  streaming_percentage: number;
  other_percentage: number;
}

// User's social watching activity summary
export interface UserSocialWatchingActivity {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  total_social_watches: number;
  unique_partners: number;
  favorite_context: WatchingContext;
  most_frequent_partner?: WatchPartner;
  recent_social_watches: SocialWatchingWithUser[];
}

// Filter and sorting options for social watching
export interface SocialWatchingFilters {
  watching_context?: WatchingContext[];
  partner_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface SocialWatchingSortOptions {
  field: 'created_at' | 'watching_context' | 'partner_name';
  direction: 'asc' | 'desc';
}

// Pagination options
export interface SocialWatchingPaginationOptions {
  limit: number;
  offset: number;
}

// Combined query options
export interface SocialWatchingQueryOptions {
  filters?: SocialWatchingFilters;
  sort?: SocialWatchingSortOptions;
  pagination?: SocialWatchingPaginationOptions;
}

// Utility functions
export function getWatchingContextConfig(context: WatchingContext) {
  return WATCHING_CONTEXTS[context];
}

export function formatSocialWatchingDate(dateString: string): string {
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

export function getMostCommonWatchingContext(socialWatches: SocialWatching[]): WatchingContext {
  if (socialWatches.length === 0) return 'home';
  
  const contextCounts = socialWatches.reduce((counts, watch) => {
    counts[watch.watching_context] = (counts[watch.watching_context] || 0) + 1;
    return counts;
  }, {} as Record<WatchingContext, number>);

  return Object.entries(contextCounts).reduce((a, b) => 
    contextCounts[a[0] as WatchingContext] > contextCounts[b[0] as WatchingContext] ? a : b
  )[0] as WatchingContext;
}

export function calculateWatchingContextPercentages(socialWatches: SocialWatching[]): {
  theater: number;
  home: number;
  streaming: number;
  other: number;
} {
  if (socialWatches.length === 0) {
    return { theater: 0, home: 0, streaming: 0, other: 0 };
  }

  const contextCounts = socialWatches.reduce((counts, watch) => {
    counts[watch.watching_context] = (counts[watch.watching_context] || 0) + 1;
    return counts;
  }, {} as Record<WatchingContext, number>);

  const total = socialWatches.length;

  return {
    theater: Math.round(((contextCounts.theater || 0) / total) * 100),
    home: Math.round(((contextCounts.home || 0) / total) * 100),
    streaming: Math.round(((contextCounts.streaming || 0) / total) * 100),
    other: Math.round(((contextCounts.other || 0) / total) * 100),
  };
}

export function groupSocialWatchesByPartner(socialWatches: SocialWatchingWithUser[]): Record<string, SocialWatchingWithUser[]> {
  return socialWatches.reduce((groups, watch) => {
    const partnerId = watch.watched_with_user.id;
    if (!groups[partnerId]) {
      groups[partnerId] = [];
    }
    groups[partnerId].push(watch);
    return groups;
  }, {} as Record<string, SocialWatchingWithUser[]>);
}

export function getTopWatchPartners(socialWatches: SocialWatchingWithUser[], limit: number = 5): WatchPartner[] {
  const partnerGroups = groupSocialWatchesByPartner(socialWatches);
  
  return Object.entries(partnerGroups)
    .map(([partnerId, watches]) => ({
      partner_id: partnerId,
      partner_name: watches[0].watched_with_user.display_name,
      partner_avatar: watches[0].watched_with_user.avatar_url,
      shared_watches: watches.length,
      last_watched_together: watches.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0].created_at,
    }))
    .sort((a, b) => b.shared_watches - a.shared_watches)
    .slice(0, limit);
}

export function canEditSocialWatching(
  socialWatch: SocialWatching,
  currentUserId: string,
  watchedContentUserId: string
): boolean {
  return currentUserId === watchedContentUserId;
}

export function canDeleteSocialWatching(
  socialWatch: SocialWatching,
  currentUserId: string,
  watchedContentUserId: string
): boolean {
  return currentUserId === watchedContentUserId;
}