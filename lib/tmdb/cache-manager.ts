/**
 * TMDB Cache Manager
 * Provides utilities for cache warming, monitoring, and management
 */

import { logger } from '@/lib/error-logger';
import {
  getAllCacheStats,
  clearAllCaches,
  detailsCache,
  trendingCache,
  discoverCache,
} from './cache';
import {
  getTrending,
  getMovieDetails,
  getTvShowDetails,
  discoverMedia,
} from './client';

export interface CacheWarmupConfig {
  trendingContent?: boolean;
  popularMovies?: boolean;
  popularTvShows?: boolean;
  topRatedContent?: boolean;
}

export interface CacheMetrics {
  totalHits: number;
  totalMisses: number;
  overallHitRate: number;
  cachesByType: ReturnType<typeof getAllCacheStats>;
  memoryUsage: {
    estimatedSizeKB: number;
    entryCount: number;
  };
}

/**
 * Cache warming utilities to pre-populate frequently accessed data
 */
export class CacheWarmer {
  private isWarming = false;

  async warmCache(config: CacheWarmupConfig = {}): Promise<void> {
    if (this.isWarming) {
      logger.warn('Cache warming already in progress');
      return;
    }

    this.isWarming = true;
    const startTime = Date.now();

    try {
      logger.info('Starting TMDB cache warming', config);

      const promises: Promise<any>[] = [];

      // Warm trending content
      if (config.trendingContent !== false) {
        promises.push(
          this.warmTrendingContent(),
          this.warmPopularMovies(),
          this.warmPopularTvShows()
        );
      }

      // Warm popular content details
      if (config.popularMovies !== false) {
        promises.push(this.warmPopularMovieDetails());
      }

      if (config.popularTvShows !== false) {
        promises.push(this.warmPopularTvShowDetails());
      }

      // Wait for all warming operations to complete
      await Promise.allSettled(promises);

      const duration = Date.now() - startTime;
      logger.info(`Cache warming completed in ${duration}ms`, {
        duration,
        config,
        stats: this.getCacheMetrics(),
      });
    } catch (error) {
      logger.error('Cache warming failed', error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.isWarming = false;
    }
  }

  private async warmTrendingContent(): Promise<void> {
    try {
      await Promise.all([
        getTrending('movie', 'week', 1),
        getTrending('tv', 'week', 1),
        getTrending('all', 'day', 1),
      ]);
      logger.debug('Trending content cached');
    } catch (error) {
      logger.warn('Failed to warm trending content cache', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async warmPopularMovies(): Promise<void> {
    try {
      await Promise.all([
        discoverMedia('movie', { sort_by: 'popularity.desc', page: 1 }),
        discoverMedia('movie', { sort_by: 'vote_average.desc', page: 1 }),
      ]);
      logger.debug('Popular movies cached');
    } catch (error) {
      logger.warn('Failed to warm popular movies cache', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async warmPopularTvShows(): Promise<void> {
    try {
      await Promise.all([
        discoverMedia('tv', { sort_by: 'popularity.desc', page: 1 }),
        discoverMedia('tv', { sort_by: 'vote_average.desc', page: 1 }),
      ]);
      logger.debug('Popular TV shows cached');
    } catch (error) {
      logger.warn('Failed to warm popular TV shows cache', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async warmPopularMovieDetails(): Promise<void> {
    try {
      // Get popular movies first
      const popularMovies = await discoverMedia('movie', {
        sort_by: 'popularity.desc',
        page: 1,
      });

      // Cache details for top 10 popular movies
      const topMovies = popularMovies.results.slice(0, 10);
      await Promise.allSettled(
        topMovies.map(movie => 
          getMovieDetails(movie.id, ['credits', 'videos', 'recommendations'])
        )
      );

      logger.debug(`Cached details for ${topMovies.length} popular movies`);
    } catch (error) {
      logger.warn('Failed to warm popular movie details cache', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async warmPopularTvShowDetails(): Promise<void> {
    try {
      // Get popular TV shows first
      const popularTvShows = await discoverMedia('tv', {
        sort_by: 'popularity.desc',
        page: 1,
      });

      // Cache details for top 10 popular TV shows
      const topTvShows = popularTvShows.results.slice(0, 10);
      await Promise.allSettled(
        topTvShows.map(tvShow => 
          getTvShowDetails(tvShow.id, ['credits', 'videos', 'recommendations'])
        )
      );

      logger.debug(`Cached details for ${topTvShows.length} popular TV shows`);
    } catch (error) {
      logger.warn('Failed to warm popular TV show details cache', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  getCacheMetrics(): CacheMetrics {
    const cachesByType = getAllCacheStats();
    
    let totalHits = 0;
    let totalMisses = 0;
    let entryCount = 0;
    
    Object.values(cachesByType).forEach(stats => {
      totalHits += stats.hits;
      totalMisses += stats.misses;
      entryCount += stats.size;
    });

    const overallHitRate = totalHits + totalMisses > 0 
      ? totalHits / (totalHits + totalMisses) 
      : 0;

    // Rough estimation of memory usage (this is approximate)
    const estimatedSizeKB = Math.round(entryCount * 2); // ~2KB per entry estimate

    return {
      totalHits,
      totalMisses,
      overallHitRate,
      cachesByType,
      memoryUsage: {
        estimatedSizeKB,
        entryCount,
      },
    };
  }

  isWarmingInProgress(): boolean {
    return this.isWarming;
  }
}

// Export singleton instance
export const cacheWarmer = new CacheWarmer();

/**
 * Cache invalidation utilities
 */
export class CacheInvalidator {
  /**
   * Invalidate cache for specific movie
   */
  invalidateMovie(movieId: number): void {
    detailsCache.invalidate(`/movie/${movieId}`);
    // Invalidate related caches too
    ['credits', 'videos', 'watch/providers', 'recommendations', 'similar'].forEach(endpoint => {
      detailsCache.invalidate(`/movie/${movieId}/${endpoint}`);
    });
    
    logger.debug(`Invalidated cache for movie ${movieId}`);
  }

  /**
   * Invalidate cache for specific TV show
   */
  invalidateTvShow(tvId: number): void {
    detailsCache.invalidate(`/tv/${tvId}`);
    // Invalidate related caches too
    ['credits', 'videos', 'watch/providers', 'recommendations', 'similar'].forEach(endpoint => {
      detailsCache.invalidate(`/tv/${tvId}/${endpoint}`);
    });
    
    logger.debug(`Invalidated cache for TV show ${tvId}`);
  }

  /**
   * Invalidate trending caches (called when data might be stale)
   */
  invalidateTrending(): void {
    ['movie', 'tv', 'all'].forEach(mediaType => {
      ['day', 'week'].forEach(timeWindow => {
        trendingCache.invalidate(`/trending/${mediaType}/${timeWindow}`);
      });
    });
    
    logger.debug('Invalidated trending caches');
  }

  /**
   * Invalidate discovery caches for specific media type
   */
  invalidateDiscovery(mediaType: 'movie' | 'tv'): void {
    discoverCache.invalidate(`/discover/${mediaType}`);
    logger.debug(`Invalidated discovery cache for ${mediaType}`);
  }

  /**
   * Clear all caches and reset statistics
   */
  clearAll(): void {
    clearAllCaches();
    logger.info('All TMDB caches cleared');
  }
}

// Export singleton instance
export const cacheInvalidator = new CacheInvalidator();

/**
 * Cache monitoring and health checks
 */
export class CacheMonitor {
  /**
   * Check cache health and performance
   */
  getHealthReport(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: CacheMetrics;
    recommendations: string[];
  } {
    const metrics = cacheWarmer.getCacheMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check hit rate
    if (metrics.overallHitRate < 0.3) {
      status = 'warning';
      issues.push(`Low cache hit rate: ${(metrics.overallHitRate * 100).toFixed(1)}%`);
      recommendations.push('Consider running cache warming or adjusting TTL values');
    }

    // Check memory usage
    if (metrics.memoryUsage.estimatedSizeKB > 50000) { // 50MB
      status = 'warning';
      issues.push(`High memory usage: ~${metrics.memoryUsage.estimatedSizeKB}KB`);
      recommendations.push('Consider reducing cache sizes or clearing old entries');
    }

    // Check individual cache performance
    Object.entries(metrics.cachesByType).forEach(([cacheType, stats]) => {
      if (stats.hitRate < 0.2 && stats.hits + stats.misses > 10) {
        issues.push(`${cacheType} cache has low hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
        recommendations.push(`Review ${cacheType} cache TTL settings`);
      }
    });

    if (issues.length > 3) {
      status = 'critical';
    }

    return {
      status,
      issues,
      metrics,
      recommendations,
    };
  }

  /**
   * Log cache performance summary
   */
  logPerformanceSummary(): void {
    const health = this.getHealthReport();
    
    logger.info('TMDB Cache Performance Summary', {
      status: health.status,
      hitRate: health.metrics.overallHitRate,
      totalEntries: health.metrics.memoryUsage.entryCount,
      estimatedSizeKB: health.metrics.memoryUsage.estimatedSizeKB,
      issues: health.issues,
    });
  }
}

// Export singleton instance
export const cacheMonitor = new CacheMonitor();

/**
 * Scheduled cache maintenance
 */
export class CacheScheduler {
  private intervals: NodeJS.Timeout[] = [];

  /**
   * Start scheduled cache operations
   */
  startScheduledOperations(): void {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Warm cache every 30 minutes
    const warmupInterval = setInterval(async () => {
      try {
        await cacheWarmer.warmCache({
          trendingContent: true,
          popularMovies: false, // Less frequent
          popularTvShows: false, // Less frequent
        });
      } catch (error) {
        logger.error('Scheduled cache warming failed', error instanceof Error ? error : new Error(String(error)));
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Log performance every hour
    const monitorInterval = setInterval(() => {
      cacheMonitor.logPerformanceSummary();
    }, 60 * 60 * 1000); // 1 hour

    this.intervals.push(warmupInterval, monitorInterval);
    
    logger.info('Started scheduled cache operations');
  }

  /**
   * Stop all scheduled operations
   */
  stopScheduledOperations(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    logger.info('Stopped scheduled cache operations');
  }
}

// Export singleton instance
export const cacheScheduler = new CacheScheduler();

// Auto-start scheduled operations on client
if (typeof window !== 'undefined') {
  // Start after a short delay to avoid blocking initial page load
  setTimeout(() => {
    cacheScheduler.startScheduledOperations();
  }, 5000); // 5 seconds
}