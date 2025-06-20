/**
 * Supabase Continue Watching Client
 * Functions for managing continue watching feature and TV show progress
 */

import { createClient } from '@/lib/supabase/client';
import {
  ContinueWatching,
  ContinueWatchingWithOverrides,
  HomepageContinueWatching,
  ContinueWatchingItem,
  UpdateContinueWatchingInput,
  UserWatchingStats,
  ContinueWatchingQueryOptions,
  TvShowProgress,
  ShowWatchingSummary,
  BingeWatchingSession,
} from '@/types/continue-watching';

const supabase = createClient();

/**
 * Get user's continue watching list
 */
export async function getUserContinueWatching(
  userId?: string,
  options: ContinueWatchingQueryOptions = {}
): Promise<ContinueWatchingItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;
  const limit = options.limit || 20;

  const { data, error } = await supabase.rpc('get_continue_watching_for_user', {
    target_user_id: targetUserId,
    item_limit: limit,
  });

  if (error) {
    console.error('Error fetching continue watching:', error);
    throw new Error('Failed to fetch continue watching list');
  }

  // Transform the data to include additional metadata
  const continueWatchingItems: ContinueWatchingItem[] = (data || []).map((item: any) => ({
    tmdb_tv_id: item.tmdb_tv_id,
    total_episodes_watched: item.total_episodes_watched,
    last_watched_date: item.last_watched_date,
    next_season_number: item.next_season_number,
    next_episode_number: item.next_episode_number,
    is_hidden: item.is_hidden || false,
    is_completed: item.is_completed || false,
    priority_override: item.priority_override,
    notes: item.notes,
    watching_pattern: item.watching_pattern || 'casual_watching',
    days_since_last_episode: item.days_since_last_episode || 0,
    watching_streak: item.watching_streak || 0,
    final_priority_score: item.final_priority_score || 0,
  }));

  // Apply additional filters
  let filteredItems = continueWatchingItems;

  if (!options.include_hidden) {
    filteredItems = filteredItems.filter(item => !item.is_hidden);
  }

  if (!options.include_completed) {
    filteredItems = filteredItems.filter(item => !item.is_completed);
  }

  if (options.min_priority) {
    filteredItems = filteredItems.filter(item => 
      (item.priority_override || 0) >= options.min_priority!
    );
  }

  if (options.max_days_since_last_episode) {
    filteredItems = filteredItems.filter(item => 
      item.days_since_last_episode <= options.max_days_since_last_episode!
    );
  }

  if (options.watching_patterns && options.watching_patterns.length > 0) {
    filteredItems = filteredItems.filter(item => 
      options.watching_patterns!.includes(item.watching_pattern)
    );
  }

  return filteredItems;
}

/**
 * Get homepage continue watching widget data
 */
export async function getHomepageContinueWatching(): Promise<HomepageContinueWatching[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('homepage_continue_watching')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error fetching homepage continue watching:', error);
    throw new Error('Failed to fetch homepage continue watching');
  }

  return data || [];
}

/**
 * Update continue watching entry
 */
export async function updateContinueWatching(
  tmdbTvId: number,
  updates: UpdateContinueWatchingInput
): Promise<ContinueWatching> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to update continue watching');
  }

  const { data, error } = await supabase.rpc('upsert_continue_watching_entry', {
    target_user_id: user.id,
    tv_show_id: tmdbTvId,
    next_season: updates.next_season_number,
    next_episode: updates.next_episode_number,
    is_hidden_flag: updates.is_hidden,
    is_completed_flag: updates.is_completed,
    priority_level: updates.priority_override,
    user_notes: updates.notes,
  });

  if (error) {
    console.error('Error updating continue watching:', error);
    throw new Error('Failed to update continue watching entry');
  }

  return data;
}

/**
 * Hide show from continue watching
 */
export async function hideFromContinueWatching(tmdbTvId: number): Promise<void> {
  await updateContinueWatching(tmdbTvId, { is_hidden: true });
}

/**
 * Mark show as completed
 */
export async function markShowAsCompleted(tmdbTvId: number): Promise<void> {
  await updateContinueWatching(tmdbTvId, { is_completed: true });
}

/**
 * Set custom next episode
 */
