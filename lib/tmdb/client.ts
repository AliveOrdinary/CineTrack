import {
  TmdbPaginatedResponse,
  TmdbMedia,
  TmdbMovieDetails,
  TmdbTvDetails,
  TmdbPersonDetails,
  TmdbSearchMultiResponse,
  TmdbTrendingResponse,
  TmdbDiscoverParams,
  TmdbWatchProviderResponse,
  TmdbCombinedCreditsResponse,
  TmdbMovieCreditsResponse,
  TmdbTvCreditsResponse,
  TmdbVideosResponse,
  TmdbReleaseDatesResponse,
  TmdbContentRating,
  TmdbReleaseDate,
  TmdbReleaseDatesResult,
  TmdbCastMember,
  TmdbCrewMember,
  TmdbMediaSchema,
  TmdbSeasonDetails,
  TmdbEpisodeDetails,
} from './types';
import { logger, logPerformance } from '@/lib/error-logger';
import { ExternalServiceError, withRetry } from '@/lib/api-error-handler';
import {
  withCache,
  detailsCache,
  searchCache,
  trendingCache,
  discoverCache,
  personCache,
  creditsCache,
  videosCache,
  providersCache,
} from './cache';

const TMDB_API_BASE_URL = process.env.NEXT_PUBLIC_TMDB_API_BASE_URL;
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_API_READ_ACCESS_TOKEN;

