/**
 * TMDB API Cache Implementation
 * Provides multi-layer caching for TMDB API responses to improve performance
 */

import { logger } from '@/lib/error-logger';

export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  enablePersistence?: boolean; // Whether to use localStorage/sessionStorage
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// Default cache configurations for different types of TMDB data
export const CACHE_CONFIGS = {
  // Movie/TV details - rarely change, long TTL
  details: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 500,
    enablePersistence: true,
  },
  // Search results - change frequently, short TTL
  search: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 100,
    enablePersistence: false,
  },
  // Trending content - changes daily
  trending: {
    ttl: 60 * 60 * 1000, // 1 hour
    maxSize: 50,
    enablePersistence: true,
  },
  // Discover results - medium TTL
  discover: {
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 200,
    enablePersistence: false,
  },
  // Person details - rarely change
  person: {
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxSize: 200,
    enablePersistence: true,
  },
  // Credits - rarely change
  credits: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 300,
    enablePersistence: true,
  },
  // Videos/trailers - rarely change
  videos: {
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxSize: 200,
    enablePersistence: true,
  },
  // Watch providers - change occasionally
  providers: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 100,
    enablePersistence: true,
  },
} as const;

export class TMDBCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = { hits: 0, misses: 0 };
  private readonly namespace: string;
  private readonly config: Required<CacheConfig>;
  private readonly isClient = typeof window !== 'undefined';

  constructor(namespace: string, config: CacheConfig = {}) {
    this.namespace = namespace;
    this.config = {
      ttl: config.ttl || 30 * 60 * 1000, // 30 minutes default
      maxSize: config.maxSize || 100,
      enablePersistence: config.enablePersistence ?? false,
      ...config,
    };

    // Load persisted cache on client
    if (this.isClient && this.config.enablePersistence) {
      this.loadFromStorage();
    }

    // Set up periodic cleanup
    this.startCleanupTimer();
  }

  /**
   * Generate cache key from endpoint and parameters
   */
  private generateKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${this.namespace}:${endpoint}:${this.hashString(paramString)}`;
  }

  /**
   * Simple hash function for parameter serialization
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get data from cache
   */
  get<T>(endpoint: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(endpoint, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug(`Cache expired for ${key}`, { endpoint, namespace: this.namespace });
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    logger.debug(`Cache hit for ${key}`, { 
      endpoint, 
      namespace: this.namespace,
      age: Date.now() - entry.timestamp 
    });

    return entry.data;
  }

  /**
   * Store data in cache
   */
  set<T>(endpoint: string, data: T, params?: Record<string, any>, customTtl?: number): void {
    const key = this.generateKey(endpoint, params);
    const ttl = customTtl || this.config.ttl;

    // Enforce size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);

    logger.debug(`Cache set for ${key}`, { 
      endpoint, 
      namespace: this.namespace,
      ttl,
      size: this.cache.size 
    });

    // Persist to storage if enabled
    if (this.isClient && this.config.enablePersistence) {
      this.persistToStorage(key, entry);
    }
  }

  /**
   * Remove least recently used entry
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      if (this.isClient && this.config.enablePersistence) {
        this.removeFromStorage(oldestKey);
      }
      logger.debug(`Evicted LRU entry: ${oldestKey}`, { namespace: this.namespace });
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };

    if (this.isClient && this.config.enablePersistence) {
      this.clearStorage();
    }

    logger.info(`Cache cleared for namespace: ${this.namespace}`);
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(endpoint: string, params?: Record<string, any>): boolean {
    const key = this.generateKey(endpoint, params);
    const deleted = this.cache.delete(key);

    if (deleted && this.isClient && this.config.enablePersistence) {
      this.removeFromStorage(key);
    }

    logger.debug(`Cache invalidated for ${key}`, { endpoint, namespace: this.namespace });
    return deleted;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Load cache from localStorage/sessionStorage
   */
  private loadFromStorage(): void {
    try {
      const storage = this.config.enablePersistence ? localStorage : sessionStorage;
      const prefix = `tmdb_cache_${this.namespace}_`;

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(prefix)) {
          const cacheKey = key.substring(prefix.length);
          const data = storage.getItem(key);
          
          if (data) {
            const entry: CacheEntry<any> = JSON.parse(data);
            if (this.isValid(entry)) {
              this.cache.set(cacheKey, entry);
            } else {
              storage.removeItem(key);
            }
          }
        }
      }

      logger.debug(`Loaded ${this.cache.size} entries from storage`, { 
        namespace: this.namespace 
      });
    } catch (error) {
      logger.warn('Failed to load cache from storage', { 
        namespace: this.namespace,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Persist cache entry to storage
   */
  private persistToStorage(key: string, entry: CacheEntry<any>): void {
    try {
      const storage = this.config.enablePersistence ? localStorage : sessionStorage;
      const storageKey = `tmdb_cache_${this.namespace}_${key}`;
      storage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      logger.warn('Failed to persist cache entry', { 
        key,
        namespace: this.namespace,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Remove cache entry from storage
   */
  private removeFromStorage(key: string): void {
    try {
      const storage = this.config.enablePersistence ? localStorage : sessionStorage;
      const storageKey = `tmdb_cache_${this.namespace}_${key}`;
      storage.removeItem(storageKey);
    } catch (error) {
      logger.warn('Failed to remove cache entry from storage', { 
        key,
        namespace: this.namespace,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Clear all storage for this namespace
   */
  private clearStorage(): void {
    try {
      const storage = this.config.enablePersistence ? localStorage : sessionStorage;
      const prefix = `tmdb_cache_${this.namespace}_`;
      const keysToRemove: string[] = [];

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => storage.removeItem(key));
    } catch (error) {
      logger.warn('Failed to clear storage', { 
        namespace: this.namespace,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupTimer(): void {
    // Only run cleanup on client side
    if (!this.isClient) return;

    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const expiredKeys: string[] = [];

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (!this.isValid(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      if (this.isClient && this.config.enablePersistence) {
        this.removeFromStorage(key);
      }
    });

    if (expiredKeys.length > 0) {
      logger.debug(`Cleaned up ${expiredKeys.length} expired entries`, { 
        namespace: this.namespace 
      });
    }
  }
}

// Create cache instances for different types of TMDB data
export const detailsCache = new TMDBCache('details', CACHE_CONFIGS.details);
export const searchCache = new TMDBCache('search', CACHE_CONFIGS.search);
export const trendingCache = new TMDBCache('trending', CACHE_CONFIGS.trending);
export const discoverCache = new TMDBCache('discover', CACHE_CONFIGS.discover);
export const personCache = new TMDBCache('person', CACHE_CONFIGS.person);
export const creditsCache = new TMDBCache('credits', CACHE_CONFIGS.credits);
export const videosCache = new TMDBCache('videos', CACHE_CONFIGS.videos);
export const providersCache = new TMDBCache('providers', CACHE_CONFIGS.providers);

/**
 * Cache-aware wrapper for TMDB API requests
 */
export async function withCache<T>(
  cache: TMDBCache,
  endpoint: string,
  fetcher: () => Promise<T>,
  params?: Record<string, any>,
  customTtl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(endpoint, params);
  if (cached !== null) {
    return cached;
  }

  // Fetch from API and cache the result
  try {
    const data = await fetcher();
    cache.set(endpoint, data, params, customTtl);
    return data;
  } catch (error) {
    logger.error('Failed to fetch and cache data', error instanceof Error ? error : new Error(String(error)), {
      endpoint,
      params,
    });
    throw error;
  }
}

/**
 * Utility to get cache statistics for all caches
 */
export function getAllCacheStats() {
  return {
    details: detailsCache.getStats(),
    search: searchCache.getStats(),
    trending: trendingCache.getStats(),
    discover: discoverCache.getStats(),
    person: personCache.getStats(),
    credits: creditsCache.getStats(),
    videos: videosCache.getStats(),
    providers: providersCache.getStats(),
  };
}

/**
 * Clear all TMDB caches
 */
export function clearAllCaches(): void {
  detailsCache.clear();
  searchCache.clear();
  trendingCache.clear();
  discoverCache.clear();
  personCache.clear();
  creditsCache.clear();
  videosCache.clear();
  providersCache.clear();
  
  logger.info('All TMDB caches cleared');
}