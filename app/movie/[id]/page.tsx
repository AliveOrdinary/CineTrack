import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getMovieDetails, getMovieCredits, getMovieVideos, getSimilarMovies, getMovieWatchProviders } from "@/lib/tmdb/client";
import { TmdbMovieDetails, TmdbCastMember, TmdbCrewMember, TmdbVideo, TmdbGenre, TmdbWatchProvider, TmdbMovieCreditsResponse } from "@/lib/tmdb/types";
import MediaGrid from "@/components/features/content/MediaGrid";
import MediaSection from "@/components/features/content/MediaSection";
import MediaSectionSkeleton from "@/components/features/content/MediaSectionSkeleton";
import { WatchedContentButton } from "@/components/features/tracking/WatchedContentButton";
import { WatchlistButton } from "@/components/features/tracking/WatchlistButton";
import { AddToListButton } from "@/components/features/lists/AddToListButton";
import { ReviewButton } from "@/components/features/reviews/ReviewButton";
import { ReviewsSection } from "@/components/features/reviews/ReviewsSection";

interface MoviePageProps {
  params: Promise<{
    id: string;
  }>;
}

async function MovieDetails({ id }: { id: string }) {
  try {
    const movie = await getMovieDetails(parseInt(id));
    
    if (!movie) {
      notFound();
    }

    const [credits, videos, similar, providers] = await Promise.allSettled([
      getMovieCredits(parseInt(id)),
      getMovieVideos(parseInt(id)),
      getSimilarMovies(parseInt(id)),
      getMovieWatchProviders(parseInt(id))
    ]);

    const movieCredits = credits.status === 'fulfilled' ? credits.value : null;
    const movieVideos = videos.status === 'fulfilled' ? videos.value : null;
    const similarMovies = similar.status === 'fulfilled' ? similar.value : null;
    const providersValue = providers.status === 'fulfilled' ? providers.value : null;

    // Find main trailer
    const trailer = movieVideos?.results?.find(
      (video: TmdbVideo) => video.type === 'Trailer' && video.site === 'YouTube'
    ) || movieVideos?.results?.[0];

    const backdropUrl = movie.backdrop_path 
      ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
      : null;

    const posterUrl = movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null;

    return (
      <div className="w-full">
        {/* Hero Section with Backdrop */}
        {backdropUrl && (
          <div className="relative h-[50vh] w-full">
            <Image
              src={backdropUrl}
              alt={movie.title}
              fill
              className="object-cover"
              priority
            />
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
                    alt={movie.title}
                    fill
                    className="object-cover rounded-lg shadow-lg"
                  />
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <WatchedContentButton
                  tmdbId={parseInt(id)}
                  mediaType="movie"
                  title={movie.title}
                />
                
                <WatchlistButton
                  tmdbId={parseInt(id)}
                  mediaType="movie"
                  title={movie.title}
                />
                
                <AddToListButton
                  tmdbId={parseInt(id)}
                  mediaType="movie"
                  title={movie.title}
                />
                
                <ReviewButton
                  tmdbId={parseInt(id)}
                  mediaType="movie"
                  title={movie.title}
                />
              </div>
            </div>

            {/* Movie Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
                {movie.release_date && (
                  <p className="text-xl text-muted-foreground mb-4">
                    {new Date(movie.release_date).getFullYear()}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-4 mb-6">
                  {movie.vote_average && movie.vote_average > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                      <span className="text-muted-foreground">({movie.vote_count} votes)</span>
                    </div>
                  )}
                  {movie.runtime && (
                    <span className="text-muted-foreground">
                      {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                    </span>
                  )}
                </div>

                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {movie.genres.map((genre: TmdbGenre) => (
                      <span 
                        key={genre.id}
                        className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {movie.overview && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-3">Overview</h2>
                    <p className="text-lg leading-relaxed">{movie.overview}</p>
                  </div>
                )}
              </div>

              {/* Trailer */}
              {trailer && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Trailer</h2>
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${trailer.key}`}
                      title={trailer.name}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Cast */}
              {movieCredits?.cast && movieCredits.cast.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Cast</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {movieCredits.cast.slice(0, 12).map((member: TmdbCastMember) => (
                      <div key={member.id} className="text-center">
                        {member.profile_path && (
                          <div className="aspect-[2/3] relative mb-2">
                            <Image
                              src={`https://image.tmdb.org/t/p/w200${member.profile_path}`}
                              alt={member.name}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold text-sm">{member.name}</h3>
                        <p className="text-xs text-muted-foreground">{member.character}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Crew */}
              {movieCredits?.crew && movieCredits.crew.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Key Crew</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {movieCredits.crew
                      .filter((member: TmdbCrewMember) => 
                        ['Director', 'Producer', 'Executive Producer', 'Writer', 'Screenplay'].includes(member.job)
                      )
                      .slice(0, 8)
                      .map((member: TmdbCrewMember) => (
                        <div key={`${member.id}-${member.job}`} className="flex justify-between">
                          <span className="font-medium">{member.name}</span>
                          <span className="text-muted-foreground">{member.job}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Where to Watch */}
              {providersValue?.results?.US && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Where to Watch</h2>
                  <div className="space-y-4">
                    {providersValue.results.US.flatrate && (
                      <div>
                        <h3 className="font-medium mb-2">Stream</h3>
                        <div className="flex flex-wrap gap-2">
                          {providersValue.results.US.flatrate.map((provider: TmdbWatchProvider, index: number) => (
                            <div key={index} className="flex items-center gap-2 bg-accent px-3 py-2 rounded-md">
                              {provider.logo_path && (
                                <Image
                                  src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                                  alt={provider.provider_name}
                                  width={20}
                                  height={20}
                                  className="rounded"
                                />
                              )}
                              <span className="text-sm">{provider.provider_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Similar Movies */}
          {similarMovies?.results && similarMovies.results.length > 0 && (
            <div className="mt-12">
              <Suspense fallback={<MediaSectionSkeleton />}>
                <MediaSection 
                  title="More Like This" 
                  items={similarMovies.results} 
                />
              </Suspense>
            </div>
          )}

          {/* Reviews Section */}
          <div className="mt-12">
            <Suspense fallback={
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </div>
            }>
              <ReviewsSection
                tmdbId={parseInt(id)}
                mediaType="movie"
                title={movie.title}
              />
            </Suspense>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching movie details:', error);
    notFound();
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;

  // Validate ID
  if (!id || isNaN(parseInt(id))) {
    notFound();
  }

  return (
    <Suspense fallback={
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
    }>
      <MovieDetails id={id} />
    </Suspense>
  );
} 