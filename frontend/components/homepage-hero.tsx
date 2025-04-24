'use client'; // Needed for state and effects

import { useState, useEffect, useRef } from 'react'; // Added useRef
import Image from 'next/image';
import Link from 'next/link';
import Autoplay from "embla-carousel-autoplay"; // Import autoplay plugin
import TMDBService from '@/services/tmdb';
import { SearchResult } from '@/types/tmdb';
import SearchBar from './search-bar';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton'; // Import Skeleton
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"; // Import Shadcn Carousel components

const MAX_HERO_ITEMS = 5; // Max items to fetch for the carousel

function HomepageHero() {
  const [featuredItems, setFeaturedItems] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref for the Autoplay plugin
  const plugin = useRef(
    Autoplay({ delay: 7000, stopOnInteraction: true }) // 7-second delay, stops on interaction
  );

  // Fetch trending items on mount
  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const trending = await TMDBService.getTrending('all', 'day');
        const itemsWithBackdrops = trending.results.filter(item => 
          (item.media_type === 'movie' || item.media_type === 'tv') && 
          item.backdrop_path
        ).slice(0, MAX_HERO_ITEMS); // Get top N items with backdrops
        
        if (itemsWithBackdrops.length === 0) {
           throw new Error("No suitable trending items found with backdrops.");
        }
        setFeaturedItems(itemsWithBackdrops);

      } catch (err) {
        console.error("Error fetching trending items for hero:", err);
        setError(err instanceof Error ? err.message : "Could not load featured content.");
        setFeaturedItems([]); // Clear items on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Loading State --- 
  if (isLoading) {
    return (
      <div className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center text-white mb-8 bg-gray-800 animate-pulse">
         {/* Skeleton for content */}
         <div className="relative z-10 container mx-auto px-4 text-center max-w-3xl space-y-4">
           <Skeleton className="h-12 w-3/4 mx-auto bg-gray-700" />
           <Skeleton className="h-6 w-full mx-auto bg-gray-700" />
           <Skeleton className="h-6 w-5/6 mx-auto bg-gray-700" />
           <Skeleton className="h-12 w-full max-w-xl mx-auto bg-gray-700" />
           <Skeleton className="h-12 w-32 mx-auto bg-gray-700" />
         </div>
      </div>
    );
  }

  // Error Display (outside carousel if fetch failed)
  if (error && featuredItems.length === 0) {
     return (
       <div className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center text-white mb-8 bg-red-900/30">
         <div className="relative z-10 container mx-auto px-4 text-center max-w-3xl">
            <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-md">
              <p className="text-red-300 text-sm">Error loading featured content: {error}</p>
           </div>
         </div>
       </div>
     );
  }

  // Render Carousel if items exist
  return (
    <Carousel
      plugins={[plugin.current]} // Add autoplay plugin
      className="w-full relative mb-8" // Carousel takes full width
      onMouseEnter={plugin.current.stop} // Pause on hover
      onMouseLeave={plugin.current.reset} // Resume on leave
      opts={{
        loop: true, // Enable looping
      }}
    >
      <CarouselContent>
        {featuredItems.map((item, index) => {
          const backdropUrl = item.backdrop_path 
            ? TMDBService.getImageUrl(item.backdrop_path, 'original') 
            : null;
          const itemUrl = `/${item.media_type}/${item.id}`;
          const title = item.title || item.name || 'Welcome to CineTrack';
          const overview = item.overview || 'Discover and track your favorite movies and TV shows.';

          return (
            <CarouselItem key={index}>
              <div className={cn(
                "relative h-[60vh] min-h-[400px] w-full flex items-center justify-center text-white",
                !backdropUrl && "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" // Fallback background
              )}>
                {/* Background Image */}
                {backdropUrl && (
                  <Image
                    src={backdropUrl}
                    alt={`Backdrop for ${title}`}
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'center top' }}
                    priority={index === 0}
                    className="opacity-30"
                  />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-transparent to-transparent opacity-50"></div>

                {/* Content */}
                <div className="relative z-10 container mx-auto px-4 text-center max-w-3xl">
                   <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">{title}</h1>
                   <p className="text-lg md:text-xl text-gray-200 mb-8 line-clamp-3 drop-shadow">
                     {overview}
                   </p>

                   {/* Action Button */}
                   <Link href={itemUrl} passHref>
                     <Button size="lg" variant="outline" className="bg-black/30 backdrop-blur-sm hover:bg-white/20">
                       View Details
                     </Button>
                   </Link>

                   {/* Search Bar (always visible) */}
                   <div className="max-w-xl mx-auto mt-8">
                     <SearchBar />
                   </div>

                 </div>
               </div>
             </CarouselItem>
           );
         })}
       </CarouselContent>
       {/* Only show controls if more than one item */}
       {featuredItems.length > 1 && (
         <>
           <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:inline-flex" />
           <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:inline-flex" />
         </>
       )}
     </Carousel>
  );
}

export default HomepageHero; 