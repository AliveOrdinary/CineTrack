import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTvDetails, getWatchProviders } from '@/services/tmdb';
import { TVDetails, WatchProviderResponse, SearchResult } from '@/types/tmdb'; // Import necessary types

// Import components
import MediaHero from '@/components/media-hero';
import PersonGrid from '@/components/person-grid';
import DetailsSidebar from '@/components/details-sidebar';
import WatchProviders from '@/components/watch-providers';
import MediaRecommendations from '@/components/media-recommendations';
import ReviewList from '@/components/review-list';

// Re-use CreditPerson interface from movie page or define here
interface CreditPerson {
  id: number;
  name: string;
  profile_path: string | null;
  job?: string; // For crew
  character?: string; // For cast
  credit_id?: string; // Specific to TV created_by
  gender?: number; // Specific to TV created_by
}

// Server component to fetch and display TV show details
async function TvContent({ id }: { id: number }) {
  let show: TVDetails;
  let watchProvidersData: WatchProviderResponse | null;

  try {
    // Fetch TV details and watch providers in parallel
    [show, watchProvidersData] = await Promise.all([
      getTvDetails(id, ['credits', 'similar', 'videos']),
      getWatchProviders('tv', id, 'US')
    ]);
  } catch (error) {
     console.error(`Error fetching TV details or providers for ID ${id}:`, error);
     if ((error as any)?.response?.status === 404 || (error as any)?.status === 404) {
        notFound();
     }
     notFound(); // Fallback
  }

  // Check show first
  if (!show) {
    notFound();
  }

  // Extract data using the TVDetails type
  const credits = (show as any).credits as { cast: CreditPerson[], crew: CreditPerson[] } | undefined;
  const topCast = credits?.cast?.slice(0, 12) || [];
  const creators = show.created_by as CreditPerson[] || []; // Use CreditPerson type

  const similarResults = (show as any).similar?.results as SearchResult[] | undefined;
  const recommendations = similarResults?.map((item) => ({
      ...item,
      media_type: 'tv' as const // Ensure media_type is tv
  })) || [];

  return (
    <div>
      <MediaHero item={show} mediaType="tv" />

      <div className="container mx-auto px-4 py-8 space-y-8">
        <section>
          <DetailsSidebar
              status={show.status}
              originalLanguage={show.original_language}
              networks={show.networks}
              type={show.type}
              numberOfSeasons={show.number_of_seasons}
              numberOfEpisodes={show.number_of_episodes}
            />
        </section>

        {/* Conditionally render Watch Providers and pass correct data */}
        {watchProvidersData && watchProvidersData.results.US && (
          <section>
            {/* Pass the specific region data */}
            <WatchProviders providers={watchProvidersData.results.US} />
          </section>
        )}

        <section>
          <PersonGrid title="Top Cast" people={topCast} itemType="cast" />
        </section>

        {creators.length > 0 && (
          <section>
             <PersonGrid title="Created By" people={creators} itemType="crew" />
          </section>
        )}

        <section>
          <MediaRecommendations title="Similar Shows" items={recommendations} />
        </section>

        <section>
          <ReviewList tmdbId={id} mediaType="tv" />
        </section>
      </div>
    </div>
  );
}

// Main Page Component
export default function TvPage({ params }: { params: { id: string } }) {
  const showId = parseInt(params.id, 10);

  if (isNaN(showId)) {
    notFound(); 
  }

  return (
    <Suspense fallback={<TvPageSkeleton />}>
      <TvContent id={showId} />
    </Suspense>
  );
}

// Basic Skeleton Loading Component - Adjusted for single column flow
function TvPageSkeleton() {
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
      {/* Content Skeleton - Single column flow */}
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
         {/* Creators Skeleton (Example: assuming 1 creator) */}
         <div>
           <div className="h-8 bg-gray-800 rounded w-1/6 mb-4"></div>
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