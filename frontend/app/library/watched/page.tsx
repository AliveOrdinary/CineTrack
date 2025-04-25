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
import { Database } from '@cinetrack/shared/types/supabase';
import { MediaType, MovieDetails, TVDetails, PersonDetails } from '@/types/tmdb';
import { MediaItem } from '@/components/media-grid';

// Type alias for Supabase watched content row
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type WatchedRow = Tables<"watched_content">;
// Type alias for the detailed items returned by the batch fetch
type FetchedDetail = MovieDetails | TVDetails | PersonDetails;

// Fetch watched content IDs and types from Supabase
const fetchWatchedContent = async (userId: string): Promise<WatchedRow[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('watched_content')
    // Select necessary fields + user rating and watched date
    .select('id, tmdb_id, media_type, watched_date, user_rating') 
    .eq('user_id', userId)
    .order('watched_date', { ascending: false }); // Order by most recently watched

  if (error) {
    console.error("Error fetching watched content:", error);
    throw new Error(error.message);
  }
  return (data || []) as WatchedRow[];
};

export default function WatchedPage() {
  const { user, isLoading: isUserLoading, error: userError } = useUser();
  const router = useRouter();

  // Redirect logic
  useEffect(() => {
    if (!isUserLoading && !user) {
      console.log('Watched page: No user found, redirecting to login');
      router.push('/login?redirect=/library/watched');
    }
  }, [isUserLoading, user, router]);

  // 1. Fetch watched content from Supabase
  const { data: watchedItems, isLoading: isLoadingWatched, error: watchedError } = useQuery<WatchedRow[]>({ 
    queryKey: ['watched', user?.id],
    queryFn: () => fetchWatchedContent(user!.id),
    enabled: !!user,
  });

  // 2. Fetch details from TMDB based on watchedItems
  const { data: fetchedDetails, isLoading: isLoadingDetails, error: detailsError } = useQuery<FetchedDetail[]>({ 
    queryKey: ['watchedDetails', watchedItems?.map(item => `${item.media_type}-${item.tmdb_id}`).join(',') || ''],
    queryFn: async () => {
      if (!watchedItems || watchedItems.length === 0) return [];
      
      const mediaToFetch = watchedItems.map(item => ({ 
        id: item.tmdb_id,
        media_type: item.media_type as MediaType 
      }));

      return fetchMediaDetailsBatch(mediaToFetch);
    },
    enabled: !!watchedItems && watchedItems.length > 0,
  });

  // Combined loading and error states
  const isLoading = isUserLoading || isLoadingWatched || isLoadingDetails;
  const error = userError || watchedError || detailsError;

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6"><Skeleton className="h-8 w-48" /></h1>
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
        <h1 className="text-3xl font-bold mb-6 text-red-500">Error Loading Watched History</h1>
         <Alert variant="destructive">
          <AlertTitle>Failed to load data</AlertTitle>
          <AlertDescription>
            There was a problem retrieving your watched history. Please try again later.
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
  
  // 3. Map data for rendering
  const mediaItems: MediaItem[] = (watchedItems && fetchedDetails) ? 
    watchedItems.map(item => {
      const detail = fetchedDetails.find(d => d.id === item.tmdb_id);
      
      let title: string | undefined = 'Unknown Title'; 
      let release_date: string | undefined = undefined;
      let determined_media_type: MediaType | undefined = undefined;
      
      if (detail) {
          if ('title' in detail && 'release_date' in detail) { 
            determined_media_type = 'movie';
            title = detail.title;
            release_date = detail.release_date;
          } else if ('name' in detail && 'first_air_date' in detail) { 
            determined_media_type = 'tv';
            title = detail.name;
            release_date = detail.first_air_date;
          } else if ('name' in detail && 'known_for_department' in detail) { 
             determined_media_type = 'person';
             title = detail.name;
          }
      } else {
          determined_media_type = item.media_type as MediaType;
      }
      
      if (determined_media_type === 'person') {
          return null; 
      }

      // TODO: Extend MediaItem and MovieCard to accept/display user_rating and watched_date
      return {
        id: item.tmdb_id,
        title: title,
        poster_path: (detail && 'poster_path' in detail) ? detail.poster_path : null,
        release_date: release_date,
        vote_average: (detail && 'vote_average' in detail) ? detail.vote_average : undefined,
        media_type: determined_media_type || 'movie',
        // Add watched specific data (currently unused by MediaItem/MovieCard)
        user_rating: item.user_rating,
        watched_date: item.watched_date,
      };
    }).filter(item => item !== null) as MediaItem[] // Cast needed after filter
    : []; 

  // Empty State 
  if (mediaItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Watched History</h1>
        <div className="text-center py-16 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
          <p className="text-xl text-gray-400">You haven't marked anything as watched yet.</p>
          <p className="text-gray-500 mt-2">Use the checkmark button on movie/show pages to add to your history.</p>
        </div>
      </div>
    );
  }

  // --- Render Watched History --- 
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Watched History</h1>
      {/* TODO: Potentially use a different grid/card component that shows rating/date */}
      <MediaGrid items={mediaItems} /> 
    </div>
  );
} 