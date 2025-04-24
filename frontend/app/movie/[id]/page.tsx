import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getMovieDetails, getWatchProviders } from '@/services/tmdb';
import { MovieDetails, WatchProviderResponse, PersonDetails, SearchResult } from '@/types/tmdb'; // Import necessary types

// Import components
import MediaHero from '@/components/media-hero';
import PersonGrid from '@/components/person-grid';
import DetailsSidebar from '@/components/details-sidebar';
import WatchProviders from '@/components/watch-providers';
import MediaRecommendations from '@/components/media-recommendations';
import ReviewList from '@/components/review-list';

// Define types for nested structures if not already in tmdb.ts (example for credits)
interface CreditPerson {
  id: number;
  name: string;
  profile_path: string | null;
  job?: string; // For crew
  character?: string; // For cast
}

// Server component to fetch and display movie details
async function MovieContent({ id }: { id: number }) {
  let movie: MovieDetails;
  let watchProvidersData: WatchProviderResponse | null; // Allow null

  try {
    // Fetch movie details and watch providers in parallel
    [movie, watchProvidersData] = await Promise.all([
      getMovieDetails(id, ['credits', 'similar', 'videos']),
      getWatchProviders('movie', id, 'US') // This can return null
    ]);
  } catch (error) {
     console.error(`Error fetching movie details or providers for ID ${id}:`, error);
     if ((error as any)?.response?.status === 404 || (error as any)?.status === 404) {
        notFound();
     }
     notFound(); // Fallback
  }

  // Check movie first as it's required for MediaHero
  if (!movie) {
    notFound();
  }

  // Extract data using the MovieDetails type
  // Access appended properties using 'any' cast for now
  const credits = (movie as any).credits as { cast: CreditPerson[], crew: CreditPerson[] } | undefined;
  const topCast = credits?.cast?.slice(0, 12) || [];
  const director = credits?.crew?.find((person) => person.job === 'Director');
  const crew = director ? [director] : [];

  // Access appended properties using 'any' cast for now
  const similarResults = (movie as any).similar?.results as SearchResult[] | undefined;
  const recommendations = similarResults?.map((item) => ({
      ...item,
      media_type: 'movie' as const
  })) || [];

  return (
    <div>
      {/* Pass the typed movie object */}
      <MediaHero item={movie} mediaType="movie" />

      {/* Main content area */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Details Section */}
        <section>
           <DetailsSidebar
              status={movie.status}
              originalLanguage={movie.original_language}
              budget={movie.budget}
              revenue={movie.revenue}
            />
        </section>

        {/* Watch Providers Section - Conditionally render and pass correct data */}
        {watchProvidersData && watchProvidersData.results.US && (
          <section>
            {/* Pass the specific region data */}
            <WatchProviders providers={watchProvidersData.results.US} />
          </section>
        )}

        {/* Cast Grid */}
        <section>
           <PersonGrid title="Top Cast" people={topCast} itemType="cast" />
        </section>

        {/* Director Grid */}
        <section>
           <PersonGrid title="Director" people={crew} itemType="crew" />
        </section>

        {/* Recommendations */}
        <section>
           <MediaRecommendations title="Similar Movies" items={recommendations} />
        </section>

        {/* Reviews Section */}
        <section>
           <ReviewList tmdbId={id} mediaType="movie" />
        </section>
      </div>
    </div>
  );
}

// Main Page Component
export default function MoviePage({ params }: { params: { id: string } }) {
  const movieId = parseInt(params.id, 10);

  if (isNaN(movieId)) {
    notFound(); // Handle invalid ID format
  }

  return (
    <Suspense fallback={<MoviePageSkeleton />}>
      <MovieContent id={movieId} />
    </Suspense>
  );
}

// Basic Skeleton Loading Component
function MoviePageSkeleton() {
  return (
    <div>
       {/* Hero Skeleton */}
      <div className="relative w-full h-[70vh] mb-8 bg-gray-900 animate-pulse">
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-8 flex flex-col md:flex-row items-end gap-8 z-10">
          <div className="w-48 h-72 shrink-0 mx-auto md:mx-0 bg-gray-800 rounded-lg"></div>
          <div className="flex-1 space-y-4">
             <div className="h-10 bg-gray-800 rounded w-3/4"></div>
             <div className="h-4 bg-gray-800 rounded w-1/2"></div>
             <div className="h-4 bg-gray-800 rounded w-full"></div>
             <div className="h-4 bg-gray-800 rounded w-5/6"></div>
             <div className="h-10 bg-gray-800 rounded w-48"></div>
          </div>
        </div>
      </div>
      {/* Content Skeleton - Adjusted to single column flow */}
      <div className="container mx-auto px-4 py-8 space-y-8">
         {/* Details + Watch Providers Skeleton */}
         <div className="h-48 bg-gray-800 rounded-lg"></div>
         <div className="h-48 bg-gray-800 rounded-lg"></div>
         {/* Cast Skeleton */}
         <div>
           <div className="h-8 bg-gray-800 rounded w-1/4 mb-4"></div>
           <div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg"></div>)}
           </div>
         </div>
         {/* Director Skeleton */}
         <div>
           <div className="h-8 bg-gray-800 rounded w-1/5 mb-4"></div>
           <div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(1)].map((_, i) => <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg"></div>)}
           </div>
         </div>
         {/* Recommendations Skeleton */}
         <div>
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {[...Array(4)].map((_, i) => <div key={i} className="aspect-[16/9] bg-gray-800 rounded-lg"></div>)}
            </div>
         </div>
          {/* Reviews Skeleton */}
         <div>
           <div className="h-8 bg-gray-800 rounded w-1/5 mb-4"></div>
           <div className="space-y-4">
             <div className="h-32 bg-gray-800 rounded-lg"></div>
             <div className="h-32 bg-gray-800 rounded-lg"></div>
           </div>
         </div>
      </div>
    </div>
  );
} 