import { Suspense } from "react";
import Hero from "@/components/hero";
import MediaSection from "@/components/features/content/MediaSection";
import MediaSectionSkeleton from "@/components/features/content/MediaSectionSkeleton";
import { ActivityFeedPreview } from "@/components/features/social/ActivityFeedPreview";
import { getTrending, getNowPlayingMovies, getUpcomingMovies, discoverMedia } from "@/lib/tmdb/client";

async function TrendingSection() {
  try {
    const trending = await getTrending('all', 'week');
    return (
      <MediaSection 
        title="Trending This Week" 
        items={trending.results} 
        showMediaType={true}
      />
    );
  } catch (error) {
    console.error('Failed to fetch trending content:', error);
    return (
      <div className="text-center text-muted-foreground py-8">
        Failed to load trending content. Please try again later.
      </div>
    );
  }
}

async function NowPlayingSection() {
  try {
    const nowPlaying = await getNowPlayingMovies();
    return (
      <MediaSection 
        title="Now Playing in Theaters" 
        items={nowPlaying.results} 
      />
    );
  } catch (error) {
    console.error('Failed to fetch now playing movies:', error);
    return (
      <div className="text-center text-muted-foreground py-8">
        Failed to load now playing movies. Please try again later.
      </div>
    );
  }
}

async function PopularTVSection() {
  try {
    const popularTV = await discoverMedia('tv', { 
      sort_by: 'popularity.desc',
      page: 1 
    });
    return (
      <MediaSection 
        title="Popular TV Shows" 
        items={popularTV.results} 
      />
    );
  } catch (error) {
    console.error('Failed to fetch popular TV shows:', error);
    return (
      <div className="text-center text-muted-foreground py-8">
        Failed to load popular TV shows. Please try again later.
      </div>
    );
  }
}

async function UpcomingSection() {
  try {
    const upcoming = await getUpcomingMovies();
    return (
      <MediaSection 
        title="Coming Soon" 
        items={upcoming.results} 
      />
    );
  } catch (error) {
    console.error('Failed to fetch upcoming movies:', error);
    return (
      <div className="text-center text-muted-foreground py-8">
        Failed to load upcoming movies. Please try again later.
      </div>
    );
  }
}

export default function HomePage() {
  return (
    <div className="w-full min-h-0">
      {/* Hero Section */}
      <div className="w-full max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <Hero />
      </div>

      {/* Content Sections */}
      <div className="w-full max-w-7xl mx-auto px-3 md:px-4 space-y-8 md:space-y-12 pb-8 md:pb-12">
        {/* Activity Feed Preview for authenticated users */}
        <ActivityFeedPreview />
        
        <Suspense fallback={<MediaSectionSkeleton />}>
          <TrendingSection />
        </Suspense>

        <Suspense fallback={<MediaSectionSkeleton />}>
          <NowPlayingSection />
        </Suspense>

        <Suspense fallback={<MediaSectionSkeleton />}>
          <PopularTVSection />
        </Suspense>

        <Suspense fallback={<MediaSectionSkeleton />}>
          <UpcomingSection />
        </Suspense>
      </div>
    </div>
  );
}