export async function setCustomNextEpisode(
  tmdbTvId: number,
  seasonNumber: number,
  episodeNumber: number,
  notes?: string
): Promise<void> {
  await updateContinueWatching(tmdbTvId, {
    next_season_number: seasonNumber,
    next_episode_number: episodeNumber,
    notes,
  });
}

/**
 * Set show priority
 */
export async function setShowPriority(
  tmdbTvId: number,
  priority: number
): Promise<void> {
  if (priority < 1 || priority > 10) {
    throw new Error('Priority must be between 1 and 10');
  }
  
  await updateContinueWatching(tmdbTvId, { priority_override: priority });
}

/**
 * Remove show from continue watching
 */
export async function removeFromContinueWatching(tmdbTvId: number): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to remove from continue watching');
  }

  const { error } = await supabase
    .from('continue_watching')
    .delete()
    .eq('user_id', user.id)
    .eq('tmdb_tv_id', tmdbTvId);

  if (error) {
    console.error('Error removing from continue watching:', error);
    throw new Error('Failed to remove from continue watching');
  }
}

/**
 * Get user watching statistics
 */
export async function getUserWatchingStats(
  userId?: string
): Promise<UserWatchingStats> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;

  const { data, error } = await supabase.rpc('get_user_watching_stats', {
    target_user_id: targetUserId,
  });

  if (error) {
    console.error('Error fetching watching stats:', error);
    throw new Error('Failed to fetch watching statistics');
  }

  return data?.[0] || {
    active_shows: 0,
    completed_shows: 0,
    total_episodes_watched: 0,
    longest_streak: 0,
    favorite_genre: 'Unknown',
    average_episodes_per_show: 0,
    binge_shows: 0,
    regular_shows: 0,
    casual_shows: 0,
  };
}

/**
 * Get TV show progress with detailed episode tracking
 */
export async function getTvShowProgress(
  tmdbTvId: number,
  userId?: string
): Promise<TvShowProgress | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;

  const { data, error } = await supabase
    .from('user_tv_progress')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('tmdb_tv_id', tmdbTvId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No progress found
    }
    console.error('Error fetching TV show progress:', error);
    throw new Error('Failed to fetch TV show progress');
  }

  return data;
}

/**
 * Get all TV shows being watched by user
 */
export async function getAllWatchedTvShows(
  userId?: string
): Promise<TvShowProgress[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;

  const { data, error } = await supabase
    .from('user_tv_progress')
    .select('*')
    .eq('user_id', targetUserId)
    .order('priority_score', { ascending: false });

  if (error) {
    console.error('Error fetching watched TV shows:', error);
    throw new Error('Failed to fetch watched TV shows');
  }

  return data || [];
}

/**
 * Get continue watching for specific shows
 */
export async function getContinueWatchingForShows(
  tmdbTvIds: number[],
  userId?: string
): Promise<ContinueWatchingItem[]> {
  if (tmdbTvIds.length === 0) {
    return [];
  }

  const allItems = await getUserContinueWatching(userId);
  return allItems.filter(item => tmdbTvIds.includes(item.tmdb_tv_id));
}

/**
 * Get binge watching sessions
 */
