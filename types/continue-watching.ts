/**
 * TypeScript types for the Continue Watching Feature
 */

export type WatchingPattern = 'binge_watching' | 'regular_watching' | 'casual_watching' | 'inactive';
export type UrgencyLevel = 'fresh' | 'recent' | 'old' | 'stale';
export type RecommendationStrength = 'high' | 'medium' | 'low';

// Base continue watching entry from database
export interface ContinueWatching {
  id: string;
  user_id: string;
  tmdb_tv_id: number;
  next_season_number?: number;
  next_episode_number?: number;
  is_hidden: boolean;
  is_completed: boolean;
  priority_override?: number;
  notes?: string;
  last_updated_by_user?: string;
  created_at: string;
  updated_at: string;
}

// TV show progress data
export interface TvShowProgress {
  user_id: string;
  tmdb_tv_id: number;
  total_episodes_watched: number;
  last_watched_date: string;
  last_episode_added: string;
  latest_season: number;
  latest_episode_in_season: number;
  next_episode_number: number;
  next_season_number: number;
  is_actively_watching: boolean;
  priority_score: number;
  user_name: string;
  user_avatar?: string;
  watching_streak: number;
}

// Continue watching with overrides and calculated data
export interface ContinueWatchingWithOverrides {
  user_id: string;
  tmdb_tv_id: number;
  total_episodes_watched: number;
  last_watched_date: string;
  last_episode_added: string;
  latest_season: number;
  latest_episode_in_season: number;
  next_season_number: number;
  next_episode_number: number;
  is_actively_watching: boolean;
  priority_score: number;
  user_name: string;
  user_avatar?: string;
  watching_streak: number;
  continue_watching_id?: string;
  final_next_season: number;
  final_next_episode: number;
  is_hidden: boolean;
  is_completed: boolean;
  priority_override?: number;
  notes?: string;
  last_updated_by_user?: string;
  final_priority_score: number;
  watching_pattern: WatchingPattern;
  days_since_last_episode: number;
}

// Homepage continue watching with additional metadata
export interface HomepageContinueWatching extends ContinueWatchingWithOverrides {
  urgency_level: UrgencyLevel;
  recommendation_strength: RecommendationStrength;
}

// Continue watching item with TMDB data
export interface ContinueWatchingItem {
  tmdb_tv_id: number;
  show_name?: string;
  show_poster_path?: string;
  show_backdrop_path?: string;
  show_overview?: string;
  show_first_air_date?: string;
  show_status?: string;
  total_episodes_watched: number;
  last_watched_date: string;
  next_season_number: number;
  next_episode_number: number;
  next_episode_name?: string;
  next_episode_overview?: string;
  next_episode_air_date?: string;
  next_episode_still_path?: string;
  is_hidden: boolean;
  is_completed: boolean;
  priority_override?: number;
  notes?: string;
  watching_pattern: WatchingPattern;
  days_since_last_episode: number;
  watching_streak: number;
  final_priority_score: number;
  urgency_level?: UrgencyLevel;
  recommendation_strength?: RecommendationStrength;
}

// Input types for updating continue watching
export interface UpdateContinueWatchingInput {
  next_season_number?: number;
  next_episode_number?: number;
  is_hidden?: boolean;
  is_completed?: boolean;
  priority_override?: number;
  notes?: string;
}

// User watching statistics
export interface UserWatchingStats {
  active_shows: number;
  completed_shows: number;
  total_episodes_watched: number;
  longest_streak: number;
  favorite_genre: string;
  average_episodes_per_show: number;
  binge_shows: number;
  regular_shows: number;
  casual_shows: number;
}

// Continue watching query options
export interface ContinueWatchingQueryOptions {
  include_hidden?: boolean;
  include_completed?: boolean;
  min_priority?: number;
  max_days_since_last_episode?: number;
  watching_patterns?: WatchingPattern[];
  limit?: number;
  offset?: number;
}

// Next episode information
export interface NextEpisodeInfo {
  season_number: number;
  episode_number: number;
  name?: string;
  overview?: string;
  air_date?: string;
  still_path?: string;
  runtime?: number;
  vote_average?: number;
}

