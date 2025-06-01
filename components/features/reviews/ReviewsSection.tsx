'use client';

import { useState, useEffect } from 'react';
import { getContentReviews, type ReviewWithUser } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, AlertTriangle, Eye, EyeOff, Users, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Rating } from '@/components/ui/rating';
import { ReviewLikeButton } from './ReviewLikeButton';
import { ReviewComments } from './ReviewComments';
import { ReportButton } from '../reports/ReportButton';

interface ReviewsSectionProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
}

export function ReviewsSection({ tmdbId, mediaType, title }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSpoilers, setShowSpoilers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReviews();
  }, [tmdbId, mediaType]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const reviewsData = await getContentReviews(tmdbId, mediaType, 20);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpoiler = (reviewId: string) => {
    setShowSpoilers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Users className="h-3 w-3" />;
      case 'followers':
        return <Eye className="h-3 w-3" />;
      case 'private':
        return <EyeOff className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'followers':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'private':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Reviews</h2>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Reviews ({reviews.length})</h2>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
            <p className="text-muted-foreground">
              Be the first to share your thoughts about "{title}"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <Card key={review.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={review.is_anonymous ? undefined : review.users?.avatar_url}
                        alt={
                          review.is_anonymous ? 'Anonymous' : review.users?.display_name || 'User'
                        }
                      />
                      <AvatarFallback>
                        {review.is_anonymous
                          ? 'A'
                          : (review.users?.display_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {review.is_anonymous ? 'Anonymous' : review.users?.display_name || 'User'}
                        </h4>

                        {review.rating && (
                          <div className="flex items-center gap-1">
                            <Rating value={review.rating} readonly size="sm" />
                            <span className="text-sm text-muted-foreground">
                              {review.rating}/10
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at!), { addSuffix: true })}
                        </span>

                        <Badge
                          variant="secondary"
                          className={getVisibilityColor(review.visibility!)}
                        >
                          {getVisibilityIcon(review.visibility!)}
                          <span className="ml-1 capitalize">{review.visibility}</span>
                        </Badge>

                        {review.is_spoiler && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Spoiler
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {review.is_spoiler && !showSpoilers.has(review.id!) ? (
                  <div className="text-center py-8 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                    <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-4">This review contains spoilers</p>
                    <Button variant="outline" size="sm" onClick={() => toggleSpoiler(review.id!)}>
                      Show Spoiler
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="whitespace-pre-wrap">{review.content}</p>
                    </div>

                    {review.is_spoiler && showSpoilers.has(review.id!) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSpoiler(review.id!)}
                        className="text-muted-foreground"
                      >
                        Hide Spoiler
                      </Button>
                    )}

                    <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                      <ReviewLikeButton
                        reviewId={review.id!}
                        reviewAuthorId={review.user_id!}
                        movieTitle={title}
                        initialLikesCount={review.likes_count || 0}
                      />
                      <ReviewComments
                        reviewId={review.id!}
                        initialCommentsCount={review.comments_count || 0}
                      />
                      <ReportButton
                        contentType="review"
                        contentId={review.id!}
                        reportedUserId={review.user_id!}
                        variant="ghost"
                        size="sm"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
