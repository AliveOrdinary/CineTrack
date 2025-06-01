// Basic TMDB type definitions - expand as needed

export interface TmdbPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMedia {
  id: number;
  title?: string; // For movies
  name?: string; // For TV shows and people
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: 'movie' | 'tv' | 'person';
  genre_ids?: number[];
  popularity: number;
  vote_average?: number;
  vote_count?: number;
  release_date?: string; // For movies
  first_air_date?: string; // For TV shows
}

export interface TmdbMovieDetails extends TmdbMedia {
  media_type: 'movie';
  title: string;
  runtime: number | null;
  genres: TmdbGenre[];
  // Add more movie-specific fields
}

export interface TmdbTvDetails extends TmdbMedia {
  media_type: 'tv';
  name: string;
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: any[]; // Define season type later
  genres: TmdbGenre[];
  // Add more TV-specific fields
}

export interface TmdbPersonDetails extends TmdbMedia {
  media_type: 'person';
  name: string;
  profile_path: string | null;
  // Add more person-specific fields
}

export type TmdbSearchMultiResponse = TmdbPaginatedResponse<TmdbMedia>;
export type TmdbTrendingResponse = TmdbPaginatedResponse<TmdbMedia>;

export interface TmdbDiscoverParams {
  page?: number;
  sort_by?: string;
  with_genres?: string;
  year?: number;
  // Add more discover parameters
}

export interface TmdbWatchProvider {
  provider_name: string;
  logo_path: string;
}

export interface TmdbWatchProviderResult {
  link: string;
  flatrate?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
}

export interface TmdbWatchProviderResponse {
  id: number;
  results: Record<string, TmdbWatchProviderResult>; // Keyed by country code e.g. "US"
}

export interface TmdbContentRating {
  iso_3166_1: string;
  rating: string;
}

export interface TmdbReleaseDate {
  certification: string;
  iso_639_1: string;
  note: string;
  release_date: string;
  type: number;
}

export interface TmdbReleaseDatesResult {
  iso_3166_1: string;
  release_dates: TmdbReleaseDate[];
}

export interface TmdbReleaseDatesResponse {
  id: number;
  results: TmdbReleaseDatesResult[];
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department: string;
  media_type: 'person';
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
  media_type: 'person';
}

export interface TmdbCombinedCreditsResponse {
  id: number; // Person ID
  cast: (TmdbMovieDetails | (TmdbTvDetails & { character: string }))[];
  crew: (TmdbMovieDetails | (TmdbTvDetails & { job: string; department: string }))[];
}

export interface TmdbMovieCreditsResponse {
  id: number; // Movie ID
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbTvCreditsResponse {
  id: number; // TV Show ID
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

// New Types for Videos
export interface TmdbVideo {
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  key: string; // YouTube key, for example
  site: string; // e.g., "YouTube"
  size: number; // e.g., 1080
  type: string; // e.g., "Trailer", "Teaser", "Clip", "Featurette"
  official: boolean;
  published_at: string;
  id: string; // Video ID from TMDB
}

export interface TmdbVideosResponse {
  id: number; // Movie or TV Show ID
  results: TmdbVideo[];
}

// Placeholder for potential Zod schema
export type TmdbMediaSchemaType = Record<string, any>;
export const TmdbMediaSchema: TmdbMediaSchemaType = {};

export interface TmdbGenre {
  id: number;
  name: string;
}

// TV Season and Episode Types
export interface TmdbEpisode {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
  crew: TmdbCrewMember[];
  guest_stars: TmdbCastMember[];
}

export interface TmdbSeason {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  season_number: number;
  poster_path: string | null;
  episode_count: number;
  episodes: TmdbEpisode[];
}

export interface TmdbSeasonDetails extends TmdbSeason {
  _id: string;
  episodes: TmdbEpisode[];
}

export interface TmdbEpisodeDetails extends TmdbEpisode {
  production_code: string;
  images: {
    stills: Array<{
      aspect_ratio: number;
      file_path: string;
      height: number;
      width: number;
      vote_average: number;
      vote_count: number;
    }>;
  };
}
