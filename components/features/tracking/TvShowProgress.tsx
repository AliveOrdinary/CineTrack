'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Play, CheckCircle2, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { SeasonEpisodes } from './SeasonEpisodes';
import { getTvShowProgress, type TvShowProgress, type SeasonProgress } from '@/lib/supabase/client';
import { type TmdbTvDetails } from '@/lib/tmdb/types';
import { cn } from '@/lib/utils';

interface TvShowProgressProps {
  tvShow: TmdbTvDetails;
  className?: string;
}

export function TvShowProgress({ tvShow, className }: TvShowProgressProps) {
  const [progress, setProgress] = useState<TvShowProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const loadProgress = async () => {
    try {
      setLoading(true);

      // Build episodes per season map from TMDB data
      const episodesPerSeason: Record<number, number> = {};
      tvShow.seasons?.forEach(season => {
        if (season.season_number > 0) {
          // Skip specials (season 0)
          episodesPerSeason[season.season_number] = season.episode_count;
        }
      });

      const progressData = await getTvShowProgress(
        tvShow.id,
        tvShow.number_of_seasons,
        episodesPerSeason
      );

      setProgress(progressData);
    } catch (error) {
      console.error('Error loading TV show progress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [tvShow.id]);

  const handleRefresh = () => {
    loadProgress();
  };

  const getSeasonFromTmdb = (seasonNumber: number) => {
    return tvShow.seasons?.find(s => s.season_number === seasonNumber);
  };

  const overallProgress = progress
    ? (progress.watched_episodes / progress.total_episodes) * 100
    : 0;

  const nextEpisode = progress?.next_episode;
  const nextSeason = nextEpisode ? getSeasonFromTmdb(nextEpisode.season_number) : null;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {progress?.watched_episodes || 0}
                </div>
                <div className="text-sm text-muted-foreground">Episodes Watched</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{progress?.total_episodes || 0}</div>
                <div className="text-sm text-muted-foreground">Total Episodes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {progress?.seasons.filter(s => s.percentage === 100).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Seasons Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Next Episode */}
            {nextEpisode && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium mb-1">Continue Watching</h4>
                    <p className="text-sm text-muted-foreground">
                      Season {nextEpisode.season_number}, Episode {nextEpisode.episode_number}
                      {nextSeason && ` • ${nextSeason.name}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab(`season-${nextEpisode.season_number}`)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch Next
                  </Button>
                </div>
              </div>
            )}

            {/* Season Progress Grid */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {progress?.seasons.map(season => {
                const tmdbSeason = getSeasonFromTmdb(season.season_number);
                return (
                  <Card
                    key={season.season_number}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-muted/50',
                      season.percentage === 100 && 'border-green-200 dark:border-green-800'
                    )}
                    onClick={() => setActiveTab(`season-${season.season_number}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">
                          {tmdbSeason?.name || `Season ${season.season_number}`}
                        </h4>
                        {season.percentage === 100 && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {season.watched_episodes} / {season.total_episodes} episodes
                          </span>
                          <span>{Math.round(season.percentage)}%</span>
                        </div>
                        <Progress value={season.percentage} className="h-1" />
                      </div>
                      {tmdbSeason?.air_date && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(tmdbSeason.air_date).getFullYear()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Season Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {tvShow.seasons
            ?.filter(s => s.season_number > 0)
            .map(season => (
              <TabsTrigger
                key={season.season_number}
                value={`season-${season.season_number}`}
                className="flex items-center gap-2"
              >
                S{season.season_number}
                {progress?.seasons.find(s => s.season_number === season.season_number)
                  ?.percentage === 100 && <CheckCircle2 className="h-3 w-3 text-green-500" />}
              </TabsTrigger>
            ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Track Your Episodes</h3>
              <p className="text-muted-foreground mb-4">
                Select a season above to start tracking individual episodes
              </p>
              {nextEpisode && (
                <Button onClick={() => setActiveTab(`season-${nextEpisode.season_number}`)}>
                  Continue with Season {nextEpisode.season_number}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {tvShow.seasons
          ?.filter(s => s.season_number > 0)
          .map(season => (
            <TabsContent
              key={season.season_number}
              value={`season-${season.season_number}`}
              className="mt-6"
            >
              <SeasonEpisodes
                tmdbTvId={tvShow.id}
                seasonNumber={season.season_number}
                seasonName={season.name}
              />
            </TabsContent>
          ))}
      </Tabs>
    </div>
  );
}
