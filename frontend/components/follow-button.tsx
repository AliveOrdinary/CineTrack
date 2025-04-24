'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import useUser from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react'; // Import loader icon

interface FollowButtonProps {
  profileUserId: string; // The ID of the user whose profile is being viewed
}

// Define the query key type
type FollowStatusQueryKey = readonly [string, string | undefined, string];
// Define context type for mutation
interface MutationContext {
    previousFollowStatus?: boolean;
}

export default function FollowButton({ profileUserId }: FollowButtonProps) {
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFollowingOptimistic, setIsFollowingOptimistic] = useState<boolean | null>(null);

  // Stable query key
  const queryKey: FollowStatusQueryKey = ['followStatus', currentUser?.id, profileUserId] as const;

  // Query to check the initial follow status
  const { 
      data: isFollowing, 
      isLoading: isLoadingFollowStatus, 
      error: followStatusError 
  } = useQuery<boolean, Error>({
    queryKey: queryKey,
    queryFn: async () => {
      if (!currentUser) return false; 
      // Use count() for efficiency
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', currentUser.id)
        .eq('following_id', profileUserId);
      
      if (error) {
        console.error('Error checking follow status:', error);
        throw new Error('Could not check follow status.');
      }
      return (count ?? 0) > 0; // True if count > 0
    },
    enabled: !!currentUser && !!profileUserId && !isUserLoading, 
    staleTime: 5 * 60 * 1000, 
  });

  // --- Follow Mutation ---
  const followMutation = useMutation<void, Error, void, MutationContext>({
    mutationFn: async () => {
      if (!currentUser) throw new Error('User not logged in.');
      if (currentUser.id === profileUserId) throw new Error('Cannot follow yourself.');
      
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUser.id, following_id: profileUserId });

      if (error) {
        if (error.code === '23505') { 
          console.warn('Attempted to follow already followed user.');
          return; 
        } else {
          throw error;
        }
      }
    },
    onMutate: async () => {
        setIsFollowingOptimistic(true);
        await queryClient.cancelQueries({ queryKey });
        const previousFollowStatus = queryClient.getQueryData<boolean>(queryKey);
        queryClient.setQueryData(queryKey, true);
        return { previousFollowStatus };
    },
    onError: (err: Error, _variables: void, context?: MutationContext) => {
        console.error("Error following user:", err);
        if (context?.previousFollowStatus !== undefined) {
          queryClient.setQueryData(queryKey, context.previousFollowStatus);
        }
        setIsFollowingOptimistic(context?.previousFollowStatus ?? null);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not follow user. Please try again.",
        });
      },
    onSuccess: () => {
        setIsFollowingOptimistic(null);
        toast({ title: "Followed!" });
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: ['followCounts', profileUserId] }); 
        if (currentUser) {
            queryClient.invalidateQueries({ queryKey: ['followCounts', currentUser.id] });
        }
    },
  });

  // --- Unfollow Mutation ---
  const unfollowMutation = useMutation<void, Error, void, MutationContext>({
    mutationFn: async () => {
      if (!currentUser) throw new Error('User not logged in.');
      
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', profileUserId);

      if (error) throw error;
    },
     onMutate: async () => {
        setIsFollowingOptimistic(false);
        await queryClient.cancelQueries({ queryKey });
        const previousFollowStatus = queryClient.getQueryData<boolean>(queryKey);
        queryClient.setQueryData(queryKey, false);
        return { previousFollowStatus };
    },
    onError: (err: Error, _variables: void, context?: MutationContext) => {
        console.error("Error unfollowing user:", err);
        if (context?.previousFollowStatus !== undefined) {
          queryClient.setQueryData(queryKey, context.previousFollowStatus);
        }
        setIsFollowingOptimistic(context?.previousFollowStatus ?? null);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not unfollow user. Please try again.",
        });
      },
    onSuccess: () => {
         setIsFollowingOptimistic(null);
         toast({ title: "Unfollowed" });
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: ['followCounts', profileUserId] });
        if (currentUser) {
            queryClient.invalidateQueries({ queryKey: ['followCounts', currentUser.id] });
        }
    },
  });

  const handleFollowToggle = () => {
    if (!currentUser) {
        toast({ title: "Please log in to follow users.", variant: "destructive" });
        return;
    }
    // Use isFollowing (fetched state) to decide which mutation to trigger
    if (isFollowing) {
      unfollowMutation.mutate(); 
    } else {
      followMutation.mutate();
    }
  };

  // Don't render if viewing own profile or user is loading
  if (isUserLoading || !currentUser || currentUser.id === profileUserId) {
    return null;
  }

  // Use isPending for mutation loading state
  const isLoading = isLoadingFollowStatus || followMutation.isPending || unfollowMutation.isPending;
  // Determine display state: Use optimistic state if set, otherwise use fetched state
  const displayFollowing = isFollowingOptimistic !== null ? isFollowingOptimistic : isFollowing;

  if (followStatusError) {
     return (
        <Button variant="outline" size="sm" disabled title={`Error: ${followStatusError.message}`}>
          Error
        </Button>
     );
  }

  return (
    <Button
      onClick={handleFollowToggle}
      disabled={isLoading || isLoadingFollowStatus} // Disable also while initially checking status
      variant={displayFollowing ? 'outline' : 'default'}
      size="sm"
      className="min-w-[80px]" // Add min-width to prevent layout shift
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
      {!isLoading && (displayFollowing ? 'Unfollow' : 'Follow')}
    </Button>
  );
} 