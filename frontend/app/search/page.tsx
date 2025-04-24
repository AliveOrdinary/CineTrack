import { Suspense } from 'react';
import { getMovieGenres, getTvGenres, search, discoverMovies, discoverTvShows } from '@/services/tmdb';
import MediaCard from '@/components/media-card';
import SearchBar from '@/components/search-bar';
import SearchFilters from '@/components/search-filters';
import Pagination from '@/components/pagination';

// Type definitions
interface Genre {
  id: number;
  name: string;
}

interface GenreResponse {
  genres: Genre[];
}

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  profile_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  media_type?: 'movie' | 'tv' | 'person';
  genre_ids?: number[];
}

interface SearchResponse {
  page: number;
  results: SearchResult[];
  total_pages: number;
  total_results: number;
}

// Function to fetch search results
async function fetchResults(searchParams: {
  query?: string;
  type?: string;
  genre?: string;
  year?: string;
  sort?: string;
  page?: string;
}): Promise<SearchResponse> {
  const page = parseInt(searchParams.page || '1', 10);
  const query = searchParams.query;
  const type = searchParams.type || 'all';
  const genreId = searchParams.genre;
  const year = searchParams.year;
  const sortBy = searchParams.sort || 'popularity.desc';
  
  // If there's a search query, use the search endpoint
  if (query) {
    return search(
      query,
      page,
      false,  // includeAdult
      type !== 'all' ? type as any : undefined
    ) as Promise<SearchResponse>;
  }
  
  // Otherwise, use the discover endpoints based on media type
  const params: Record<string, string | number | boolean> = {
    sort_by: sortBy
  };
  
  if (genreId) {
    params.with_genres = genreId;
  }
  
  if (year) {
    if (type === 'movie') {
      params.primary_release_year = year;
    } else if (type === 'tv') {
      params.first_air_date_year = year;
    } else {
      // For 'all' type or 'person', apply the primary_release_year for movies only
      // This is a workaround since we're using discoverMovies for the default case
      params.primary_release_year = year;
    }
  }
  
  if (type === 'tv') {
    return discoverTvShows(params, page) as Promise<SearchResponse>;
  } else if (type === 'person') {
    // For person type without query, fallback to discover movies
    return discoverMovies(params, page) as Promise<SearchResponse>;
  } else {
    // Default to movies or if type is 'all' (when not searching)
    return discoverMovies(params, page) as Promise<SearchResponse>;
  }
}

// Main search content component
async function SearchContent({ searchParams }: { searchParams: Record<string, string> }) {
  // Fetch genres for filters
  const [movieGenresData, tvGenresData] = await Promise.all([
    getMovieGenres() as Promise<GenreResponse>,
    getTvGenres() as Promise<GenreResponse>
  ]);
  
  // Fetch search results
  const results = await fetchResults(searchParams);
  
  const currentPage = parseInt(searchParams.page || '1', 10);
  const query = searchParams.query || '';
  
  // Map genre IDs to genre names for display
  const movieGenreMap: Record<number, string> = {};
  const tvGenreMap: Record<number, string> = {};
  
  movieGenresData.genres.forEach((genre) => {
    movieGenreMap[genre.id] = genre.name;
  });
  
  tvGenresData.genres.forEach((genre) => {
    tvGenreMap[genre.id] = genre.name;
  });
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {query ? `Search Results for "${query}"` : 'Discover'}
      </h1>
      
      <div className="mb-6">
        <SearchBar initialQuery={query} />
      </div>
      
      <SearchFilters 
        movieGenres={movieGenresData.genres} 
        tvGenres={tvGenresData.genres} 
      />
      
      {results.results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {results.results.map((item) => {
            // Determine if this is a movie, TV show, or person
            const isMovie = item.media_type === 'movie' || (!item.media_type && item.title);
            const isTv = item.media_type === 'tv' || (!item.media_type && item.name && !item.profile_path);
            const isPerson = item.media_type === 'person' || (!item.media_type && item.profile_path);
            
            if (isPerson) {
              // For people, handle differently
              return (
                <div 
                  key={item.id} 
                  className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-600 transition-all"
                >
                  <div className="relative aspect-[2/3] w-full">
                    <img
                      src={item.profile_path 
                        ? `https://image.tmdb.org/t/p/w300${item.profile_path}`
                        : 'https://via.placeholder.com/300x450?text=No+Image'}
                      alt={item.name || 'Person'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-400">Person</p>
                  </div>
                </div>
              );
            }
            
            // For movies and TV shows, use the existing MediaCard component
            return (
              <MediaCard
                key={item.id}
                id={item.id}
                title={isMovie ? item.title || '' : item.name || ''}
                posterPath={item.poster_path || null}
                releaseDate={isMovie ? item.release_date : item.first_air_date}
                voteAverage={item.vote_average}
                mediaType={isMovie ? 'movie' : 'tv'}
                genreNames={
                  isMovie
                    ? item.genre_ids?.map((id) => movieGenreMap[id]).filter(Boolean) || []
                    : item.genre_ids?.map((id) => tvGenreMap[id]).filter(Boolean) || []
                }
              />
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-xl text-gray-400">No results found.</p>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
        </div>
      )}
      
      <Pagination
        currentPage={currentPage}
        totalPages={results.total_pages > 500 ? 500 : results.total_pages}
        totalResults={results.total_results}
      />
    </div>
  );
}

// Main search page component
export default function SearchPage({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  // Convert searchParams to the expected format
  const params: Record<string, string> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    params[key] = Array.isArray(value) ? value[0] || '' : value || '';
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={
        <div className="animate-pulse">
          <div className="h-10 bg-gray-800 rounded w-1/4 mb-6"></div>
          <div className="h-12 bg-gray-800 rounded w-full mb-6"></div>
          <div className="h-40 bg-gray-800 rounded w-full mb-6"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="aspect-[2/3] bg-gray-800"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-800 rounded mb-2"></div>
                  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }>
        <SearchContent searchParams={params} />
      </Suspense>
    </div>
  );
} 