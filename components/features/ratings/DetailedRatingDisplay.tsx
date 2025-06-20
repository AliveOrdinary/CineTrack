'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  BarChart3, 
  TrendingUp, 
  Users,
  Heart,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import {
  DetailedRatingWithUser,
  ContentDetailedRatings,
  RATING_CATEGORIES,
  EMOTIONAL_REACTIONS,
  formatRatingDisplay,
  getRatingColor,
} from '@/types/detailed-ratings';
import {
  getContentDetailedRatings,
  getContentRatingAggregates,
} from '@/lib/supabase/detailed-ratings';
import { formatDistanceToNow } from 'date-fns';

interface DetailedRatingDisplayProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
}

export function DetailedRatingDisplay({ tmdbId, mediaType, title }: DetailedRatingDisplayProps) {
  const [aggregates, setAggregates] = useState<ContentDetailedRatings | null>(null);
  const [ratings, setRatings] = useState<DetailedRatingWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllRatings, setShowAllRatings] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadRatingData();
  }, [tmdbId, mediaType]);

  const loadRatingData = async () => {
    setIsLoading(true);
    try {
      const [aggregateData, ratingsData] = await Promise.all([
        getContentRatingAggregates(tmdbId, mediaType),
        getContentDetailedRatings(tmdbId, mediaType, 5, 0),
      ]);

      setAggregates(aggregateData);
      setRatings(ratingsData);
    } catch (error) {
      console.error('Error loading rating data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreRatings = async () => {
    setLoadingMore(true);
    try {
      const moreRatings = await getContentDetailedRatings(tmdbId, mediaType, 10, ratings.length);
      setRatings(prev => [...prev, ...moreRatings]);
    } catch (error) {
      console.error('Error loading more ratings:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading detailed ratings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!aggregates || aggregates.total_ratings === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Detailed Ratings Yet</h3>
          <p className="text-muted-foreground">
            Be the first to add a detailed rating for "{title}"
          </p>
        </CardContent>
      </Card>
    );
  }

  const topEmotionalReactions = Object.entries({
    cry: aggregates.cry_percentage,
    laugh: aggregates.laugh_percentage,
    scary: aggregates.scary_percentage,
    inspiring: aggregates.inspiring_percentage,
    thought_provoking: aggregates.thought_provoking_percentage,
    nostalgic: aggregates.nostalgic_percentage,
    romantic: aggregates.romantic_percentage,
    intense: aggregates.intense_percentage,
  })
    .filter(([_, percentage]) => percentage > 10) // Only show reactions with >10%
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detailed Ratings Overview
          </CardTitle>
          <CardDescription>
            Based on {aggregates.total_ratings} detailed rating{aggregates.total_ratings !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Overall Rating</h4>
              <p className="text-sm text-muted-foreground">Average across all categories</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getRatingColor(aggregates.avg_overall)}`}>
                {formatRatingDisplay(aggregates.avg_overall)}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                {aggregates.total_ratings} rating{aggregates.total_ratings !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <Separator />

          {/* Category Ratings */}
          <div>
            <h4 className="font-medium mb-4">Category Ratings</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(RATING_CATEGORIES).map(([key, category]) => {
                const avgRating = aggregates[`avg_${key}` as keyof ContentDetailedRatings] as number;
                if (!avgRating) return null;

                return (
                  <div key={key} className="text-center">
                    <div className="text-lg mb-1">{category.icon}</div>
                    <div className={`font-medium ${getRatingColor(avgRating)}`}>
                      {formatRatingDisplay(avgRating)}
                    </div>
                    <div className="text-xs text-muted-foreground">{category.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Emotional Reactions */}
          {topEmotionalReactions.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Common Reactions
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {topEmotionalReactions.map(([reactionKey, percentage]) => {
                    const reaction = EMOTIONAL_REACTIONS[`${reactionKey === 'thought_provoking' ? 'was_thought_provoking' : reactionKey === 'cry' ? 'made_me_cry' : reactionKey === 'laugh' ? 'made_me_laugh' : `was_${reactionKey}`}` as keyof typeof EMOTIONAL_REACTIONS];
                    if (!reaction) return null;

                    return (
                      <div key={reactionKey} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{reaction.emoji}</span>
                          <span className="text-sm">{reaction.label}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(percentage)}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Individual Ratings */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Individual Ratings
              </span>
              {ratings.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllRatings(!showAllRatings)}
                >
                  {showAllRatings ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show All ({aggregates.total_ratings})
                    </>
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(showAllRatings ? ratings : ratings.slice(0, 3)).map((rating) => (
                <div key={rating.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={rating.user.avatar_url} />
                        <AvatarFallback>
                          {rating.user.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{rating.user.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(rating.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className={`font-bold ${getRatingColor(rating.overall_rating)}`}>
                      {formatRatingDisplay(rating.overall_rating)}
                    </div>
                  </div>

                  {/* Category ratings */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                    {Object.entries(RATING_CATEGORIES).map(([key, category]) => {
                      const categoryRating = rating[`${key}_rating` as keyof typeof rating] as number;
                      if (!categoryRating) return null;

                      return (
                        <div key={key} className="text-center">
                          <div className="text-sm">{category.icon}</div>
                          <div className="text-xs font-medium">{categoryRating}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Emotional reactions */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.entries(EMOTIONAL_REACTIONS).map(([reactionKey, reaction]) => {
                      if (!rating[reactionKey as keyof typeof rating]) return null;
                      
                      return (
                        <Badge key={reactionKey} variant="secondary" className="text-xs">
                          {reaction.emoji} {reaction.label}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Notes */}
                  {rating.notes && (
                    <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-3">
                      "{rating.notes}"
                    </p>
                  )}
                </div>
              ))}

              {showAllRatings && ratings.length < aggregates.total_ratings && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={loadMoreRatings}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    )}
                    Load More Ratings
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}