// Types based on TMDB API documentation for /search/multi endpoint

export type MediaType = 'movie' | 'tv' | 'person';

export interface SearchResult {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  media_type: MediaType;
  original_language: string;
  original_title?: string; // For movies
  original_name?: string; // For TV shows and people
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date?: string; // Format YYYY-MM-DD (for movies)
  first_air_date?: string; // Format YYYY-MM-DD (for TV shows)
  title?: string; // For movies
  name?: string; // For TV shows and people
  video?: boolean; // For movies
  vote_average: number;
  vote_count: number;
  // Fields specific to people
  gender?: number;
  known_for_department?: string;
  profile_path?: string | null;
  known_for?: SearchResult[]; // People results might have 'known_for' array
}

export interface MultiSearchResult {
  page: number;
  results: SearchResult[];
  total_pages: number;
  total_results: number;
}

// Type for Time Window options
export type TimeWindow = 'day' | 'week';

// Type for Genre object
export interface Genre {
  id: number;
  name: string;
}

// Type for Genre List response
export interface GenreList {
  genres: Genre[];
}

// Types for Watch Providers
export interface WatchProviderDetails {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProviderRegion {
  link: string;
  flatrate?: WatchProviderDetails[];
  rent?: WatchProviderDetails[];
  buy?: WatchProviderDetails[];
}

export interface WatchProviderResponse {
  id: number;
  results: Record<string, WatchProviderRegion>;
}

// --- Detailed Types --- 

interface BaseMediaDetails {
  id: number;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  homepage: string | null;
  original_language: string;
  overview: string | null;
  popularity: number;
  poster_path: string | null;
  production_companies: { id: number; logo_path: string | null; name: string; origin_country: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[];
  status: string;
  tagline: string | null;
  vote_average: number;
  vote_count: number;
}

export interface MovieDetails extends BaseMediaDetails {
  adult: boolean;
  belongs_to_collection: { id: number; name: string; poster_path: string | null; backdrop_path: string | null } | null;
  budget: number;
  imdb_id: string | null;
  original_title: string;
  release_date: string; // YYYY-MM-DD
  revenue: number;
  runtime: number | null;
  title: string;
  video: boolean;
}

export interface TVDetails extends BaseMediaDetails {
  created_by: { id: number; credit_id: string; name: string; gender: number; profile_path: string | null }[];
  episode_run_time: number[];
  first_air_date: string; // YYYY-MM-DD
  in_production: boolean;
  languages: string[];
  last_air_date: string | null;
  last_episode_to_air: { air_date: string; episode_number: number; id: number; name: string; overview: string; production_code: string; season_number: number; still_path: string | null; vote_average: number; vote_count: number } | null;
  name: string;
  next_episode_to_air: any | null; // Define more specific type if needed
  networks: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country: string[];
  original_name: string;
  seasons: { air_date: string | null; episode_count: number; id: number; name: string; overview: string; poster_path: string | null; season_number: number }[];
  type: string;
}

// --- Person Details Type ---
export interface PersonDetails {
  adult: boolean;
  also_known_as: string[];
  biography: string | null;
  birthday: string | null; // YYYY-MM-DD
  deathday: string | null; // YYYY-MM-DD
  gender: number; // 0: Not set, 1: Female, 2: Male, 3: Non-binary
  homepage: string | null;
  id: number;
  imdb_id: string | null;
  known_for_department: string;
  name: string;
  place_of_birth: string | null;
  popularity: number;
  profile_path: string | null;
  // Add other fields as needed, like combined_credits, images, etc.
} 