if (!TMDB_API_BASE_URL) {
  throw new Error('Missing environment variable NEXT_PUBLIC_TMDB_API_BASE_URL');
}
if (!TMDB_API_KEY && !TMDB_READ_ACCESS_TOKEN) {
  throw new Error(
    'Missing environment variable NEXT_PUBLIC_TMDB_API_KEY or TMDB_API_READ_ACCESS_TOKEN'
  );
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: any;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const startTime = Date.now();
  const { method = 'GET', params = {}, headers = {}, body } = options;

  // Use API key authentication if available, otherwise use read access token
  const authHeaders: Record<string, string> = {};
  const queryParams = new URLSearchParams();

  if (TMDB_API_KEY) {
    // API Key authentication via query parameter
    queryParams.set('api_key', TMDB_API_KEY);
  } else if (TMDB_READ_ACCESS_TOKEN) {
    // Bearer token authentication via header
    authHeaders['Authorization'] = `Bearer ${TMDB_READ_ACCESS_TOKEN}`;
  }

  // Add other query parameters
  Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .forEach(([key, value]) => {
      queryParams.set(key, String(value));
    });

  const url = `${TMDB_API_BASE_URL}${endpoint}?${queryParams.toString()}`;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      ...authHeaders,
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    // Log performance
    logPerformance(`TMDB API ${method} ${endpoint}`, startTime, {
      statusCode: response.status,
      endpoint,
      method,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));

      logger.error(
        `TMDB API Error: ${response.status} ${endpoint}`,
        new Error(errorData.message || response.statusText),
        {
          statusCode: response.status,
          endpoint,
          method,
          errorData,
        }
      );

      // Throw specific error for better handling
      throw new ExternalServiceError(
        'TMDB',
        `${response.status}: ${errorData.message || response.statusText}`
      );
    }

    const data = (await response.json()) as T;

    logger.debug(`TMDB API Success: ${method} ${endpoint}`, {
      endpoint,
      method,
      statusCode: response.status,
      duration: Date.now() - startTime,
    });

    return data;
  } catch (error) {
    if (error instanceof ExternalServiceError) {
      throw error; // Re-throw our custom error
    }

    logger.error(
      `Failed to fetch from TMDB API endpoint: ${endpoint}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        endpoint,
        method,
        duration: Date.now() - startTime,
      }
    );

    throw new ExternalServiceError(
      'TMDB',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// Wrapper function with retry logic for critical endpoints
async function requestWithRetry<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  return withRetry(
    () => request<T>(endpoint, options),
    3, // max retries
    1000, // delay
    `TMDB API ${endpoint}`
  );
}

export const searchMulti = (
  query: string,
  page: number = 1,
  include_adult: boolean = false
): Promise<TmdbSearchMultiResponse> => {
  const endpoint = '/search/multi';
  const params = { query, page, include_adult };
  
  return withCache(
    searchCache,
    endpoint,
    () => request<TmdbSearchMultiResponse>(endpoint, { params }),
    params
  );
};

export const getMovieDetails = (
  movieId: number,
  appendToResponse?: string[]
): Promise<TmdbMovieDetails> => {
  const endpoint = `/movie/${movieId}`;
  const params = { append_to_response: appendToResponse?.join(',') };
  
  return withCache(
    detailsCache,
    endpoint,
    () => request<TmdbMovieDetails>(endpoint, { params }),
    params
  );
};

export const getTvShowDetails = (
  tvId: number,
  appendToResponse?: string[]
): Promise<TmdbTvDetails> => {
  const endpoint = `/tv/${tvId}`;
  const params = { append_to_response: appendToResponse?.join(',') };
  
  return withCache(
    detailsCache,
    endpoint,
    () => request<TmdbTvDetails>(endpoint, { params }),
    params
  );
};

export const getTrending = (
  mediaType: 'all' | 'movie' | 'tv' | 'person' = 'all',
  timeWindow: 'day' | 'week' = 'week',
  page: number = 1
): Promise<TmdbTrendingResponse> => {
  const endpoint = `/trending/${mediaType}/${timeWindow}`;
  const params = { page };
  
  return withCache(
    trendingCache,
    endpoint,
    () => request<TmdbTrendingResponse>(endpoint, { params }),
    params
  );
};

export const discoverMedia = (
  mediaType: 'movie' | 'tv',
  params: TmdbDiscoverParams = {}
): Promise<TmdbPaginatedResponse<TmdbMedia>> => {
  const endpoint = `/discover/${mediaType}`;
  
  return withCache(
    discoverCache,
    endpoint,
    () => request<TmdbPaginatedResponse<TmdbMedia>>(endpoint, {
      params: params as Record<string, any>,
    }),
    params as Record<string, any>
  );
};

export const getPersonDetails = (
  personId: number,
  appendToResponse?: string[]
): Promise<TmdbPersonDetails> => {
  const endpoint = `/person/${personId}`;
  const params = { append_to_response: appendToResponse?.join(',') };
  
  return withCache(
    personCache,
    endpoint,
    () => request<TmdbPersonDetails>(endpoint, { params }),
    params
  );
};

export const getPersonCombinedCredits = (
  personId: number
): Promise<TmdbCombinedCreditsResponse> => {
  const endpoint = `/person/${personId}/combined_credits`;
  
  return withCache(
    creditsCache,
    endpoint,
    () => request<TmdbCombinedCreditsResponse>(endpoint),
    { personId }
  );
};

export const getWatchProviders = (
  mediaType: 'movie' | 'tv',
  id: number
): Promise<TmdbWatchProviderResponse> => {
  const endpoint = `/${mediaType}/${id}/watch/providers`;
  
  return withCache(
    providersCache,
    endpoint,
    () => request<TmdbWatchProviderResponse>(endpoint),
    { mediaType, id }
  );
};

export const getContentRatings = (
  mediaType: 'movie' | 'tv',
  id: number
): Promise<TmdbReleaseDatesResponse> => {
  return request<TmdbReleaseDatesResponse>(`/${mediaType}/${id}/release_dates`);
};

export const tmdb = {
  searchMulti,
  getMovieDetails,
  getTvShowDetails,
  getTrending,
  discoverMedia,
  getPersonDetails,
  getPersonCombinedCredits,
  getWatchProviders,
  getContentRatings,
};

export async function getNowPlayingMovies(
  page: number = 1
): Promise<TmdbPaginatedResponse<TmdbMedia>> {
  const endpoint = '/movie/now_playing';
  const params = { page };
  
  return withCache(
    discoverCache,
    endpoint,
    () => request<TmdbPaginatedResponse<TmdbMedia>>(endpoint, { params }),
    params
  );
}

export async function getUpcomingMovies(
  page: number = 1
): Promise<TmdbPaginatedResponse<TmdbMedia>> {
  const endpoint = '/movie/upcoming';
  const params = { page };
  
  return withCache(
    discoverCache,
    endpoint,
    () => request<TmdbPaginatedResponse<TmdbMedia>>(endpoint, { params }),
    params
  );
}

export async function getMovieCredits(movieId: number): Promise<TmdbMovieCreditsResponse> {
  const endpoint = `/movie/${movieId}/credits`;
  
  return withCache(
    creditsCache,
    endpoint,
    () => request<TmdbMovieCreditsResponse>(endpoint),
    { movieId }
  );
}

export async function getMovieWatchProviders(movieId: number): Promise<TmdbWatchProviderResponse> {
  const endpoint = `/movie/${movieId}/watch/providers`;
  
  return withCache(
    providersCache,
    endpoint,
    () => request<TmdbWatchProviderResponse>(endpoint),
    { movieId }
  );
}

export async function getMovieVideos(movieId: number): Promise<TmdbVideosResponse> {
  const endpoint = `/movie/${movieId}/videos`;
  
  return withCache(
    videosCache,
    endpoint,
    () => request<TmdbVideosResponse>(endpoint),
    { movieId }
  );
}

export async function getMovieRecommendations(
  movieId: number,
  page: number = 1
): Promise<TmdbPaginatedResponse<TmdbMedia>> {
  const endpoint = `/movie/${movieId}/recommendations`;
  const params = { page };
  
  return withCache(
    discoverCache,
    endpoint,
    () => request<TmdbPaginatedResponse<TmdbMedia>>(endpoint, { params }),
    { movieId, ...params }
  );
}

export async function getSimilarMovies(
  movieId: number,
  page: number = 1
): Promise<TmdbPaginatedResponse<TmdbMedia>> {
  const endpoint = `/movie/${movieId}/similar`;
  const params = { page };
  
  return withCache(
    discoverCache,
    endpoint,
    () => request<TmdbPaginatedResponse<TmdbMedia>>(endpoint, { params }),
    { movieId, ...params }
  );
}

export const searchMovies = (
  query: string,
  page: number = 1,
  include_adult: boolean = false
): Promise<TmdbPaginatedResponse<TmdbMedia>> => {
  const endpoint = '/search/movie';
  const params = { query, page, include_adult };
  
  return withCache(
    searchCache,
    endpoint,
    () => request<TmdbPaginatedResponse<TmdbMedia>>(endpoint, { params }),
    params
  );
};

export const searchTvShows = (
  query: string,
  page: number = 1,
  include_adult: boolean = false
): Promise<TmdbPaginatedResponse<TmdbMedia>> => {
  const endpoint = '/search/tv';
  const params = { query, page, include_adult };
  
  return withCache(
    searchCache,
    endpoint,
    () => request<TmdbPaginatedResponse<TmdbMedia>>(endpoint, { params }),
    params
  );
};

export const searchPeople = (
  query: string,
  page: number = 1,
  include_adult: boolean = false
): Promise<TmdbPaginatedResponse<TmdbMedia>> => {
  const endpoint = '/search/person';
  const params = { query, page, include_adult };
  
  return withCache(
    searchCache,
    endpoint,
    () => request<TmdbPaginatedResponse<TmdbMedia>>(endpoint, { params }),
    params
  );
};

export async function getTvShowCredits(tvId: number): Promise<TmdbTvCreditsResponse> {
  const endpoint = `/tv/${tvId}/credits`;
  
  return withCache(
    creditsCache,
    endpoint,
    () => request<TmdbTvCreditsResponse>(endpoint),
    { tvId }
  );
}

export async function getTvShowWatchProviders(tvId: number): Promise<TmdbWatchProviderResponse> {
  const endpoint = `/tv/${tvId}/watch/providers`;
  
  return withCache(
    providersCache,
    endpoint,
    () => request<TmdbWatchProviderResponse>(endpoint),
    { tvId }
  );
}

export async function getTvShowVideos(tvId: number): Promise<TmdbVideosResponse> {
  const endpoint = `/tv/${tvId}/videos`;
  
  return withCache(
    videosCache,
    endpoint,
    () => request<TmdbVideosResponse>(endpoint),
    { tvId }
  );
}

export async function getSimilarTvShows(
  tvId: number,
  page: number = 1
): Promise<TmdbPaginatedResponse<TmdbMedia>> {
  const endpoint = `/tv/${tvId}/similar`;
  const params = { page };
  
  return withCache(
    discoverCache,
    endpoint,
    () => request<TmdbPaginatedResponse<TmdbMedia>>(endpoint, { params }),
    { tvId, ...params }
  );
}

export async function getTvShowRecommendations(
  tvId: number,
  page: number = 1
): Promise<TmdbPaginatedResponse<TmdbMedia>> {
  const endpoint = `/tv/${tvId}/recommendations`;
  const params = { page };
  
  return withCache(
    discoverCache,
    endpoint,
    () => request<TmdbPaginatedResponse<TmdbMedia>>(endpoint, { params }),
    { tvId, ...params }
  );
}

// TV Season and Episode functions
export async function getTvSeason(tvId: number, seasonNumber: number): Promise<TmdbSeasonDetails> {
  const endpoint = `/tv/${tvId}/season/${seasonNumber}`;
  
  return withCache(
    detailsCache,
    endpoint,
    () => request<TmdbSeasonDetails>(endpoint),
    { tvId, seasonNumber }
  );
}

export async function getTvEpisode(
  tvId: number,
  seasonNumber: number,
  episodeNumber: number
): Promise<TmdbEpisodeDetails> {
  const endpoint = `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`;
  
  return withCache(
    detailsCache,
    endpoint,
    () => request<TmdbEpisodeDetails>(endpoint),
    { tvId, seasonNumber, episodeNumber }
  );
}
