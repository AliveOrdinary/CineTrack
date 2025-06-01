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

const TMDB_API_BASE_URL = process.env.NEXT_PUBLIC_TMDB_API_BASE_URL;
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY; 

if (!TMDB_API_BASE_URL) {
  throw new Error("Missing environment variable NEXT_PUBLIC_TMDB_API_BASE_URL");
}
if (!TMDB_API_KEY) {
  throw new Error("Missing environment variable NEXT_PUBLIC_TMDB_API_KEY or TMDB_API_READ_ACCESS_TOKEN");
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

  const defaultParams: Record<string, string> = {
    api_key: TMDB_API_KEY as string,
  };

  const queryParams = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, defaultParams)
  ).toString();

  const url = `${TMDB_API_BASE_URL}${endpoint}?${queryParams}`;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
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
      method
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      
      logger.error(`TMDB API Error: ${response.status} ${endpoint}`, new Error(errorData.message || response.statusText), {
        statusCode: response.status,
        endpoint,
        method,
        errorData
      });

      // Throw specific error for better handling
      throw new ExternalServiceError('TMDB', `${response.status}: ${errorData.message || response.statusText}`);
    }

    const data = await response.json() as T;
    
    logger.debug(`TMDB API Success: ${method} ${endpoint}`, {
      endpoint,
      method,
      statusCode: response.status,
      duration: Date.now() - startTime
    });

    return data;
  } catch (error) {
    if (error instanceof ExternalServiceError) {
      throw error; // Re-throw our custom error
    }

    logger.error(`Failed to fetch from TMDB API endpoint: ${endpoint}`, error instanceof Error ? error : new Error(String(error)), {
      endpoint,
      method,
      duration: Date.now() - startTime
    });

    throw new ExternalServiceError('TMDB', error instanceof Error ? error.message : 'Unknown error');
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
  return request<TmdbSearchMultiResponse>('/search/multi', {
    params: { query, page, include_adult },
  });
};

export const getMovieDetails = (
  movieId: number,
  appendToResponse?: string[]
): Promise<TmdbMovieDetails> => {
  return request<TmdbMovieDetails>(`/movie/${movieId}`, {
    params: { append_to_response: appendToResponse?.join(',') },
  });
};

export const getTvShowDetails = (
  tvId: number,
  appendToResponse?: string[]
): Promise<TmdbTvDetails> => {
  return request<TmdbTvDetails>(`/tv/${tvId}`, {
    params: { append_to_response: appendToResponse?.join(',') },
  });
};

export const getTrending = (
  mediaType: 'all' | 'movie' | 'tv' | 'person' = 'all',
  timeWindow: 'day' | 'week' = 'week',
  page: number = 1
): Promise<TmdbTrendingResponse> => {
  return request<TmdbTrendingResponse>(`/trending/${mediaType}/${timeWindow}`, { params: { page } });
};

export const discoverMedia = (
  mediaType: 'movie' | 'tv',
  params: TmdbDiscoverParams = {}
): Promise<TmdbPaginatedResponse<TmdbMedia>> => {
  return request<TmdbPaginatedResponse<TmdbMedia>>(`/discover/${mediaType}`, {
    params: params as Record<string, any>
  });
};

export const getPersonDetails = (
  personId: number,
  appendToResponse?: string[]
): Promise<TmdbPersonDetails> => {
  return request<TmdbPersonDetails>(`/person/${personId}`, {
    params: { append_to_response: appendToResponse?.join(',') },
  });
};

export const getPersonCombinedCredits = (
  personId: number
): Promise<TmdbCombinedCreditsResponse> => {
  return request<TmdbCombinedCreditsResponse>(`/person/${personId}/combined_credits`);
};