// Season progress summary
export interface SeasonProgressSummary {
  season_number: number;
  total_episodes: number;
  watched_episodes: number;
  percentage_complete: number;
  next_episode?: NextEpisodeInfo;
  is_complete: boolean;
}

// Show watching summary
export interface ShowWatchingSummary {
  tmdb_tv_id: number;
  show_name: string;
  total_seasons: number;
  total_episodes: number;
  watched_episodes: number;
  overall_percentage: number;
  current_season: number;
  seasons: SeasonProgressSummary[];
  next_episode?: NextEpisodeInfo;
  is_complete: boolean;
  watching_pattern: WatchingPattern;
  days_since_last_episode: number;
  estimated_time_to_complete?: number; // in minutes
}

// Binge watching session
export interface BingeWatchingSession {
  tmdb_tv_id: number;
  show_name: string;
  session_start: string;
  episodes_in_session: number;
  total_runtime_minutes: number;
  season_numbers: number[];
  is_active: boolean;
}

// Continue watching categories
export type ContinueWatchingCategory = 
  | 'up_next'
  | 'binge_worthy'
  | 'almost_done'
  | 'recently_started'
  | 'taking_break'
  | 'seasonal_returns';

// Categorized continue watching
export interface CategorizedContinueWatching {
  category: ContinueWatchingCategory;
  items: ContinueWatchingItem[];
  count: number;
}

// Watch time estimates
export interface WatchTimeEstimate {
  next_episode_minutes?: number;
  season_remaining_minutes?: number;
  series_remaining_minutes?: number;
  estimated_completion_date?: string;
}

// Watching recommendation
export interface WatchingRecommendation {
  tmdb_tv_id: number;
  recommendation_type: 'continue_binge' | 'catch_up' | 'new_season' | 'finishing_touch';
  reasoning: string;
  urgency_score: number;
  time_commitment: string;
}

