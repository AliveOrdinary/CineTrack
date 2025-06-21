import { createClient } from './client';

export interface QueryOptions {
  select?: string;
  limit?: number;
  offset?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export interface CachedQuery {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
}

// In-memory cache for frequently accessed data
const queryCache = new Map<string, CachedQuery>();

// Cache cleanup interval (5 minutes)
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupInterval: NodeJS.Timeout | null = null;

// Initialize cache cleanup
function initializeCacheCleanup() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, cached] of Array.from(queryCache.entries())) {
      if (now - cached.timestamp > cached.ttl) {
        queryCache.delete(key);
      }
    }
  }, CACHE_CLEANUP_INTERVAL);
}

// Generate cache key from query parameters
function generateCacheKey(table: string, params: any): string {
  return `${table}:${JSON.stringify(params)}`;
}

// Generic optimized query function
export async function optimizedQuery<T>(
  table: string, 
  params: any, 
  options: QueryOptions = {}
): Promise<T[]> {
  initializeCacheCleanup();
  
  const { 
    select = '*', 
    limit, 
    offset, 
    cache = false, 
    cacheTTL = 5 * 60 * 1000 // 5 minutes default 
  } = options;
  
  const cacheKey = generateCacheKey(table, { ...params, select, limit, offset });
  
  // Check cache first
  if (cache) {
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T[];
    }
  }
  
  const supabase = createClient();
  let query = supabase.from(table).select(select);
  
  // Apply filters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });
  
  // Apply pagination
  if (limit) {
    if (offset) {
      query = query.range(offset, offset + limit - 1);
    } else {
      query = query.limit(limit);
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  const result = (data || []) as T[];
  
  // Cache the result
  if (cache) {
    queryCache.set(cacheKey, {
      key: cacheKey,
      data: result,
      timestamp: Date.now(),
      ttl: cacheTTL
    });
  }
  
  return result;
}

// Optimized batch query function
export async function batchQuery<T>(
  queries: Array<{
    table: string;
    params: any;
    options?: QueryOptions;
  }>
): Promise<T[][]> {
  const promises = queries.map(({ table, params, options }) => 
    optimizedQuery<T>(table, params, options)
  );
  
  return Promise.all(promises);
}

// Optimized count query with caching
export async function optimizedCount(
  table: string,
  params: any = {},
  cacheTTL: number = 2 * 60 * 1000 // 2 minutes for counts
): Promise<number> {
  const cacheKey = generateCacheKey(`${table}:count`, params);
  
  // Check cache
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  
  const supabase = createClient();
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  
  // Apply filters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
  });
  
  const { count, error } = await query;
  
  if (error) {
    throw error;
  }
  
  const result = count || 0;
  
  // Cache the result
  queryCache.set(cacheKey, {
    key: cacheKey,
    data: result,
    timestamp: Date.now(),
    ttl: cacheTTL
  });
  
  return result;
}

// Clear cache for specific table/pattern
export function invalidateCache(pattern?: string) {
  if (!pattern) {
    queryCache.clear();
    return;
  }
  
  for (const key of Array.from(queryCache.keys())) {
    if (key.includes(pattern)) {
      queryCache.delete(key);
    }
  }
}

// Get cache stats
export function getCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const cached of Array.from(queryCache.values())) {
    if (now - cached.timestamp < cached.ttl) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }
  
  return {
    totalEntries: queryCache.size,
    validEntries,
    expiredEntries,
    cacheHitRate: validEntries / Math.max(queryCache.size, 1)
  };
}

// Optimized queries for common operations
export const optimizedQueries = {
  // Get user's watched content with caching
  getUserWatchedContent: async (userId: string, limit?: number) => {
    return optimizedQuery('watched_content', 
      { user_id: userId }, 
      { 
        limit, 
        cache: true, 
        cacheTTL: 2 * 60 * 1000,
        select: 'id, tmdb_id, media_type, watched_date, user_rating, created_at'
      }
    );
  },
  
  // Get user's watchlist with caching
  getUserWatchlist: async (userId: string, limit?: number) => {
    return optimizedQuery('watchlist_content', 
      { user_id: userId }, 
      { 
        limit, 
        cache: true, 
        cacheTTL: 5 * 60 * 1000,
        select: 'id, tmdb_id, media_type, priority, added_date'
      }
    );
  },
  
  // Get user's reviews with minimal data
  getUserReviews: async (userId: string, limit?: number) => {
    return optimizedQuery('reviews', 
      { user_id: userId }, 
      { 
        limit, 
        cache: true, 
        cacheTTL: 10 * 60 * 1000,
        select: 'id, tmdb_id, media_type, rating, created_at, is_spoiler'
      }
    );
  },
  
  // Get content reviews with user info (no caching for dynamic content)
  getContentReviews: async (tmdbId: number, mediaType: string, limit?: number) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id, rating, content, is_spoiler, created_at,
        users!inner(id, display_name, avatar_url)
      `)
      .eq('tmdb_id', tmdbId)
      .eq('media_type', mediaType)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(limit || 10);
    
    if (error) throw error;
    return data || [];
  },
  
  // Get user stats with aggressive caching
  getUserStats: async (userId: string) => {
    const cacheKey = `user_stats:${userId}`;
    const cached = queryCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) { // 10 minutes
      return cached.data;
    }
    
    // Use batch queries for better performance
    const [moviesCount, tvCount, reviewsCount, watchlistCount] = await Promise.all([
      optimizedCount('watched_content', { user_id: userId, media_type: 'movie' }),
      optimizedCount('watched_content', { user_id: userId, media_type: 'tv' }),
      optimizedCount('reviews', { user_id: userId }),
      optimizedCount('watchlist_content', { user_id: userId })
    ]);
    
    const stats = {
      moviesWatched: moviesCount,
      tvShowsWatched: tvCount,
      reviewsWritten: reviewsCount,
      watchlistItems: watchlistCount
    };
    
    // Cache for 10 minutes
    queryCache.set(cacheKey, {
      key: cacheKey,
      data: stats,
      timestamp: Date.now(),
      ttl: 10 * 60 * 1000
    });
    
    return stats;
  }
};

// Cleanup function
export function cleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  queryCache.clear();
}