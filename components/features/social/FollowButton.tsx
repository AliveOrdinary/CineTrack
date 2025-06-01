'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import {
  followUser,
  unfollowUser,
  checkUserFollowStatus,
  getUserProfile,
} from '@/lib/supabase/client';
import { createFollowNotification } from '@/lib/supabase/notifications';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function FollowButton({
  userId,
  className,
  variant = 'default',
  size = 'default',
  showText = true,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedBy, setIsFollowedBy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFollowStatus();
  }, [userId]);

  const checkAuthAndFollowStatus = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        setCurrentUserId(user.id);

        if (user.id !== userId) {
          const status = await checkUserFollowStatus(userId);
          setIsFollowing(status.isFollowing);
          setIsFollowedBy(status.isFollowedBy);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUserId(null);
        setIsFollowing(false);
        setIsFollowedBy(false);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to follow users');
      return;
    }

    if (currentUserId === userId) {
      toast.error('You cannot follow yourself');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        toast.success('User unfollowed');
      } else {
        await followUser(userId);
        setIsFollowing(true);
        toast.success('User followed!');

        // Create notification for the followed user
        try {
          const currentUserProfile = await getUserProfile(currentUserId!);
          if (currentUserProfile) {
            await createFollowNotification(
              userId,
              currentUserProfile.display_name || currentUserProfile.email || 'Someone',
              currentUserId!
            );
          }
        } catch (notificationError) {
          console.error('Failed to create follow notification:', notificationError);
          // Don't show error to user as the follow action succeeded
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button for own profile
  if (currentUserId === userId) {
    return null;
  }

  // Don't show button if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const getButtonText = () => {
    if (!showText) return '';

    if (isFollowing) {
      return isFollowedBy ? 'Friends' : 'Following';
    } else {
      return isFollowedBy ? 'Follow Back' : 'Follow';
    }
  };

  const getButtonIcon = () => {
    if (isFollowing) {
      return <UserMinus className="h-4 w-4" />;
    } else if (isFollowedBy) {
      return <Users className="h-4 w-4" />;
    } else {
      return <UserPlus className="h-4 w-4" />;
    }
  };

  const getButtonVariant = () => {
    if (isFollowing) {
      return 'outline';
    }
    return variant;
  };

  return (
    <Button
      variant={getButtonVariant()}
      size={size}
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-2',
        isFollowing && 'hover:bg-destructive hover:text-destructive-foreground',
        className
      )}
    >
      {getButtonIcon()}
      {showText && (
        <span className={cn(isFollowing && 'group-hover:hidden')}>
          {isLoading ? '...' : getButtonText()}
        </span>
      )}
      {isFollowing && showText && <span className="hidden group-hover:inline">Unfollow</span>}
    </Button>
  );
}
