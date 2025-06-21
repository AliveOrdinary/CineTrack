import Link from 'next/link';
import { TmdbMedia } from '@/lib/tmdb/types';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface MediaCardProps {
  media: TmdbMedia;
  showMediaType?: boolean;
}

export default function MediaCard({ media, showMediaType = false }: MediaCardProps) {
  const title = media.title || media.name || 'Unknown Title';
  const releaseDate = media.release_date || media.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  // Determine the media type for routing
  const mediaType = media.media_type || (media.title ? 'movie' : 'tv');
  const href = `/${mediaType}/${media.id}`;

  // TMDB image URL construction
  const posterUrl = media.poster_path
    ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
    : null;

  // Create accessible description
  const mediaTypeLabel =
    mediaType === 'movie' ? 'Movie' : mediaType === 'tv' ? 'TV Show' : 'Person';
  const ratingText =
    media.vote_average && media.vote_average > 0
      ? `, rated ${media.vote_average.toFixed(1)} out of 10`
      : '';
  const yearText = year ? `, released in ${year}` : '';
  const ariaLabel = `${title}${yearText}${ratingText}. ${mediaTypeLabel}.`;

  return (
    <article className="group">
      <Link
        href={href}
        className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg touch-manipulation"
        aria-label={ariaLabel}
      >
        <div className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow active:scale-95 transition-transform">
          <div className="relative aspect-[2/3] bg-muted">
            {posterUrl ? (
              <OptimizedImage
                src={posterUrl}
                alt={`${title} poster`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                placeholder="blur"
                quality={80}
              />
            ) : (
              <div
                className="w-full h-full bg-muted flex items-center justify-center"
                role="img"
                aria-label={`No poster available for ${title}`}
              >
                <div className="text-center p-3 md:p-4">
                  <div className="text-3xl md:text-4xl mb-2" aria-hidden="true">
                    🎬
                  </div>
                  <div className="text-xs text-muted-foreground">No Image</div>
                </div>
              </div>
            )}
            {media.vote_average && media.vote_average > 0 && (
              <div
                className="absolute top-1.5 md:top-2 right-1.5 md:right-2 bg-black/80 text-white text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full"
                aria-label={`Rating: ${media.vote_average.toFixed(1)} out of 10`}
              >
                <span aria-hidden="true">⭐ {media.vote_average.toFixed(1)}</span>
              </div>
            )}
            {showMediaType && (
              <div
                className="absolute top-1.5 md:top-2 left-1.5 md:left-2 bg-primary text-primary-foreground text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full capitalize"
                aria-label={`Media type: ${mediaTypeLabel}`}
              >
                <span aria-hidden="true">{mediaType}</span>
              </div>
            )}
          </div>

          <div className="p-2.5 md:p-3">
            <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            {year && (
              <p className="text-xs text-muted-foreground" aria-label={`Released in ${year}`}>
                <time dateTime={year.toString()}>{year}</time>
              </p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
