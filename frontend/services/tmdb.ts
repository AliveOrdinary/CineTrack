/**
 * TMDB API Service
 * This service handles all interactions with The Movie Database API
 * No authentication required - all movie/TV data is publicly accessible
 */

import { Image } from 'lucide-react';

// Import types from the shared location
import { 
  MultiSearchResult,
  MovieDetails, 
  TVDetails, 
  PersonDetails, 
  GenreList, 
  WatchProviderResponse, 
  WatchProviderRegion, 
  SearchResult, // Ensure SearchResult is imported if needed by MultiSearchResult
  MediaType, 
  TimeWindow 
} from '@/types/tmdb';

// Define API Base URL and Key from environment variables
const TMDB_API_BASE_URL = process.env.NEXT_PUBLIC_TMDB_API_BASE_URL;
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'; // Define the correct image base URL

// Helper function to construct API URLs
const constructUrl = (path: string, queryParams: Record<string, string | number | boolean> = {}) => {
  const url = new URL(`${TMDB_API_BASE_URL}${path}`);
  
  // Add API key to all requests
  url.searchParams.append('api_key', TMDB_API_KEY || '');
  
  // Add additional query parameters
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  
  return url.toString();
};

// Helper function to make API requests
const fetchFromTMDB = async <T>(
  path: string, 
  queryParams: Record<string, string | number | boolean> = {}
): Promise<T> => {
  // --- Environment Variable Checks ---
  if (!TMDB_API_BASE_URL) {
    throw new Error('Missing TMDB API Base URL. Check NEXT_PUBLIC_TMDB_API_BASE_URL environment variable.');
  }
  if (!TMDB_API_KEY) {
    throw new Error('Missing TMDB API Key. Check NEXT_PUBLIC_TMDB_API_KEY environment variable.');
  }
  // --- End Checks ---
  
  const url = constructUrl(path, queryParams);
  
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
  };
  
  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (parseError) {
        // Handle cases where the error response is not JSON
        throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
      }
      throw new Error(`TMDB API Error: ${errorData?.status_message || response.statusText}`);
    }
    
    // Await the JSON parsing and then cast
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`Error fetching from TMDB path ${path}:`, error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
};

