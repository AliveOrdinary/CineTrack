"use client";

import MovieCard from './movie-card';

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  media_type?: 'movie' | 'tv';
  user_rating?: number | null;
  watched_date?: string | null;
}

interface MediaGridProps {
  items: MediaItem[];
  title?: string;
  className?: string;
}

export default function MediaGrid({ items, title, className = '' }: MediaGridProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className={`py-4 ${className}`}>
      {title && <h2 className="mb-4 text-2xl font-bold">{title}</h2>}
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => {
          // Determine if it's a movie or TV show
          const mediaType = item.media_type || (item.release_date ? 'movie' : 'tv');
          
          return (
            <MovieCard
              key={`${mediaType}-${item.id}`}
              id={item.id}
              title={item.title || item.name || 'Unknown Title'}
              posterPath={item.poster_path}
              releaseDate={item.release_date || item.first_air_date}
              voteAverage={item.vote_average}
              mediaType={mediaType}
              user_rating={item.user_rating}
              watched_date={item.watched_date}
            />
          );
        })}
      </div>
    </section>
  );
} 