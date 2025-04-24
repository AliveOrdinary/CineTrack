"use client";

import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '../services/tmdb';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Star, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate?: string;
  voteAverage?: number;
  mediaType: 'movie' | 'tv';
  user_rating?: number | null;
  watched_date?: string | null;
}

export default function MovieCard({
  id,
  title,
  posterPath,
  releaseDate,
  voteAverage,
  mediaType,
  user_rating,
  watched_date,
}: MovieCardProps) {
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const rating = voteAverage && voteAverage > 0 ? Math.round(voteAverage * 10) / 10 : null;
  
  const displayRating = voteAverage ? voteAverage.toFixed(1) : 'N/A';
  const displayDate = year ? String(year) : 'N/A';

  const displayWatchedDate = watched_date 
    ? new Date(watched_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  const hasUserData = user_rating !== undefined && user_rating !== null;
  const hasWatchedDate = !!displayWatchedDate;

  return (
    <Card className="relative flex flex-col overflow-hidden rounded-lg transition-all hover:scale-105">
      <Link href={`/${mediaType}/${id}`} className="contents">
        <AspectRatio ratio={2 / 3} className="overflow-hidden rounded-t-lg">
          <Image
            src={getImageUrl(posterPath, 'w500')}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />
        </AspectRatio>
      </Link>
      
      <CardFooter className="flex flex-col items-start p-3">
        <h3 className="mb-1 w-full text-base font-semibold line-clamp-1" title={title}>
          <Link href={`/${mediaType}/${id}`}>{title}</Link>
        </h3>
        
        <div className="w-full text-xs space-y-1">
          {hasUserData && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="h-3 w-3 fill-current" />
              <span>Your Rating: {user_rating}/10</span>
            </div>
          )}

          {hasWatchedDate && (
             <div className="flex items-center gap-1 text-gray-400">
               <Calendar className="w-3 h-3" />
               <span>Watched: {displayWatchedDate}</span>
             </div>
          )}

          {!hasUserData && !hasWatchedDate && (
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                {displayRating}
              </span>
              <span>{displayDate}</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 