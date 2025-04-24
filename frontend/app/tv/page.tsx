import { Suspense } from 'react';
import Link from 'next/link';
import MediaCard from '@/components/media-card';
import Pagination from '@/components/pagination';
import { getPopularTvShows, getTvGenres } from '@/services/tmdb';

const ITEMS_PER_PAGE = 20;

// Define types for the TMDB API responses
interface TvShowResult {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
}

interface TvShowsResponse {
  page: number;
  results: TvShowResult[];
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

// TV Shows content component
async function TvShowsContent({ page = 1 }: { page?: number }) {
  // Fetch popular TV shows for the current page
  const tvShowsData = await getPopularTvShows(page) as TvShowsResponse;

  // Fetch TV show genres to display genre names
  const genresData = await getTvGenres() as GenresResponse;
  
  // Create a map of genre IDs to genre names
  const genreMap: Record<number, string> = {};
  genresData.genres.forEach((genre: Genre) => {
    genreMap[genre.id] = genre.name;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Popular TV Shows</h1>
        <div className="flex gap-2">
          <Link
            href="/tv?filter=popular"
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            Popular
          </Link>
          <Link
            href="/tv?filter=top_rated"
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            Top Rated
          </Link>
          <Link
            href="/tv?filter=on_the_air"
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            On The Air
          </Link>
          <Link
            href="/tv?filter=airing_today"
            className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            Airing Today
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {tvShowsData.results.map((show: TvShowResult) => (
          <MediaCard
            key={show.id}
            id={show.id}
            title={show.name}
            posterPath={show.poster_path}
            releaseDate={show.first_air_date}
            voteAverage={show.vote_average}
            mediaType="tv"
            genreNames={mapGenreIdsToNames(show.genre_ids, genreMap)}
          />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={tvShowsData.total_pages > 500 ? 500 : tvShowsData.total_pages} // TMDB API limits to 500 pages
        totalResults={tvShowsData.total_results}
      />
    </div>
  );
}

// Main TV Shows page component
export default function TvShowsPage({
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
        <TvShowsContent page={currentPage} />
      </Suspense>
    </div>
  );
} 