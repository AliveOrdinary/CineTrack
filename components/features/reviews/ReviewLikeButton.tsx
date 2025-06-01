'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import {
  likeReview,
  unlikeReview,
  checkUserLikedReview,
  getUserProfile,
} from '@/lib/supabase/client';
import { createReviewLikeNotification } from '@/lib/supabase/notifications';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReviewLikeButtonProps {
  reviewId: string;
  reviewAuthorId: string;
  movieTitle: string;
  initialLikesCount: number;
  className?: string;
}

export function ReviewLikeButton({
  reviewId,
  reviewAuthorId,
  movieTitle,
  initialLikesCount,
  className,
}: ReviewLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLikeStatus();
  }, [reviewId]);

  const checkAuthAndLikeStatus = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        setCurrentUserId(user.id);
        const liked = await checkUserLikedReview(reviewId);
        setIsLiked(liked);
      } else {
        setIsAuthenticated(false);
        setCurrentUserId(null);
        setIsLiked(false);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like reviews');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isLiked) {
        await unlikeReview(reviewId);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        toast.success('Review unliked');
      } else {
        await likeReview(reviewId);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        toast.success('Review liked!');

        // Create notification for the review author (if not liking own review)
        if (currentUserId && currentUserId !== reviewAuthorId) {
          try {
            const currentUserProfile = await getUserProfile(currentUserId);
            if (currentUserProfile) {
              await createReviewLikeNotification(
                reviewAuthorId,
                currentUserProfile.display_name || currentUserProfile.email || 'Someone',
                currentUserId,
                reviewId,
                movieTitle
              );
            }
          } catch (notificationError) {
            console.error('Failed to create review like notification:', notificationError);
            // Don't show error to user as the like action succeeded
          }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleLike}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-2 text-muted-foreground hover:text-foreground',
        isLiked && 'text-red-500 hover:text-red-600',
        className
      )}
    >
      <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
      <span>{likesCount}</span>
    </Button>
  );
}