export const getWatchProviders = (
  mediaType: 'movie' | 'tv',
  id: number
): Promise<TmdbWatchProviderResponse> => {
  return request<TmdbWatchProviderResponse>(`/${mediaType}/${id}/watch/providers`);
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

export async function getNowPlayingMovies(page: number = 1): Promise<TmdbPaginatedResponse<TmdbMedia>> {
  return request<TmdbPaginatedResponse<TmdbMedia>>('/movie/now_playing', { params: { page } });
}

export async function getUpcomingMovies(page: number = 1): Promise<TmdbPaginatedResponse<TmdbMedia>> {
  return request<TmdbPaginatedResponse<TmdbMedia>>('/movie/upcoming', { params: { page } });
}

export async function getMovieCredits(movieId: number): Promise<TmdbMovieCreditsResponse> {
  return request<TmdbMovieCreditsResponse>(`/movie/${movieId}/credits`);
}

export async function getMovieWatchProviders(movieId: number): Promise<TmdbWatchProviderResponse> {
  return request<TmdbWatchProviderResponse>(`/movie/${movieId}/watch/providers`);
}

export async function getMovieVideos(movieId: number): Promise<TmdbVideosResponse> {
  return request<TmdbVideosResponse>(`/movie/${movieId}/videos`);
}

export async function getMovieRecommendations(movieId: number, page: number = 1): Promise<TmdbPaginatedResponse<TmdbMedia>> {
  return request<TmdbPaginatedResponse<TmdbMedia>>(`/movie/${movieId}/recommendations`, { params: { page } });
}

export async function getSimilarMovies(movieId: number, page: number = 1): Promise<TmdbPaginatedResponse<TmdbMedia>> {
  return request<TmdbPaginatedResponse<TmdbMedia>>(`/movie/${movieId}/similar`, { params: { page } });
}

export const searchMovies = (
  query: string,
  page: number = 1,
  include_adult: boolean = false
): Promise<TmdbPaginatedResponse<TmdbMedia>> => {
  return request<TmdbPaginatedResponse<TmdbMedia>>('/search/movie', {
    params: { query, page, include_adult },
  });
};

export const searchTvShows = (
  query: string,
  page: number = 1,
  include_adult: boolean = false
): Promise<TmdbPaginatedResponse<TmdbMedia>> => {
  return request<TmdbPaginatedResponse<TmdbMedia>>('/search/tv', {
    params: { query, page, include_adult },
  });
};

export const searchPeople = (
  query: string,
  page: number = 1,
  include_adult: boolean = false
): Promise<TmdbPaginatedResponse<TmdbMedia>> => {
  return request<TmdbPaginatedResponse<TmdbMedia>>('/search/person', {
    params: { query, page, include_adult },
  });
};

export async function getTvShowCredits(tvId: number): Promise<TmdbTvCreditsResponse> {
  return request<TmdbTvCreditsResponse>(`/tv/${tvId}/credits`);
}

export async function getTvShowWatchProviders(tvId: number): Promise<TmdbWatchProviderResponse> {
  return request<TmdbWatchProviderResponse>(`/tv/${tvId}/watch/providers`);
}

export async function getTvShowVideos(tvId: number): Promise<TmdbVideosResponse> {
  return request<TmdbVideosResponse>(`/tv/${tvId}/videos`);
}

export async function getSimilarTvShows(tvId: number, page: number = 1): Promise<TmdbPaginatedResponse<TmdbMedia>> {
  return request<TmdbPaginatedResponse<TmdbMedia>>(`/tv/${tvId}/similar`, { params: { page } });
}

export async function getTvShowRecommendations(tvId: number, page: number = 1): Promise<TmdbPaginatedResponse<TmdbMedia>> {
  return request<TmdbPaginatedResponse<TmdbMedia>>(`/tv/${tvId}/recommendations`, { params: { page } });
}

// TV Season and Episode functions
export async function getTvSeason(tvId: number, seasonNumber: number): Promise<TmdbSeasonDetails> {
  return request<TmdbSeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`);
}

export async function getTvEpisode(tvId: number, seasonNumber: number, episodeNumber: number): Promise<TmdbEpisodeDetails> {
  return request<TmdbEpisodeDetails>(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
} 