// Helper function to get image URLs
export const getImageUrl = (path: string | null, size: string = 'original'): string => {
  if (!path) return '/images/no-image.png';
  // Use the correct image base URL constant
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Get trending movies or TV shows
// Public access - no auth required
export const getTrending = async (
  mediaType: MediaType | 'all' = 'all',
  timeWindow: TimeWindow = 'day',
  page: number = 1
): Promise<MultiSearchResult> => {
  return fetchFromTMDB<MultiSearchResult>(`/trending/${mediaType}/${timeWindow}`, { page });
};

// Get details for a movie
// Public access - no auth required
export const getMovieDetails = async (
  movieId: number,
  appendToResponse: string[] = []
): Promise<MovieDetails> => {
  const queryParams: Record<string, string | number | boolean> = {};
  
  if (appendToResponse.length > 0) {
    queryParams.append_to_response = appendToResponse.join(',');
  }
  
  return fetchFromTMDB<MovieDetails>(`/movie/${movieId}`, queryParams);
};

// Get details for a TV show
// Public access - no auth required
export const getTvDetails = async (
  tvId: number,
  appendToResponse: string[] = []
): Promise<TVDetails> => {
  const queryParams: Record<string, string | number | boolean> = {};
  
  if (appendToResponse.length > 0) {
    queryParams.append_to_response = appendToResponse.join(',');
  }
  
  return fetchFromTMDB<TVDetails>(`/tv/${tvId}`, queryParams);
};

// Get watch providers for a movie or TV show
// Public access - no auth required
export const getWatchProviders = async (
  mediaType: 'movie' | 'tv',
  id: number,
  // Region parameter is not used here anymore, but kept for potential future use
  region: string = 'US' 
): Promise<WatchProviderResponse | null> => { // Changed return type
  try {
    const data = await fetchFromTMDB<WatchProviderResponse>(`/${mediaType}/${id}/watch/providers`);
    // Return the entire response object if it has results, otherwise null
    // A basic check is if the results field exists and is not empty.
    if (data && data.results && Object.keys(data.results).length > 0) {
      return data;
    } else {
      return null;
    }
  } catch (error) {
    // Log the error but return null to indicate failure
    console.error(`Error fetching watch providers for ${mediaType} ${id}:`, error);
    return null;
  }
};

// Search for movies, TV shows, or people
// Public access - no auth required
export const search = async (
  query: string,
  page: number = 1,
  includeAdult: boolean = false,
  mediaType?: MediaType
): Promise<MultiSearchResult> => {
  const endpoint = mediaType ? `/search/${mediaType}` : '/search/multi';
  
  return fetchFromTMDB<MultiSearchResult>(endpoint, {
    query,
    page,
    include_adult: includeAdult,
  });
};

// Discover movies based on various parameters
// Public access - no auth required
export const discoverMovies = async (
  params: Record<string, string | number | boolean> = {},
  page: number = 1
): Promise<MultiSearchResult> => {
  return fetchFromTMDB<MultiSearchResult>('/discover/movie', {
    page,
    ...params,
  });
};

// Discover TV shows based on various parameters
// Public access - no auth required
export const discoverTvShows = async (
  params: Record<string, string | number | boolean> = {},
  page: number = 1
): Promise<MultiSearchResult> => {
  return fetchFromTMDB<MultiSearchResult>('/discover/tv', {
    page,
    ...params,
  });
};

// Get movie recommendations
// Public access - no auth required
export const getMovieRecommendations = async (
  movieId: number,
  page: number = 1
): Promise<MultiSearchResult> => {
  return fetchFromTMDB<MultiSearchResult>(`/movie/${movieId}/recommendations`, { page });
};

// Get TV show recommendations
// Public access - no auth required
export const getTvRecommendations = async (
  tvId: number,
  page: number = 1
): Promise<MultiSearchResult> => {
  return fetchFromTMDB<MultiSearchResult>(`/tv/${tvId}/recommendations`, { page });
};

// Get now playing movies
// Public access - no auth required
export const getNowPlayingMovies = async (
  page: number = 1,
  region: string = 'US'
): Promise<MultiSearchResult & { dates?: { maximum: string; minimum: string } }> => {
  return fetchFromTMDB<MultiSearchResult & { dates?: { maximum: string; minimum: string } }>('/movie/now_playing', { page, region });
};

// Get popular movies
// Public access - no auth required
export const getPopularMovies = async (
  page: number = 1,
  region: string = 'US'
): Promise<MultiSearchResult> => {
  return fetchFromTMDB<MultiSearchResult>('/movie/popular', { page, region });
};

// Get top rated movies
// Public access - no auth required
export const getTopRatedMovies = async (
  page: number = 1,
  region: string = 'US'
): Promise<MultiSearchResult> => {
  return fetchFromTMDB<MultiSearchResult>('/movie/top_rated', { page, region });
};

// Get upcoming movies
// Public access - no auth required
export const getUpcomingMovies = async (
  page: number = 1,
  region: string = 'US'
): Promise<MultiSearchResult & { dates?: { maximum: string; minimum: string } }> => {
  return fetchFromTMDB<MultiSearchResult & { dates?: { maximum: string; minimum: string } }>('/movie/upcoming', { page, region });
};

// Get TV shows airing today
// Public access - no auth required
export const getTvAiringToday = async (
  page: number = 1
): Promise<MultiSearchResult> => {
  return fetchFromTMDB<MultiSearchResult>('/tv/airing_today', { page });
};

// Get TV shows on the air
// Public access - no auth required
export const getTvOnTheAir = async (
  page: number = 1
): Promise<MultiSearchResult> => {
  return fetchFromTMDB<MultiSearchResult>('/tv/on_the_air', { page });
};

// Get popular TV shows
// Public access - no auth required
export const getPopularTvShows = async (
  page: number = 1
): Promise<MultiSearchResult> => {
  return fetchFromTMDB<MultiSearchResult>('/tv/popular', { page });
};

// Get top rated TV shows
// Public access - no auth required
export const getTopRatedTvShows = async (
  page: number = 1
): Promise<MultiSearchResult> => {
  return fetchFromTMDB<MultiSearchResult>('/tv/top_rated', { page });
};

// Get genre lists
// Public access - no auth required
export const getMovieGenres = async (language: string = 'en-US'): Promise<GenreList> => {
  return fetchFromTMDB<GenreList>('/genre/movie/list', { language });
};

export const getTvGenres = async (language: string = 'en-US'): Promise<GenreList> => {
  return fetchFromTMDB<GenreList>('/genre/tv/list', { language });
};

// Get person details
// Public access - no auth required
export const getPersonDetails = async (
  personId: number,
  appendToResponse: string[] = []
): Promise<PersonDetails> => {
  const queryParams: Record<string, string | number | boolean> = {};
  
  if (appendToResponse.length > 0) {
    queryParams.append_to_response = appendToResponse.join(',');
  }
  
  return fetchFromTMDB<PersonDetails>(`/person/${personId}`, queryParams);
};

// NEW FUNCTION: Fetch details for a batch of media items
// No direct import needed for MovieDetails, TVDetails, PersonDetails as defined above

// Define combined types including the manually added media_type
// Export these types
export type FetchedMovieDetail = MovieDetails & { media_type: 'movie' };
export type FetchedTVDetail = TVDetails & { media_type: 'tv' };
export type FetchedPersonDetail = PersonDetails & { media_type: 'person' };
export type FetchedDetail = FetchedMovieDetail | FetchedTVDetail | FetchedPersonDetail;

export const fetchMediaDetailsBatch = async (
  mediaItems: { id: number; media_type: MediaType }[]
): Promise<FetchedDetail[]> => { 
  if (!mediaItems || mediaItems.length === 0) {
    return [];
  }

  const promises = mediaItems.map(async (item): Promise<FetchedDetail | null> => {
    try {
      switch (item.media_type) {
        case 'movie':
          // Fetch and cast carefully
          const movieData = await getMovieDetails(item.id);
          if (typeof movieData === 'object' && movieData !== null && 'id' in movieData) {
            return { ...(movieData as MovieDetails), media_type: 'movie' };
          }
          break;
        case 'tv':
          const tvData = await getTvDetails(item.id);
          if (typeof tvData === 'object' && tvData !== null && 'id' in tvData) {
            return { ...(tvData as TVDetails), media_type: 'tv' };
          }
          break;
        case 'person':
          const personData = await getPersonDetails(item.id);
          if (typeof personData === 'object' && personData !== null && 'id' in personData) {
            return { ...(personData as PersonDetails), media_type: 'person' };
          }
          break;
        default:
          console.warn(`Unsupported media type in batch fetch: ${item.media_type}`);
      }
    } catch (error) {
        console.error(`Error fetching details for ${item.media_type} ID ${item.id}:`, error);
    }
    return null; // Return null if fetch failed or type is unsupported/invalid
  });

  try {
    const results = await Promise.all(promises);
    // Filter out any null results
    return results.filter((result): result is FetchedDetail => result !== null);
  } catch (error) {
    // This catch might be redundant if Promise.all doesn't throw for individual rejections, 
    // but better safe than sorry. Individual errors are logged above.
    console.error("Error processing media details batch:", error);
    return [];
  }
};

const TMDBService = {
  getTrending,
  getMovieDetails,
  getTvDetails,
  getWatchProviders,
  search,
  discoverMovies,
  discoverTvShows,
  getMovieRecommendations,
  getTvRecommendations,
  getNowPlayingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getTvAiringToday,
  getTvOnTheAir,
  getPopularTvShows,
  getTopRatedTvShows,
  getImageUrl,
  getMovieGenres,
  getTvGenres,
  getPersonDetails,
  fetchMediaDetailsBatch,
};

export default TMDBService; 