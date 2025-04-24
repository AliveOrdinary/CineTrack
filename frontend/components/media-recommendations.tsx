import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/services/tmdb';
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { FilmIcon, TvIcon } from 'lucide-react';

// Basic type for a recommended/similar item
interface RecommendedItem {
  id: number;
  title?: string; // For movies
  name?: string; // For TV shows
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  media_type: 'movie' | 'tv'; // Need to know the type for the link
}

interface MediaRecommendationsProps {
  title: string;
  items: RecommendedItem[] | undefined | null;
}

export default function MediaRecommendations({ title, items }: MediaRecommendationsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      {/* Basic horizontal scroll container */}
      <div className="flex space-x-4 overflow-x-auto pb-4 -mb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {items.map((item) => {
          const itemTitle = item.title || item.name;
          const linkHref = `/${item.media_type}/${item.id}`;
          
          return (
            <Card 
              key={item.id} 
              className="group block shrink-0 w-36 sm:w-40 md:w-44 overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-lg bg-gray-900"
            >
              <Link 
                href={linkHref} 
                className="contents"
              >
                <AspectRatio ratio={2 / 3} className="bg-gray-800">
                  {item.poster_path ? (
                    <Image
                      src={getImageUrl(item.poster_path, 'w500')}
                      alt={itemTitle ?? 'Poster'}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 144px, (max-width: 768px) 160px, 176px"
                    />
                  ) : (
                     <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                       {item.media_type === 'movie' ? <FilmIcon className="h-10 w-10" /> : <TvIcon className="h-10 w-10" />} 
                     </div>
                  )}
                </AspectRatio>
                <CardContent className="p-2">
                  <h3 className="font-semibold truncate text-xs sm:text-sm group-hover:text-blue-400 transition-colors">
                    {itemTitle}
                  </h3>
                  {/* Optional: Add rating or year here if needed */}
                </CardContent>
              </Link>
            </Card>
          );
        })}
         {/* Optional: Add padding/spacer at the end for better scroll feel */}
         <div className="shrink-0 w-1"></div>
      </div>
    </div>
  );
}

// Note: Needs tailwindcss-scrollbar plugin installed and configured
// in tailwind.config.js: require('tailwindcss-scrollbar'), 