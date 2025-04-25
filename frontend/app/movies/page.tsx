import { Suspense } from 'react';
import Link from 'next/link';
import MediaCard from '@/components/media-card';
import Pagination from '@/components/pagination';
import { getPopularMovies, getMovieGenres } from '@/services/tmdb';

const ITEMS_PER_PAGE = 20;

// Define types for the TMDB API responses
interface MovieResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

interface MoviesResponse {
  page: number;
  results: MovieResult[];
  total_pages: number;
  total_results: number;
}

interface Genre {
  id: number;
  name: string;
}

interface GenresResponse {
  genres: Genre[];
}

// Function to map genre IDs to genre names
const mapGenreIdsToNames = (genreIds: number[], genreMap: Record<number, string>): string[] => {
  return genreIds.map(id => genreMap[id] || '').filter(Boolean);
};

// Movies content component
async function MoviesContent({ page = 1 }: { page?: number }) {
  // Fetch popular movies for the current page
  const moviesData = await getPopularMovies(page) as MoviesResponse;

  // Fetch movie genres to display genre names
  const genresData = await getMovieGenres() as GenresResponse;
  
  // Create a map of genre IDs to genre names
  const genreMap: Record<number, string> = {};
  genresData.genres.forEach((genre: Genre) => {
    genreMap[genre.id] = genre.name;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Popular Movies</h1>
        <div className="flex gap-2">
          <Link
            href="/movies?filter=popular"
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            Popular
          </Link>
          <Link
            href="/movies?filter=top_rated"
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            Top Rated
          </Link>
          <Link
            href="/movies?filter=now_playing"
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            Now Playing
          </Link>
          <Link
            href="/movies?filter=upcoming"
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            Upcoming
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {moviesData.results.map((movie: MovieResult) => (
          <MediaCard
            key={movie.id}
            id={movie.id}
            title={movie.title}
            posterPath={movie.poster_path}
            releaseDate={movie.release_date}
            voteAverage={movie.vote_average}
            mediaType="movie"
            genreNames={mapGenreIdsToNames(movie.genre_ids, genreMap)}
          />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={moviesData.total_pages > 500 ? 500 : moviesData.total_pages} // TMDB API limits to 500 pages
        totalResults={moviesData.total_results}
        basePath="/movies"
      />
    </div>
  );
}

// Main Movies page component
export default function MoviesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Get the current page from query parameters
  const pageParam = searchParams.page;
  const currentPage = pageParam ? parseInt(pageParam as string, 10) : 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(20)].map((_, i) => (
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
        <MoviesContent page={currentPage} />
      </Suspense>
    </div>
  );
} 