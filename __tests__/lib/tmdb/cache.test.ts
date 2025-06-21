/**
 * Unit tests for TMDB Cache System
 */

import { TMDBCache, withCache, CACHE_CONFIGS } from '@/lib/tmdb/cache';

// Mock logger
jest.mock('@/lib/error-logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock localStorage and sessionStorage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

Object.defineProperty(global, 'localStorage', {
  value: mockStorage,
  writable: true,
});

Object.defineProperty(global, 'sessionStorage', {
  value: mockStorage,
  writable: true,
});

// Mock window for client-side tests
Object.defineProperty(global, 'window', {
  value: {},
  writable: true,
});

describe('TMDBCache', () => {
  let cache: TMDBCache;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getItem.mockReturnValue(null);
    mockStorage.length = 0;
    mockStorage.key.mockReturnValue(null);
    
    cache = new TMDBCache('test', { ttl: 1000, maxSize: 5, enablePersistence: false });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, name: 'Test Movie' };
      
      cache.set('/movie/1', testData);
      const retrieved = cache.get('/movie/1');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent data', () => {
      const retrieved = cache.get('/movie/999');
      expect(retrieved).toBeNull();
    });

    it('should handle cache with parameters', () => {
      const testData = { results: [{ id: 1 }] };
      const params = { page: 1, sort_by: 'popularity.desc' };
      
      cache.set('/discover/movie', testData, params);
      const retrieved = cache.get('/discover/movie', params);
      
      expect(retrieved).toEqual(testData);
    });

    it('should differentiate between different parameters', () => {
      const testData1 = { results: [{ id: 1 }] };
      const testData2 = { results: [{ id: 2 }] };
      
      cache.set('/discover/movie', testData1, { page: 1 });
      cache.set('/discover/movie', testData2, { page: 2 });
      
      expect(cache.get('/discover/movie', { page: 1 })).toEqual(testData1);
      expect(cache.get('/discover/movie', { page: 2 })).toEqual(testData2);
    });
  });

  describe('TTL and Expiration', () => {
    it('should respect TTL and expire entries', async () => {
      const shortTTLCache = new TMDBCache('short', { ttl: 50 }); // 50ms
      const testData = { id: 1 };
      
      shortTTLCache.set('/test', testData);
      expect(shortTTLCache.get('/test')).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(shortTTLCache.get('/test')).toBeNull();
    });

    it('should allow custom TTL per entry', async () => {
      const testData = { id: 1 };
      
      cache.set('/test', testData, undefined, 50); // 50ms custom TTL
      expect(cache.get('/test')).toEqual(testData);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(cache.get('/test')).toBeNull();
    });
  });

  describe('Size Limits and LRU Eviction', () => {
    it('should enforce max size and evict LRU entries', () => {
      // Fill cache to max size (5)
      for (let i = 1; i <= 5; i++) {
        cache.set(`/movie/${i}`, { id: i });
      }
      
      // All entries should be present
      for (let i = 1; i <= 5; i++) {
        expect(cache.get(`/movie/${i}`)).toEqual({ id: i });
      }
      
      // Add one more entry, should evict the least recently used (movie/1)
      cache.set('/movie/6', { id: 6 });
      
      expect(cache.get('/movie/1')).toBeNull(); // Should be evicted
      expect(cache.get('/movie/6')).toEqual({ id: 6 }); // Should be present
    });

    it('should update access time on get operations', () => {
      // Fill cache
      for (let i = 1; i <= 5; i++) {
        cache.set(`/movie/${i}`, { id: i });
      }
      
      // Access movie/1 to make it most recently used
      cache.get('/movie/1');
      
      // Add new entry, should evict movie/2 (now LRU) instead of movie/1
      cache.set('/movie/6', { id: 6 });
      
      expect(cache.get('/movie/1')).toEqual({ id: 1 }); // Should still be present
      expect(cache.get('/movie/2')).toBeNull(); // Should be evicted
    });
  });

  describe('Cache Statistics', () => {
    it('should track hits and misses correctly', () => {
      const testData = { id: 1 };
      
      // Initial stats
      let stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
      
      // Cache miss
      cache.get('/movie/1');
      stats = cache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0);
      
      // Cache set and hit
      cache.set('/movie/1', testData);
      cache.get('/movie/1');
      stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should calculate hit rate correctly', () => {
      const testData = { id: 1 };
      cache.set('/movie/1', testData);
      
      // 3 hits, 1 miss = 75% hit rate
      cache.get('/movie/1'); // hit
      cache.get('/movie/1'); // hit
      cache.get('/movie/1'); // hit
      cache.get('/movie/2'); // miss
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0.75);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate specific entries', () => {
      const testData1 = { id: 1 };
      const testData2 = { id: 2 };
      
      cache.set('/movie/1', testData1);
      cache.set('/movie/2', testData2);
      
      expect(cache.get('/movie/1')).toEqual(testData1);
      expect(cache.get('/movie/2')).toEqual(testData2);
      
      // Invalidate movie/1
      const invalidated = cache.invalidate('/movie/1');
      expect(invalidated).toBe(true);
      
      expect(cache.get('/movie/1')).toBeNull();
      expect(cache.get('/movie/2')).toEqual(testData2); // Should still be present
    });

    it('should return false when invalidating non-existent entry', () => {
      const invalidated = cache.invalidate('/movie/999');
      expect(invalidated).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('/movie/1', { id: 1 });
      cache.set('/movie/2', { id: 2 });
      
      expect(cache.getStats().size).toBe(2);
      
      cache.clear();
      
      expect(cache.getStats().size).toBe(0);
      expect(cache.get('/movie/1')).toBeNull();
      expect(cache.get('/movie/2')).toBeNull();
    });
  });

  describe('Persistence (localStorage/sessionStorage)', () => {
    it('should persist to localStorage when enabled', () => {
      const persistentCache = new TMDBCache('persistent', { 
        enablePersistence: true,
        ttl: 1000 
      });
      
      const testData = { id: 1 };
      persistentCache.set('/movie/1', testData);
      
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('tmdb_cache_persistent_'),
        expect.stringContaining('"data":{"id":1}')
      );
    });

    it('should load from localStorage on initialization', () => {
      const cacheData = {
        data: { id: 1 },
        timestamp: Date.now() - 500, // 500ms ago
        ttl: 1000,
        accessCount: 1,
        lastAccessed: Date.now() - 500,
      };
      
      mockStorage.getItem.mockReturnValue(JSON.stringify(cacheData));
      mockStorage.length = 1;
      mockStorage.key.mockReturnValue('tmdb_cache_load_test_/movie/1');
      
      const loadCache = new TMDBCache('load_test', { 
        enablePersistence: true,
        ttl: 1000 
      });
      
      expect(loadCache.get('/movie/1')).toEqual({ id: 1 });
    });

    it('should handle localStorage errors gracefully', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      const persistentCache = new TMDBCache('error_test', { 
        enablePersistence: true 
      });
      
      // Should not throw error
      expect(() => {
        persistentCache.set('/movie/1', { id: 1 });
      }).not.toThrow();
    });
  });

  describe('Key Generation and Hashing', () => {
    it('should generate consistent keys for same parameters', () => {
      const params1 = { page: 1, sort_by: 'popularity.desc' };
      const params2 = { page: 1, sort_by: 'popularity.desc' };
      
      cache.set('/discover/movie', { data: 1 }, params1);
      const retrieved = cache.get('/discover/movie', params2);
      
      expect(retrieved).toEqual({ data: 1 });
    });

    it('should generate different keys for different parameters', () => {
      cache.set('/discover/movie', { data: 1 }, { page: 1 });
      cache.set('/discover/movie', { data: 2 }, { page: 2 });
      
      expect(cache.get('/discover/movie', { page: 1 })).toEqual({ data: 1 });
      expect(cache.get('/discover/movie', { page: 2 })).toEqual({ data: 2 });
    });

    it('should handle complex parameter objects', () => {
      const complexParams = {
        page: 1,
        sort_by: 'popularity.desc',
        with_genres: [28, 12],
        primary_release_year: 2023,
        'vote_average.gte': 7.0,
      };
      
      cache.set('/discover/movie', { data: 'complex' }, complexParams);
      const retrieved = cache.get('/discover/movie', complexParams);
      
      expect(retrieved).toEqual({ data: 'complex' });
    });
  });
});

