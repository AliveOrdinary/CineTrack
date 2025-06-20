import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getTvShowDetails, getTvShowWatchProviders, getTvShowVideos } from '@/lib/tmdb/client';
import { TmdbTvDetails, TmdbGenre, TmdbVideo } from '@/lib/tmdb/types';
import MediaSection from '@/components/features/content/MediaSection';
import MediaSectionSkeleton from '@/components/features/content/MediaSectionSkeleton';
import { YoutubeEmbed } from '@/components/features/content/YoutubeEmbed';
import { WatchProviders } from '@/components/features/content/WatchProviders';
import { WatchedContentButton } from '@/components/features/tracking/WatchedContentButton';
import { WatchlistButton } from '@/components/features/tracking/WatchlistButton';
import { AddToListButton } from '@/components/features/lists/AddToListButton';
import { ReviewButton } from '@/components/features/reviews/ReviewButton';
import { ReviewsSection } from '@/components/features/reviews/ReviewsSection';
import { TvShowProgress } from '@/components/features/tracking/TvShowProgress';
import { DetailedRatingForm } from '@/components/features/ratings/DetailedRatingForm';
import { DetailedRatingDisplay } from '@/components/features/ratings/DetailedRatingDisplay';
import { RecommendationForm } from '@/components/features/recommendations/RecommendationForm';
import { getRecommendableUsers } from '@/lib/supabase/users';

interface TvPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function TvShowDetails({ id }: { id: string }) {
  try {
    const tvShow = await getTvShowDetails(parseInt(id));

    if (!tvShow) {
      notFound();
    }

    // Fetch videos, watch providers, and recommendable users
    const [videos, providers, recommendableUsers] = await Promise.allSettled([
      getTvShowVideos(parseInt(id)),
      getTvShowWatchProviders(parseInt(id)),
      getRecommendableUsers()
    ]);

    const tvVideos = videos.status === 'fulfilled' ? videos.value : null;
    const providersValue = providers.status === 'fulfilled' ? providers.value : null;
    const users = recommendableUsers.status === 'fulfilled' ? recommendableUsers.value : [];

    // Find main trailer
    const trailer =
      tvVideos?.results?.find(
        (video: TmdbVideo) => video.type === 'Trailer' && video.site === 'YouTube'
      ) || tvVideos?.results?.[0];

    const backdropUrl = tvShow.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}`
      : null;

    const posterUrl = tvShow.poster_path
      ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
      : null;

    return (
      <div className="w-full">
        {/* Hero Section with Backdrop */}
        {backdropUrl && (
          <div className="relative h-[50vh] w-full">
            <Image src={backdropUrl} alt={tvShow.name} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Poster and Actions */}
            <div className="lg:col-span-1">
              {posterUrl && (
                <div className="aspect-[2/3] w-full max-w-sm mx-auto lg:mx-0 relative mb-6">
                  <Image
                    src={posterUrl}
                    alt={tvShow.name}
                    fill
                    className="object-cover rounded-lg shadow-lg"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <WatchedContentButton tmdbId={parseInt(id)} mediaType="tv" title={tvShow.name} />

                <WatchlistButton tmdbId={parseInt(id)} mediaType="tv" title={tvShow.name} />

                <AddToListButton tmdbId={parseInt(id)} mediaType="tv" title={tvShow.name} />

                <ReviewButton tmdbId={parseInt(id)} mediaType="tv" title={tvShow.name} />

                <DetailedRatingForm tmdbId={parseInt(id)} mediaType="tv" title={tvShow.name} />

                <RecommendationForm 
                  tmdbId={parseInt(id)} 
                  mediaType="tv" 
                  title={tvShow.name}
                  users={users}
                />
              </div>

              {/* Show Stats */}
              <div className="mt-6 p-4 bg-card rounded-lg border">
                <h3 className="font-semibold mb-3">Show Info</h3>
                <div className="space-y-2 text-sm">
                  {tvShow.number_of_seasons && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seasons:</span>
                      <span>{tvShow.number_of_seasons}</span>
                    </div>
                  )}
                  {tvShow.number_of_episodes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Episodes:</span>
                      <span>{tvShow.number_of_episodes}</span>
                    </div>
                  )}
                  {tvShow.episode_run_time && tvShow.episode_run_time.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Runtime:</span>
                      <span>{tvShow.episode_run_time[0]} min</span>
                    </div>
                  )}
                  {tvShow.first_air_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">First Air Date:</span>
                      <span>{new Date(tvShow.first_air_date).getFullYear()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TV Show Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{tvShow.name}</h1>
                {tvShow.first_air_date && (
                  <p className="text-xl text-muted-foreground mb-4">
                    {new Date(tvShow.first_air_date).getFullYear()}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 mb-6">
                  {tvShow.vote_average && tvShow.vote_average > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold">{tvShow.vote_average.toFixed(1)}</span>
                      <span className="text-muted-foreground">({tvShow.vote_count} votes)</span>
                    </div>
                  )}
                </div>

                {tvShow.genres && tvShow.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tvShow.genres.map((genre: TmdbGenre) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {tvShow.overview && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-3">Overview</h2>
                    <p className="text-lg leading-relaxed">{tvShow.overview}</p>
                  </div>
                )}
              </div>

              {/* Trailer */}
              {trailer && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">Trailer</h2>
                    <a
                      href={`https://www.youtube.com/watch?v=${trailer.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      Watch on YouTube
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                      </svg>
                    </a>
                  </div>
                  <YoutubeEmbed 
                    videoKey={trailer.key} 
                    title={trailer.name || `${tvShow.name} Trailer`} 
                  />
                </div>
              )}

              {/* Where to Watch */}
              {providersValue && (
                <div>
                  <WatchProviders providers={providersValue} title={tvShow.name} mediaType="tv" />
                </div>
              )}

              {/* Episode Tracking */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Episode Tracking</h2>
                <TvShowProgress tvShow={tvShow} />
              </div>

              {/* Detailed Ratings Section */}
              <div className="mt-12">
                <DetailedRatingDisplay tmdbId={parseInt(id)} mediaType="tv" title={tvShow.name} />
              </div>

              {/* Reviews Section */}
              <div className="mt-12">
                <Suspense
                  fallback={
                    <div className="space-y-4">
                      <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-32 bg-muted rounded animate-pulse" />
                        ))}
                      </div>
                    </div>
                  }
                >
                  <ReviewsSection tmdbId={parseInt(id)} mediaType="tv" title={tvShow.name} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching TV show details:', error);
    notFound();
  }
}

export default async function TvPage({ params }: TvPageProps) {
  const { id } = await params;

  // Validate ID
  if (!id || isNaN(parseInt(id))) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4" />
            <div className="h-6 bg-muted rounded w-1/4 mb-6" />
            <div className="h-32 bg-muted rounded mb-6" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <TvShowDetails id={id} />
    </Suspense>
  );
}