export async function getBingeWatchingSessions(
  userId?: string,
  activeDays: number = 7
): Promise<BingeWatchingSession[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - activeDays);

  // Get recent episode tracking data
  const { data: episodes, error } = await supabase
    .from('episode_tracking')
    .select('*')
    .eq('user_id', targetUserId)
    .gte('watched_date', dateThreshold.toISOString())
    .order('watched_date', { ascending: true });

  if (error) {
    console.error('Error fetching binge sessions:', error);
    throw new Error('Failed to fetch binge watching sessions');
  }

  // Group episodes by show and detect sessions
  const showEpisodes = (episodes || []).reduce((acc, episode) => {
    if (!acc[episode.tmdb_tv_id]) {
      acc[episode.tmdb_tv_id] = [];
    }
    acc[episode.tmdb_tv_id].push(episode);
    return acc;
  }, {} as Record<number, any[]>);

  const sessions: BingeWatchingSession[] = [];

  Object.entries(showEpisodes).forEach(([tmdbTvIdStr, episodeList]) => {
    const tmdbTvId = parseInt(tmdbTvIdStr);
    
    // Detect sessions (3+ episodes watched within 24 hours)
    let sessionStart: Date | null = null;
    let sessionEpisodes: any[] = [];
    
    episodeList.forEach((episode, index) => {
      const episodeDate = new Date(episode.watched_date);
      
      if (sessionStart === null) {
        sessionStart = episodeDate;
        sessionEpisodes = [episode];
      } else {
        const timeDiff = episodeDate.getTime() - sessionStart.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff <= 24) {
          sessionEpisodes.push(episode);
        } else {
          // End current session if we have 3+ episodes
          if (sessionEpisodes.length >= 3) {
            sessions.push(createBingeSession(tmdbTvId, sessionStart, sessionEpisodes, activeDays));
          }
          
          // Start new session
          sessionStart = episodeDate;
          sessionEpisodes = [episode];
        }
      }
      
      // Handle last episode
      if (index === episodeList.length - 1 && sessionEpisodes.length >= 3) {
        sessions.push(createBingeSession(tmdbTvId, sessionStart!, sessionEpisodes, activeDays));
      }
    });
  });

  return sessions;
}

/**
 * Helper function to create a binge watching session
 */
function createBingeSession(
  tmdbTvId: number,
  sessionStart: Date,
  episodes: any[],
  activeDays: number
): BingeWatchingSession {
  const seasonNumbers = [...new Set(episodes.map(ep => ep.season_number))];
  const totalRuntime = episodes.length * 45; // Assume 45 min per episode
  const lastEpisodeDate = new Date(episodes[episodes.length - 1].watched_date);
  const isActive = (Date.now() - lastEpisodeDate.getTime()) / (1000 * 60 * 60 * 24) <= activeDays;

  return {
    tmdb_tv_id: tmdbTvId,
    show_name: '', // Would need TMDB integration
    session_start: sessionStart.toISOString(),
    episodes_in_session: episodes.length,
    total_runtime_minutes: totalRuntime,
    season_numbers: seasonNumbers,
    is_active: isActive,
  };
}

/**
 * Get shows that need attention (haven't been watched in a while)
 */
export async function getShowsNeedingAttention(
  daysSinceLastEpisode: number = 14,
  userId?: string
): Promise<ContinueWatchingItem[]> {
  const items = await getUserContinueWatching(userId, {
    max_days_since_last_episode: 90, // Get shows watched in last 3 months
    include_hidden: false,
    include_completed: false,
  });

  return items.filter(item => item.days_since_last_episode >= daysSinceLastEpisode);
}

/**
 * Get trending shows among followed users
 */
export async function getTrendingShowsAmongFollows(): Promise<{
  tmdb_tv_id: number;
  watchers_count: number;
  recent_episodes: number;
}[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  // Get users that current user follows
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  if (!following || following.length === 0) {
    return [];
  }

  const followingIds = following.map(f => f.following_id);

  // Get recent episode activity from followed users
  const { data: recentActivity, error } = await supabase
    .from('episode_tracking')
    .select('tmdb_tv_id, user_id')
    .in('user_id', followingIds)
    .gte('watched_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
    .order('watched_date', { ascending: false });

  if (error) {
    console.error('Error fetching trending shows:', error);
    throw new Error('Failed to fetch trending shows');
  }

  // Group by show and count watchers
  const showStats = (recentActivity || []).reduce((acc, activity) => {
    if (!acc[activity.tmdb_tv_id]) {
      acc[activity.tmdb_tv_id] = {
        watchers: new Set(),
        episodes: 0,
      };
    }
    acc[activity.tmdb_tv_id].watchers.add(activity.user_id);
    acc[activity.tmdb_tv_id].episodes++;
    return acc;
  }, {} as Record<number, { watchers: Set<string>; episodes: number }>);

  return Object.entries(showStats)
    .map(([tmdbTvIdStr, stats]) => ({
      tmdb_tv_id: parseInt(tmdbTvIdStr),
      watchers_count: stats.watchers.size,
      recent_episodes: stats.episodes,
    }))
    .sort((a, b) => b.watchers_count - a.watchers_count)
    .slice(0, 10);
}