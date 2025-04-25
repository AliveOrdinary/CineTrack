'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import useUser from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import MediaGrid from '@/components/media-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchMediaDetailsBatch } from '@/services/tmdb';
import { Database } from '@cinetrack/shared';
import { MediaType, MovieDetails, TVDetails, PersonDetails } from '@/types/tmdb';
import { MediaItem } from '@/components/media-grid';

// Type alias for Supabase tables
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
// Type alias for Supabase watchlist row
type WatchlistRow = Tables<"watchlist_content">;
// Type alias for the detailed items returned by the batch fetch
type FetchedDetail = MovieDetails | TVDetails | PersonDetails;

// Fetch only the watchlist IDs and types from Supabase
const fetchWatchlistContent = async (userId: string): Promise<WatchlistRow[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('watchlist_content')
    .select('id, tmdb_id, media_type, added_date') // Select only necessary fields initially
    .eq('user_id', userId)
    .order('added_date', { ascending: false });

  if (error) {
    console.error("Error fetching watchlist content:", error);
    throw new Error(error.message);
  }
  // Ensure data is not null and cast
  return (data || []) as WatchlistRow[]; 
};

export default function WatchlistPage() {
  const { user, isLoading: isUserLoading, error: userError } = useUser();
  const router = useRouter();

  // Redirect logic
  useEffect(() => {
    if (!isUserLoading && !user) {
      console.log('Watchlist page: No user found, redirecting to login');
      router.push('/login?redirect=/library/watchlist');
    }
  }, [isUserLoading, user, router]);

  // 1. Fetch watchlist IDs+Types from Supabase
  const { data: watchlistItems, isLoading: isLoadingWatchlist, error: watchlistError } = useQuery<WatchlistRow[]>({
    queryKey: ['watchlist', user?.id],
    queryFn: () => fetchWatchlistContent(user!.id),
    enabled: !!user,
  });

  // 2. Fetch details from TMDB based on watchlistItems
  const { data: fetchedDetails, isLoading: isLoadingDetails, error: detailsError } = useQuery<FetchedDetail[]>({
    queryKey: ['watchlistDetails', watchlistItems?.map(item => `${item.media_type}-${item.tmdb_id}`).join(',') || ''],
    queryFn: async () => {
      if (!watchlistItems || watchlistItems.length === 0) return [];
      
      const mediaToFetch = watchlistItems.map(item => ({ 
        id: item.tmdb_id,
        media_type: item.media_type as MediaType 
      }));

      return fetchMediaDetailsBatch(mediaToFetch);
    },
    enabled: !!watchlistItems && watchlistItems.length > 0,
  });

  // Combined loading and error states
  const isLoading = isUserLoading || isLoadingWatchlist || isLoadingDetails;
  const error = userError || watchlistError || detailsError;

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6"><Skeleton className="h-8 w-48" /></h1>
        {/* Render explicit skeletons */}
         <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
           {Array.from({ length: 12 }).map((_, index) => (
             <Skeleton key={index} className="aspect-[2/3] w-full rounded-md" />
           ))}
         </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-red-500">Error Loading Watchlist</h1>
         <Alert variant="destructive">
          <AlertTitle>Failed to load data</AlertTitle>
          <AlertDescription>
            There was a problem retrieving your watchlist. Please try again later.
            {error instanceof Error && <p className="mt-2 text-sm">Details: {error.message}</p>}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Handle case where user is loaded but not authenticated
  if (!user) {
    return null; 
  }
  
  // 3. Map data for rendering only if both queries succeeded
  const mediaItems: MediaItem[] = (watchlistItems && fetchedDetails) ? 
    watchlistItems.map(item => {
      const detail = fetchedDetails.find(d => d.id === item.tmdb_id);
      
      // Default to 'Unknown Title' which satisfies string | undefined
      let title: string | undefined = 'Unknown Title'; 
      let release_date: string | undefined = undefined;
      let determined_media_type: MediaType | undefined = undefined;
      
      if (detail) {
          if ('title' in detail && 'release_date' in detail) { 
            determined_media_type = 'movie';
            title = detail.title; // title is string
            release_date = detail.release_date;
          } else if ('name' in detail && 'first_air_date' in detail) { 
            determined_media_type = 'tv';
            title = detail.name; // name is string
            release_date = detail.first_air_date;
          } else if ('name' in detail && 'known_for_department' in detail) { 
             determined_media_type = 'person';
             title = detail.name; // name is string
          }
      } else {
          determined_media_type = item.media_type as MediaType;
      }
      
      if (determined_media_type === 'person') {
          return null; 
      }

      return {
        id: item.tmdb_id,
        title: title, // Already string | undefined compatible
        poster_path: (detail && 'poster_path' in detail) ? detail.poster_path : null,
        release_date: release_date,
        vote_average: (detail && 'vote_average' in detail) ? detail.vote_average : undefined,
        media_type: determined_media_type || 'movie', 
      };
      // Use standard filter which correctly infers the resulting type
    }).filter(item => item !== null) as MediaItem[]
    : []; 

  // Empty State (checked after mapping)
  if (mediaItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
        <div className="text-center py-16 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
          <p className="text-xl text-gray-400">Your watchlist is empty.</p>
          <p className="text-gray-500 mt-2">Add some movies or TV shows to start planning!</p>
        </div>
      </div>
    );
  }

  // --- Render Watchlist --- 
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
      <MediaGrid items={mediaItems} />
    </div>
  );
} 