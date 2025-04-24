import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/services/tmdb'; // Assuming TMDBService exports this
import WatchlistButton from '@/components/watchlist-button'; // Assuming WatchlistButton path
import WatchedButton from '@/components/watched-button'; // Import WatchedButton
import { MovieDetails, TVDetails, Genre } from '@/types/tmdb'; // Import specific types
import { Button } from '@/components/ui/button';
import { PlayIcon, Star } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Helper function to format runtime (moved here or keep in utils)
const formatRuntime = (minutes: number | undefined): string => {
  if (!minutes || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

// Define a type for the video result (can be refined further if needed)
interface VideoResult {
  type: string;
  site: string;
  key: string;
}

interface MediaHeroProps {
  item: MovieDetails | TVDetails; // Use union type
  mediaType: 'movie' | 'tv';
}

export default function MediaHero({ item, mediaType }: MediaHeroProps) {
  // Use type guards or checks based on mediaType for specific properties
  const title = mediaType === 'movie' ? (item as MovieDetails).title : (item as TVDetails).name;
  const releaseDateStr = mediaType === 'movie' ? (item as MovieDetails).release_date : (item as TVDetails).first_air_date;
  // Handle runtime differently: movie has number | null, tv has number[]
  const runtimeMinutes = mediaType === 'movie' 
    ? (item as MovieDetails).runtime 
    : (item as TVDetails).episode_run_time?.[0]; 

  const year = releaseDateStr?.substring(0, 4);
  const tagline = item.tagline; // Common property
  const overview = item.overview; // Common property
  const genres = item.genres as Genre[]; // Common property, cast to Genre[]
  const voteAverage = item.vote_average; // Common property
  const backdropPath = item.backdrop_path; // Common property
  const posterPath = item.poster_path; // Common property
  
  const releaseDate = releaseDateStr 
    ? new Date(releaseDateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown release date';

  const rating = voteAverage && voteAverage > 0 ? (Math.round(voteAverage * 10) / 10).toFixed(1) : null;

  // Explicitly check for videos property (needs to be added to TMDB types or fetched separately)
  // Using optional chaining and casting for now based on previous structure
  const videos = (item as any).videos?.results as VideoResult[] | undefined;
  const trailer = videos?.find(
    (video) => video.type === 'Trailer' && video.site === 'YouTube'
  );

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] mb-8 overflow-hidden">
      {/* Backdrop Image */}
      {backdropPath && (
         <Image
           src={getImageUrl(backdropPath, 'original')}
           alt={title ?? 'Backdrop'}
           fill
           style={{ objectFit: 'cover', objectPosition: 'center top' }}
           className="object-cover opacity-20"
           priority
         />
      )}
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-8 flex flex-col md:flex-row items-end gap-8 z-10">
        {/* Poster Image - Use AspectRatio */}
        <div className="relative w-40 h-60 md:w-48 md:h-72 lg:w-56 lg:h-[336px] shrink-0 mx-auto md:mx-0 shadow-2xl">
          {posterPath && (
            <AspectRatio ratio={2 / 3} className="overflow-hidden rounded-lg">
              <Image
                src={getImageUrl(posterPath, 'w500')}
                alt={title ?? 'Poster'}
                fill
                className="object-cover"
                priority
              />
            </AspectRatio>
          )}
        </div>
        
        {/* Details Text */}
        <div className="flex-1 text-center md:text-left">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-white [text-shadow:_0_1px_3px_rgb(0_0_0_/_0.5)]">
            {title} {year && <span className="text-gray-400 font-normal [text-shadow:_0_1px_3px_rgb(0_0_0_/_0.5)]">({year})</span>}
          </h1>
          
          {/* Metadata: Genres, Rating, Release Date, Runtime */}
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-2 gap-y-1 text-sm md:text-base text-gray-100 mb-4 [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.6)]">
            {genres?.slice(0, 3).map((genre) => ( 
              <Link 
                href={`/search?type=${mediaType}&genre=${genre.id}`}
                key={genre.id} 
              >
                 <Badge variant="outline" className="hover:bg-gray-800 transition-colors">
                   {genre.name}
                 </Badge>
              </Link>
            ))}

            {genres && genres.length > 0 && rating && (
               <Separator orientation="vertical" className="h-4 bg-gray-600 mx-1 hidden md:inline-block" />
            )}
            
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> 
                <span>{rating}</span>
              </div>
            )}

            {(genres?.length > 0 || rating) && releaseDate !== 'Unknown release date' && (
               <Separator orientation="vertical" className="h-4 bg-gray-600 mx-1 hidden md:inline-block" />
            )}

            {releaseDate !== 'Unknown release date' && <span>{releaseDate}</span>}

            {releaseDate !== 'Unknown release date' && runtimeMinutes && (
              <Separator orientation="vertical" className="h-4 bg-gray-600 mx-1 hidden md:inline-block" />
            )}

            {runtimeMinutes && <span>{formatRuntime(runtimeMinutes)}</span>}
          </div>
          
          {/* Tagline */}
          {tagline && (
            <p className="text-lg italic text-gray-200 mb-4 [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.6)]">{tagline}</p>
          )}
          
          {/* Overview */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 sr-only">Overview</h2> {/* Screen reader only */}
            <p className="text-gray-100 line-clamp-3 [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.6)]">{overview || 'No overview available.'}</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            {item?.id && mediaType && (
              <>
                {/* Add Watched Button here */}
                <WatchedButton 
                  tmdbId={item.id}
                  mediaType={mediaType}
                />
                <WatchlistButton 
                  tmdbId={item.id} 
                  mediaType={mediaType} 
                  title={title} 
                  // Keep watchlist button styling distinct or make them consistent
                  // className="bg-blue-600 hover:bg-blue-700 text-white" 
                />
              </>
            )}
            
            {trailer && (
              <Button asChild variant="outline">
                <Link
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PlayIcon className="mr-2 h-4 w-4" /> Watch Trailer
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 