describe('withCache utility', () => {
  let cache: TMDBCache;
  let mockFetcher: jest.Mock;

  beforeEach(() => {
    cache = new TMDBCache('util_test', { ttl: 1000 });
    mockFetcher = jest.fn();
  });

  it('should return cached data if available', async () => {
    const cachedData = { id: 1, cached: true };
    cache.set('/test', cachedData);
    
    const result = await withCache(cache, '/test', mockFetcher);
    
    expect(result).toEqual(cachedData);
    expect(mockFetcher).not.toHaveBeenCalled();
  });

  it('should fetch and cache data if not in cache', async () => {
    const fetchedData = { id: 1, fetched: true };
    mockFetcher.mockResolvedValue(fetchedData);
    
    const result = await withCache(cache, '/test', mockFetcher);
    
    expect(result).toEqual(fetchedData);
    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(cache.get('/test')).toEqual(fetchedData);
  });

  it('should propagate fetch errors', async () => {
    const error = new Error('Fetch failed');
    mockFetcher.mockRejectedValue(error);
    
    await expect(withCache(cache, '/test', mockFetcher)).rejects.toThrow('Fetch failed');
    expect(cache.get('/test')).toBeNull(); // Should not cache errors
  });

  it('should respect custom TTL', async () => {
    const fetchedData = { id: 1 };
    mockFetcher.mockResolvedValue(fetchedData);
    
    await withCache(cache, '/test', mockFetcher, undefined, 500);
    
    // Data should be cached with custom TTL
    expect(cache.get('/test')).toEqual(fetchedData);
  });

  it('should handle parameters correctly', async () => {
    const fetchedData = { id: 1 };
    const params = { page: 1, query: 'test' };
    mockFetcher.mockResolvedValue(fetchedData);
    
    await withCache(cache, '/search', mockFetcher, params);
    
    expect(cache.get('/search', params)).toEqual(fetchedData);
    expect(cache.get('/search', { page: 2, query: 'test' })).toBeNull();
  });
});

describe('Cache Configurations', () => {
  it('should have appropriate TTL values for different cache types', () => {
    // Details should have long TTL (rarely change)
    expect(CACHE_CONFIGS.details.ttl).toBeGreaterThan(CACHE_CONFIGS.search.ttl);
    
    // Search should have short TTL (changes frequently)
    expect(CACHE_CONFIGS.search.ttl).toBeLessThan(CACHE_CONFIGS.trending.ttl);
    
    // Person details should have very long TTL
    expect(CACHE_CONFIGS.person.ttl).toBeGreaterThan(CACHE_CONFIGS.details.ttl);
  });

  it('should have reasonable size limits', () => {
    Object.values(CACHE_CONFIGS).forEach(config => {
      expect(config.maxSize).toBeGreaterThan(0);
      expect(config.maxSize).toBeLessThan(1000); // Reasonable upper bound
    });
  });

  it('should enable persistence for appropriate cache types', () => {
    // Long-lived data should be persisted
    expect(CACHE_CONFIGS.details.enablePersistence).toBe(true);
    expect(CACHE_CONFIGS.person.enablePersistence).toBe(true);
    
    // Short-lived data should not be persisted
    expect(CACHE_CONFIGS.search.enablePersistence).toBe(false);
  });
});