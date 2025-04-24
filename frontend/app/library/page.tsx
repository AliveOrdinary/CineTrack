'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useUser from '@/hooks/useUser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getMovieDetails, getTvDetails } from '@/services/tmdb'; // Import TMDB service
import MediaGrid from '@/components/media-grid'; // Import MediaGrid
import { Database } from '@cinetrack/shared'; // Import Database directly

// Extend the MediaItem interface to include watched details
interface MediaItem {
  id: number; // TMDB ID
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  media_type?: 'movie' | 'tv';
  // Watched specific details (optional)
  watched_date?: string | null; // Store as ISO string or formatted string
  user_rating?: number | null;
}

// Define the specific type returned by our watched_content query
type FetchedWatchedItem = Pick<
  Database['public']['Tables']['watched_content']['Row'], 
  'id' | 'tmdb_id' | 'media_type' | 'watched_date' | 'user_rating'
>;

export default function LibraryPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []); // Memoize Supabase client
  
  const [activeTab, setActiveTab] = useState('watchlist');
  const [watchlistItems, setWatchlistItems] = useState<MediaItem[]>([]);
  const [watchedItems, setWatchedItems] = useState<MediaItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true); // Start loading true
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in after loading
  useEffect(() => {
    if (!isUserLoading && !user) {
      console.log('Library page: No user found after loading, redirecting to login');
      router.push('/login?redirect=/library');
    }
  }, [isUserLoading, user, router]);

  // Data fetching logic
  useEffect(() => {
    if (user && !isUserLoading) {
      const fetchData = async () => {
        setIsLoadingData(true);
        setError(null);
        setWatchlistItems([]); // Clear previous items
        setWatchedItems([]);
        
        try {
          // Fetch Watchlist IDs
          const { data: watchlistData, error: watchlistError } = await supabase
            .from('watchlist_content')
            .select('id, tmdb_id, media_type')
            .eq('user_id', user.id)
            .order('added_date', { ascending: false });

          if (watchlistError) throw watchlistError;

          // Fetch Watched Content (using the specific type)
          const { data: watchedData, error: watchedError } = await supabase
            .from('watched_content')
            .select('id, tmdb_id, media_type, watched_date, user_rating')
            .eq('user_id', user.id)
            .order('watched_date', { ascending: false, nullsFirst: false })
            .returns<FetchedWatchedItem[]>(); // Specify the return type
            
          if (watchedError) throw watchedError;

          // Function to fetch TMDB details and format as MediaItem
          const fetchTmdbDetails = async (tmdbId: number, mediaType: string): Promise<Partial<MediaItem> | null> => {
             try {
                const details: any = mediaType === 'movie'
                  ? await getMovieDetails(tmdbId)
                  : await getTvDetails(tmdbId);
                
                return {
                    id: tmdbId,
                    media_type: mediaType as 'movie' | 'tv',
                    title: mediaType === 'movie' ? details?.title : undefined,
                    name: mediaType === 'tv' ? details?.name : undefined,
                    poster_path: details?.poster_path || null,
                    release_date: mediaType === 'movie' ? details?.release_date : undefined,
                    first_air_date: mediaType === 'tv' ? details?.first_air_date : undefined,
                    vote_average: details?.vote_average
                };
             } catch (fetchError) {
                console.error(`Error fetching TMDB details for ${mediaType} ${tmdbId}:`, fetchError);
                return null; // Return null if fetching details fails
             }
          };

          // Process watchlist items
          const watchlistPromises = watchlistData.map(async (item) => {
            const tmdbDetails = await fetchTmdbDetails(item.tmdb_id, item.media_type);
            return tmdbDetails ? { ...tmdbDetails } as MediaItem : null;
          });
          const watchlistResults = await Promise.all(watchlistPromises);
          setWatchlistItems(watchlistResults.filter((item): item is MediaItem => item !== null));

          // Process watched items (using FetchedWatchedItem type)
          const watchedPromises = watchedData.map(async (item: FetchedWatchedItem) => { // Use specific type here
             const tmdbDetails = await fetchTmdbDetails(item.tmdb_id, item.media_type);
             if (!tmdbDetails) return null;
             // Combine TMDB details with watched details from Supabase
             return { 
                ...tmdbDetails, 
                watched_date: item.watched_date, // Keep original string or Date object
                user_rating: item.user_rating 
             } as MediaItem;
          });
          const watchedResults = await Promise.all(watchedPromises);
          setWatchedItems(watchedResults.filter((item): item is MediaItem => item !== null));

        } catch (err: any) {
          console.error("Error fetching library data:", err);
          setError(err.message || "Failed to load library data.");
        } finally {
          setIsLoadingData(false);
        }
      };
      
      fetchData();
    }
    if (!isUserLoading && !user) {
        setIsLoadingData(false);
    }
  }, [user, isUserLoading, supabase]); 

  // Loading state for user session
  if (isUserLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
          <div className="flex space-x-4 border-b border-gray-800 mb-6">
            <div className="h-10 bg-gray-800 rounded w-24"></div>
            <div className="h-10 bg-gray-800 rounded w-24"></div>
          </div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Library</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="watched">Watched History</TabsTrigger>
        </TabsList>

        {error && (
          <div className="p-4 mb-4 rounded text-sm bg-red-900 border border-red-700 text-red-200">
            Error: {error}
          </div>
        )}

        <TabsContent value="watchlist" className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800">
          {isLoadingData ? (
            <p>Loading watchlist...</p>
          ) : watchlistItems.length > 0 ? (
            <MediaGrid items={watchlistItems} />
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p>Your watchlist is empty.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/')}>
                <PlusIcon className="mr-2 h-4 w-4" /> Discover Movies & Shows
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="watched" className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-800">
          {isLoadingData ? (
            <p>Loading watched history...</p>
          ) : watchedItems.length > 0 ? (
            <MediaGrid items={watchedItems} /> // MediaGrid will now receive items with watched_date/user_rating
          ) : (
             <div className="text-center py-10 text-gray-500">
               <p>You haven't marked anything as watched yet.</p>
             </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 