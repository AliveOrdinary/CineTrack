/**
 * Unit tests for TMDB API client
 */

import { TMDBClient } from '@/lib/tmdb/client';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock environment variables
const originalEnv = process.env;

describe('TMDBClient', () => {
  let client: TMDBClient;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_TMDB_API_KEY: 'test-api-key',
      NEXT_PUBLIC_TMDB_API_BASE_URL: 'https://api.themoviedb.org/3'
    };
    client = new TMDBClient();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize with environment variables', () => {
      expect(client).toBeInstanceOf(TMDBClient);
    });

    it('should throw error if API key is missing', () => {
      delete process.env.NEXT_PUBLIC_TMDB_API_KEY;
      expect(() => new TMDBClient()).toThrow('TMDB API key is required');
    });

    it('should throw error if base URL is missing', () => {
      delete process.env.NEXT_PUBLIC_TMDB_API_BASE_URL;
      expect(() => new TMDBClient()).toThrow('TMDB API base URL is required');
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

      const result = await client.searchMovies('test query');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/search/movie'),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }
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

      await client.searchMovies('test', { 
        page: 2, 
        year: 2023,
        region: 'US'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('year=2023'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('region=US'),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(client.searchMovies('test')).rejects.toThrow('TMDB API error: 404 Not Found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.searchMovies('test')).rejects.toThrow('Network error');
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

      const result = await client.getMovieDetails(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/movie/1'),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }
        })
      );
      expect(result).toEqual(mockMovie);
    });

    it('should include append_to_response parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await client.getMovieDetails(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('append_to_response=credits,videos,images,similar,recommendations,watch/providers'),
        expect.any(Object)
      );
    });
  });

  describe('getTVShowDetails', () => {
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

      const result = await client.getTVShowDetails(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/tv/1'),
        expect.any(Object)
      );
      expect(result).toEqual(mockTVShow);
    });
  });

  describe('getTrendingMovies', () => {
    it('should get trending movies', async () => {
      const mockResponse = {
        results: [],
        total_pages: 1,
        total_results: 0,
        page: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getTrendingMovies();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/trending/movie/week'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should support different time windows', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      await client.getTrendingMovies('day');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/trending/movie/day'),
        expect.any(Object)
      );
    });
  });

  describe('getGenres', () => {
    it('should get movie genres', async () => {
      const mockGenres = {
        genres: [
          { id: 1, name: 'Action' },
          { id: 2, name: 'Comedy' }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenres,
      } as Response);

      const result = await client.getGenres('movie');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/genre/movie/list'),
        expect.any(Object)
      );
      expect(result).toEqual(mockGenres);
    });

    it('should get TV genres', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ genres: [] }),
      } as Response);

      await client.getGenres('tv');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/genre/tv/list'),
        expect.any(Object)
      );
    });
  });

  describe('rate limiting and caching', () => {
    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response);

      await expect(client.searchMovies('test')).rejects.toThrow('TMDB API error: 429 Too Many Requests');
    });

    it('should include proper headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      await client.searchMovies('test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }
        })
      );
    });
  });

  describe('URL construction', () => {
    it('should properly encode query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      await client.searchMovies('test query with spaces');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('query=test%20query%20with%20spaces'),
        expect.any(Object)
      );
    });

    it('should handle special characters in queries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      await client.searchMovies('test & query');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test%20%26%20query'),
        expect.any(Object)
      );
    });
  });
});