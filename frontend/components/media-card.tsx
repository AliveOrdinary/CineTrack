'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/services/tmdb';
import { format } from 'date-fns';
import { StarIcon, CalendarDaysIcon } from 'lucide-react';

interface MediaCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate?: string;
  voteAverage?: number;
  mediaType: 'movie' | 'tv';
  genreIds?: number[];
  genreNames?: string[];
  watched_date?: string | null;
  user_rating?: number | null;
}

export default function MediaCard({
  id,
  title,
  posterPath,
  releaseDate,
  voteAverage,
  mediaType,
  genreNames = [],
  watched_date,
  user_rating,
}: MediaCardProps) {
  const formattedReleaseYear = releaseDate 
    ? new Date(releaseDate).getFullYear() 
    : null;

  const formattedWatchedDate = watched_date
    ? format(new Date(watched_date), 'MMM d, yyyy')
    : null;
  
  return (
    <Link 
      href={`/${mediaType}/${id}`}
      className="group bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-600 transition-all hover:shadow-lg transform hover:-translate-y-1 flex flex-col h-full"
    >
      <div className="relative aspect-[2/3] w-full">
        <Image
          src={getImageUrl(posterPath, 'w500')}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/hfwAJhAPJ8V0mDQAAAABJRU5ErkJggg=="
        />
        {!user_rating && voteAverage !== undefined && voteAverage > 0 && (
          <div className="absolute top-2 right-2 bg-blue-600 bg-opacity-90 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
            <StarIcon className="w-3 h-3" /> {Math.round(voteAverage * 10) / 10}
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="font-semibold text-base truncate group-hover:text-blue-400 transition-colors mb-1">
          {title}
        </h3>
        
        {(formattedWatchedDate || user_rating !== undefined && user_rating !== null) && (
          <div className="mb-2 pt-1 border-t border-gray-800">
            {formattedWatchedDate && (
              <div className="flex items-center gap-1 text-xs text-green-400">
                 <CalendarDaysIcon className="w-3 h-3 shrink-0" />
                 <span>Watched: {formattedWatchedDate}</span>
              </div>
            )}
            {user_rating !== undefined && user_rating !== null && (
              <div className="flex items-center gap-1 text-xs text-yellow-400 mt-1">
                 <StarIcon className="w-3 h-3 shrink-0" />
                 <span>Your Rating: {user_rating} / 10</span>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800">
           <div className="flex flex-col">
            {formattedReleaseYear && (
              <span className="text-xs text-gray-400">
                {formattedReleaseYear}
              </span>
            )}
             {genreNames && genreNames.length > 0 && (
               <span className="text-xs text-gray-500 truncate max-w-[150px]">
                 {genreNames.slice(0, 2).join(', ')}
               </span>
             )}
          </div>
          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded capitalize">
            {mediaType}
          </span>
        </div>
      </div>
    </Link>
  );
} 