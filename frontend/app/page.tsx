import { Suspense } from 'react';
import MediaGrid from '@/components/media-grid';
import { MediaItem } from '@/components/media-grid';
import TMDBService, { FetchedDetail, FetchedMovieDetail, FetchedTVDetail } from '@/services/tmdb';
import { SearchResult, MultiSearchResult, MovieDetails, TVDetails } from '@/types/tmdb';
import AuthPrompt from '@/components/auth-prompt';
import HomepageHero from '@/components/homepage-hero';

// Helper to map FetchedDetail or SearchResult to MediaItem, filtering persons
const mapToMediaItem = (item: FetchedDetail | SearchResult): MediaItem | null => {
  if (!item || !('id' in item)) return null; 

  let media_type: 'movie' | 'tv' | undefined;
  let title: string | undefined;
  let release_date: string | undefined;
  let poster_path: string | null | undefined;
  let vote_average: number | undefined;

  // Determine the media type definitively
  if ('media_type' in item && (item.media_type === 'movie' || item.media_type === 'tv')) {
    media_type = item.media_type;
  } else if ('title' in item && 'release_date' in item && !('name' in item)) {
    media_type = 'movie'; // Infer as movie if title/release_date exist but name doesn't
  } else if ('name' in item && 'first_air_date' in item && !('title' in item)) {
    media_type = 'tv'; // Infer as TV if name/first_air_date exist but title doesn't
  } else {
    // If it has both title and name, or neither, or is a person, filter out
    // console.warn("Could not determine media type for item:", item);
    return null;
  }
  
  // Now that media_type is set, access properties based on it
  if (media_type === 'movie') {
    // Access movie properties (title, release_date)
    // We know these *should* exist based on the checks above or the source type
    title = (item as any).title;
    release_date = (item as any).release_date;
  } else { // media_type === 'tv'
    // Access TV properties (name, first_air_date)
    title = (item as any).name;
    release_date = (item as any).first_air_date;
  }

  // Access common properties
  poster_path = item.poster_path;
  vote_average = item.vote_average;

  // Final check for essential data before returning
  if (!title || !item.id) {
    console.warn("mapToMediaItem: Missing title or ID after processing", item);
    return null;
  }

  return {
      id: item.id,
      title: title,
      poster_path: poster_path !== undefined ? poster_path : null,
      release_date: release_date,
      vote_average: vote_average,
      media_type: media_type, // Return the determined media_type
  };
};

// --- Async Components for Sections ---

async function TrendingSection() {
  const data: MultiSearchResult = await TMDBService.getTrending('all', 'day');
  const items = data.results?.map(mapToMediaItem).filter((item): item is MediaItem => item !== null) || [];
  return <MediaGrid items={items} title="Trending Today" />;
}

async function TrendingMovies() {
  const data: MultiSearchResult = await TMDBService.getTrending('movie', 'week');
  // Apply mapping and filtering
  const items = data.results?.map(mapToMediaItem).filter((item): item is MediaItem => item !== null).slice(0, 12) || [];
  return <MediaGrid items={items} title="Trending Movies" />;
}

async function TrendingTVShows() {
  const data: MultiSearchResult = await TMDBService.getTrending('tv', 'week');
  // Apply mapping and filtering
  const items = data.results?.map(mapToMediaItem).filter((item): item is MediaItem => item !== null).slice(0, 12) || [];
  return <MediaGrid items={items} title="Trending TV Shows" />;
}

async function PopularMovies() {
  const data: MultiSearchResult = await TMDBService.getPopularMovies();
  const items = data.results?.map(mapToMediaItem).filter((item): item is MediaItem => item !== null) || [];
  return <MediaGrid items={items} title="Popular Movies" />;
}

async function NowPlayingMovies() {
  const data: MultiSearchResult = await TMDBService.getNowPlayingMovies();
  const items = data.results?.map(mapToMediaItem).filter((item): item is MediaItem => item !== null) || [];
  return <MediaGrid items={items.slice(0,12)} title="Now Playing" />;
}

async function PopularTV() {
  const data: MultiSearchResult = await TMDBService.getPopularTvShows();
  const items = data.results?.map(mapToMediaItem).filter((item): item is MediaItem => item !== null) || [];
  return <MediaGrid items={items} title="Popular TV Shows" />;
}

// --- Main Page Component --- 
export default async function HomePage() {
  // Fetching for Trending Today is now handled by TrendingSection component
  // Keep error handling structure in case top-level fetch is needed later
  let fetchError: string | null = null; 

  return (
    <main>
      <Suspense fallback={<div className="h-[60vh] min-h-[400px] w-full bg-gray-800 animate-pulse"></div>}>
        <HomepageHero />
      </Suspense>

      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={null}> 
          <AuthPrompt /> 
        </Suspense>
        
        <div className="space-y-8">
          <Suspense fallback={<div className="h-40 flex items-center justify-center rounded bg-gray-800/50"><p className='text-gray-400'>Loading trending items...</p></div>}>
            <TrendingSection />
          </Suspense>

          <Suspense fallback={<div className="h-40 flex items-center justify-center rounded bg-gray-800/50"><p className='text-gray-400'>Loading now playing movies...</p></div>}>
            <NowPlayingMovies />
          </Suspense>
          
          <Suspense fallback={<div className="h-40 flex items-center justify-center rounded bg-gray-800/50"><p className='text-gray-400'>Loading popular movies...</p></div>}>
            <PopularMovies />
          </Suspense>
          
          <Suspense fallback={<div className="h-40 flex items-center justify-center rounded bg-gray-800/50"><p className='text-gray-400'>Loading popular TV shows...</p></div>}>
            <PopularTV />
          </Suspense>
        </div>
      </div>
    </main>
  );
} 