// Utility functions and configurations
export const WATCHING_PATTERN_CONFIG: Record<WatchingPattern, {
  label: string;
  icon: string;
  description: string;
  color: string;
}> = {
  binge_watching: {
    label: 'Binge Watching',
    icon: '🍿',
    description: 'Watching multiple episodes regularly',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  },
  regular_watching: {
    label: 'Regular Viewing',
    icon: '📺',
    description: 'Consistent weekly viewing',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  casual_watching: {
    label: 'Casual Viewing',
    icon: '🎭',
    description: 'Occasional episode watching',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  inactive: {
    label: 'Inactive',
    icon: '⏸️',
    description: 'Not currently watching',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
};

export const URGENCY_LEVEL_CONFIG: Record<UrgencyLevel, {
  label: string;
  icon: string;
  description: string;
  color: string;
}> = {
  fresh: {
    label: 'Fresh',
    icon: '🔥',
    description: 'Recently watched, momentum is high',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  recent: {
    label: 'Recent',
    icon: '🕒',
    description: 'Good time to continue',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  },
  old: {
    label: 'Getting Old',
    icon: '⏰',
    description: 'Been a while since last episode',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  },
  stale: {
    label: 'Stale',
    icon: '❄️',
    description: 'Might need a recap before continuing',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
};

export const RECOMMENDATION_STRENGTH_CONFIG: Record<RecommendationStrength, {
  label: string;
  icon: string;
  description: string;
  color: string;
}> = {
  high: {
    label: 'Highly Recommended',
    icon: '⭐',
    description: 'Perfect time to continue this show',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  medium: {
    label: 'Good Choice',
    icon: '👍',
    description: 'Good option for your next watch',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  low: {
    label: 'Consider Later',
    icon: '💭',
    description: 'Might want to catch up on other shows first',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
};

// Utility functions
export function getWatchingPatternConfig(pattern: WatchingPattern) {
  return WATCHING_PATTERN_CONFIG[pattern];
}

export function getUrgencyLevelConfig(level: UrgencyLevel) {
  return URGENCY_LEVEL_CONFIG[level];
}

export function getRecommendationStrengthConfig(strength: RecommendationStrength) {
  return RECOMMENDATION_STRENGTH_CONFIG[strength];
}

export function formatDaysSinceLastEpisode(days: number): string {
  if (days < 1) return 'Today';
  if (days < 2) return 'Yesterday';
  if (days < 7) return `${Math.floor(days)} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function formatWatchingStreak(streak: number): string {
  if (streak === 0) return 'No streak';
  if (streak === 1) return '1 day streak';
  if (streak < 7) return `${streak} day streak`;
  if (streak < 30) return `${Math.floor(streak / 7)} week streak`;
  return `${Math.floor(streak / 30)} month streak`;
}

export function calculateTimeToFinishSeason(
  remainingEpisodes: number,
  averageEpisodeLength: number = 45
): string {
  const totalMinutes = remainingEpisodes * averageEpisodeLength;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function getNextEpisodeLabel(season: number, episode: number): string {
  return `S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`;
}

export function shouldShowContinueWatching(item: ContinueWatchingItem): boolean {
  return !item.is_hidden && 
         !item.is_completed && 
         item.days_since_last_episode <= 90;
}

export function categorizeContinueWatchingItems(
  items: ContinueWatchingItem[]
): CategorizedContinueWatching[] {
  const categories: Record<ContinueWatchingCategory, ContinueWatchingItem[]> = {
    up_next: [],
    binge_worthy: [],
    almost_done: [],
    recently_started: [],
    taking_break: [],
    seasonal_returns: []
  };

  items.forEach(item => {
    // Up Next: Fresh shows with high recommendation strength
    if (item.urgency_level === 'fresh' && item.recommendation_strength === 'high') {
      categories.up_next.push(item);
    }
    // Binge Worthy: Shows being binge watched
    else if (item.watching_pattern === 'binge_watching') {
      categories.binge_worthy.push(item);
    }
    // Recently Started: Low episode count, recent activity
    else if (item.total_episodes_watched <= 5 && item.days_since_last_episode <= 7) {
      categories.recently_started.push(item);
    }
    // Taking a Break: Old but not stale
    else if (item.urgency_level === 'old') {
      categories.taking_break.push(item);
    }
    // Seasonal Returns: Very old shows that might be worth revisiting
    else if (item.urgency_level === 'stale') {
      categories.seasonal_returns.push(item);
    }
    // Default to Up Next for everything else
    else {
      categories.up_next.push(item);
    }
  });

  return Object.entries(categories)
    .filter(([_, items]) => items.length > 0)
    .map(([category, items]) => ({
      category: category as ContinueWatchingCategory,
      items,
      count: items.length
    }));
}

export function generateWatchingRecommendations(
  items: ContinueWatchingItem[]
): WatchingRecommendation[] {
  return items
    .slice(0, 3) // Top 3 recommendations
    .map(item => {
      let recommendation_type: WatchingRecommendation['recommendation_type'] = 'continue_binge';
      let reasoning = '';
      let urgency_score = 0;
      let time_commitment = '';

      if (item.watching_pattern === 'binge_watching') {
        recommendation_type = 'continue_binge';
        reasoning = `You've been binge watching this show! Keep the momentum going.`;
        urgency_score = 9;
        time_commitment = '45 minutes';
      } else if (item.days_since_last_episode > 14) {
        recommendation_type = 'catch_up';
        reasoning = `It's been ${Math.floor(item.days_since_last_episode)} days since your last episode. Time to catch up!`;
        urgency_score = 7;
        time_commitment = '45 minutes';
      } else if (item.total_episodes_watched >= 20) {
        recommendation_type = 'finishing_touch';
        reasoning = `You've invested a lot of time in this show. See how it ends!`;
        urgency_score = 8;
        time_commitment = '45 minutes';
      } else {
        recommendation_type = 'new_season';
        reasoning = `Perfect time to continue your journey with this show.`;
        urgency_score = 6;
        time_commitment = '45 minutes';
      }

      return {
        tmdb_tv_id: item.tmdb_tv_id,
        recommendation_type,
        reasoning,
        urgency_score,
        time_commitment
      };
    });
}