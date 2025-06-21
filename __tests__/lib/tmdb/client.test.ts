/**
 * Unit tests for TMDB API client
 */

import {
  searchMovies,
  searchTvShows,
  searchPeople,
  searchMulti,
  getMovieDetails,
  getTvShowDetails,
  getTrending,
  getPersonDetails,
  getWatchProviders,
  getContentRatings,
  getNowPlayingMovies,
  getUpcomingMovies,
  getMovieCredits,
  getMovieWatchProviders,
  getMovieVideos,
  getMovieRecommendations,
  getSimilarMovies,
  getTvShowCredits,
  getTvShowWatchProviders,
  getTvShowVideos,
  getSimilarTvShows,
  getTvShowRecommendations,
  getTvSeason,
  getTvEpisode,
} from '@/lib/tmdb/client';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock environment variables
const originalEnv = process.env;

describe('TMDB Client Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_TMDB_API_KEY: 'test-api-key',
      NEXT_PUBLIC_TMDB_API_BASE_URL: 'https://api.themoviedb.org/3'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('environment validation', () => {
    it('should work with API key environment variable', () => {
      expect(process.env.NEXT_PUBLIC_TMDB_API_KEY).toBe('test-api-key');
      expect(process.env.NEXT_PUBLIC_TMDB_API_BASE_URL).toBe('https://api.themoviedb.org/3');
    });
  });

  describe('searchMovies', () => {
    it('should search for movies successfully', async () => {
      const mockResponse = {
        results: [
          {
            id: 1,
            title: 'Test Movie',
            overview: 'Test overview',
            release_date: '2023-01-01',
            poster_path: '/test.jpg'
          }
        ],
        total_pages: 1,
        total_results: 1,
        page: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await searchMovies('test query');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/search/movie'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json;charset=utf-8'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle search with options', async () => {
      const mockResponse = { results: [], total_pages: 1, total_results: 0, page: 1 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await searchMovies('test', 2, false);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('include_adult=false'),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      const mockErrorResponse = { message: 'Not Found' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => mockErrorResponse,
      } as Response);

      await expect(searchMovies('test')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(searchMovies('test')).rejects.toThrow();
    });
  });

  describe('getMovieDetails', () => {
    it('should get movie details successfully', async () => {
      const mockMovie = {
        id: 1,
        title: 'Test Movie',
        overview: 'Test overview',
        release_date: '2023-01-01',
        runtime: 120,
        genres: [{ id: 1, name: 'Action' }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMovie,
      } as Response);

      const result = await getMovieDetails(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/movie/1'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json;charset=utf-8'
          })
        })
      );
      expect(result).toEqual(mockMovie);
    });

    it('should include append_to_response parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await getMovieDetails(1, ['credits', 'videos']);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('append_to_response=credits%2Cvideos'),
        expect.any(Object)
      );
    });
  });

  describe('getTvShowDetails', () => {
    it('should get TV show details successfully', async () => {
      const mockTVShow = {
        id: 1,
        name: 'Test TV Show',
        overview: 'Test overview',
        first_air_date: '2023-01-01',
        number_of_seasons: 3,
        genres: [{ id: 1, name: 'Drama' }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTVShow,
      } as Response);

      const result = await getTvShowDetails(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/tv/1'),
        expect.any(Object)
      );
      expect(result).toEqual(mockTVShow);
    });
  });

  describe('getTrending', () => {
    it('should get trending movies', async () => {
      const mockResponse = {
        results: [
          {
            id: 1,
            title: 'Trending Movie',
            media_type: 'movie'
          }
        ],
        total_pages: 1,
        total_results: 1,
        page: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await getTrending('movie', 'week');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/trending/movie/week'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should support different time windows', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], total_pages: 1, total_results: 0, page: 1 }),
      } as Response);

      await getTrending('all', 'day');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/trending/all/day'),
        expect.any(Object)
      );
    });
  });

  describe('searchMulti', () => {
    it('should search across multiple media types', async () => {
      const mockResponse = {
        results: [
          { id: 1, media_type: 'movie', title: 'Test Movie' },
          { id: 2, media_type: 'tv', name: 'Test TV Show' },
          { id: 3, media_type: 'person', name: 'Test Person' }
        ],
        total_pages: 1,
        total_results: 3,
        page: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await searchMulti('test query');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/search/multi'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('rate limiting and caching', () => {
    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ message: 'Rate limit exceeded' }),
      } as Response);

      await expect(searchMovies('test')).rejects.toThrow();
    });

    it('should include proper headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], total_pages: 1, total_results: 0, page: 1 }),
      } as Response);

      await searchMovies('test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json;charset=utf-8'
          })
        })
      );
    });
  });

  describe('URL construction', () => {
    it('should properly encode query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], total_pages: 1, total_results: 0, page: 1 }),
      } as Response);

      await searchMovies('test query with spaces');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('query=test+query+with+spaces'),
        expect.any(Object)
      );
    });

    it('should handle special characters in queries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], total_pages: 1, total_results: 0, page: 1 }),
      } as Response);

      await searchMovies('test & query');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('query=test+%26+query'),
        expect.any(Object)
      );
    });
  });
});