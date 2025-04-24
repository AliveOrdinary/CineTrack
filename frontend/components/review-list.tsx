'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import useUser from '@/hooks/useUser'; // Import useUser
import ReviewCard, { ReviewWithUserProfile } from './review-card'; // Import card and type
import ReviewForm from './review-form'; // Import ReviewForm
import { MediaType } from '@/types/tmdb';
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { Button } from "@/components/ui/button"; // Import Button
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Import Dialog components
import { PlusCircleIcon, PencilIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; // Import useToast
// Import TanStack Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ReviewListProps {
  tmdbId: number;
  mediaType: MediaType;
}

export default function ReviewList({ tmdbId, mediaType }: ReviewListProps) {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useUser(); // Get user session
  const queryClient = useQueryClient();
  const { toast } = useToast(); // Initialize useToast

  // Local UI state remains
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewWithUserProfile | null>(null);

  // --- TanStack Query for fetching reviews --- 
  const { 
    data: reviews, // Let TanStack Query handle undefined initially
    isLoading: isLoadingReviews, 
    isError: isReviewsError, 
    error: reviewsError 
  } = useQuery<ReviewWithUserProfile[], Error>({
    queryKey: ['reviews', tmdbId, mediaType], // Unique key for this query
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`*, users ( display_name, avatar_url )`)
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching reviews (queryFn):", error);
        throw new Error(error.message || "Failed to load reviews.");
      }
      return data as ReviewWithUserProfile[];
    },
  });

  // Extract review IDs for the next query
  const reviewIds = useMemo(() => reviews?.map(r => r.id) || [], [reviews]);

  // Query for the current user's likes on these reviews
  const { data: userLikesData, isLoading: isLoadingLikes } = useQuery<{ review_id: string }[], Error>({
    queryKey: ['reviewLikes', user?.id, reviewIds],
    queryFn: async () => {
      if (!user || reviewIds.length === 0) return [];
      const { data, error } = await supabase
        .from('review_interactions')
        .select('review_id')
        .eq('user_id', user.id)
        .eq('interaction_type', 'like')
        .in('review_id', reviewIds);

      if (error) {
        console.error("Error fetching user likes:", error);
        return [];
      }
      // Filter out null review_ids and ensure it matches the expected type
      return (data || []).filter(item => item.review_id !== null) as { review_id: string }[];
    },
    enabled: !!user && reviewIds.length > 0,
  });

  // Create a Set for efficient lookup of liked reviews
  const likedReviewIds = useMemo(() => {
    // Add explicit type for 'like' parameter
    return new Set(userLikesData?.map((like: { review_id: string }) => like.review_id) || []);
  }, [userLikesData]);

  // Combine loading states
  const isLoading = isLoadingReviews || (!!user && isLoadingLikes);
  const isError = isReviewsError; // Primarily focus on review fetch errors for display
  const fetchError = reviewsError;

  // Derive userHasReviewed from query data
  const userHasReviewed = useMemo(() => {
    // Ensure reviews is an array before calling .some
    return Array.isArray(reviews) && reviews.some(review => user && review.user_id === user.id);
  }, [reviews, user]);

  // Effect to close form if editing review disappears (e.g., deleted in another tab)
  useEffect(() => {
    // Ensure reviews is an array before calling .some
    if (editingReview && Array.isArray(reviews) && !reviews.some(r => r.id === editingReview.id)) {
      handleCloseForm();
    }
  }, [reviews, editingReview]);

  // --- TanStack Mutation for deleting reviews --- 
  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) throw new Error("User not logged in");
      
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .match({ id: reviewId, user_id: user.id });

      if (deleteError) {
        throw new Error(deleteError.message || "Could not delete the review.");
      }
      return reviewId; // Return something on success if needed
    },
    onSuccess: () => {
      toast({ title: "Review Deleted", description: "Your review has been successfully deleted." });
      // Invalidate the reviews query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['reviews', tmdbId, mediaType] });
    },
    onError: (error: Error) => {
      console.error("Error deleting review (mutation):", error);
      toast({ 
        variant: "destructive", 
        title: "Deletion Failed", 
        description: error.message || "Could not delete the review. Please try again."
      });
    },
  });

  // --- Event Handlers --- 

  const handleReviewSubmitSuccess = () => {
    // Invalidation is now handled by the form's mutation
    handleCloseForm(); 
  };

  const handleCloseForm = () => {
    setIsReviewFormOpen(false);
    setEditingReview(null);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to delete reviews." });
      return;
    }
    if (window.confirm("Are you sure you want to delete this review? This cannot be undone.")) {
      deleteMutation.mutate(reviewId); // Trigger the mutation
    }
  };

  // --- Render Logic (using TanStack Query state) --- 

  // Handle data possibly being undefined during initial load or transitions
  const reviewList = Array.isArray(reviews) ? reviews : [];

  return (
    <div className="border-t border-gray-800 mt-8 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">
          Reviews {isLoadingReviews ? '' : `(${reviewList.length})`}
        </h2>
        {/* Show Write/Edit Review button only if logged in */}
        {user && !isLoadingReviews && (
           <Dialog 
              open={isReviewFormOpen} 
              onOpenChange={(isOpen) => { 
                if (!isOpen) handleCloseForm(); 
                else setIsReviewFormOpen(true);
              }}
           >
             <DialogTrigger asChild>
                {/* Show 'Edit' if user has reviewed, 'Write' otherwise */}
                {userHasReviewed ? (
                   <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditingReview(reviewList.find(r => r.user_id === user.id) || null)}
                      disabled={isLoadingReviews} // Disable while loading reviews
                   >
                     <PencilIcon className="mr-2 h-4 w-4" /> Edit Your Review
                   </Button>
                ) : (
                   <Button 
                     size="sm" 
                     disabled={isLoadingReviews} // Disable while loading reviews
                   >
                     <PlusCircleIcon className="mr-2 h-4 w-4" /> Write a Review
                   </Button>
                )}
             </DialogTrigger>
             <DialogContent className="sm:max-w-[600px]">
               <DialogHeader>
                 <DialogTitle>{editingReview ? 'Edit Your Review' : 'Write Your Review'}</DialogTitle>
                  {/* Optional: Add subtitle with movie/show title */}
               </DialogHeader>
               <ReviewForm 
                 tmdbId={tmdbId} 
                 mediaType={mediaType} 
                 userId={user.id} 
                 onSubmitSuccess={handleReviewSubmitSuccess}
                 initialData={editingReview} // Pass review data for editing
               />
             </DialogContent>
           </Dialog>
        )}
      </div>

      {/* Loading State */}
      {isLoadingReviews && (
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
      )}

      {/* Error State */}
      {isReviewsError && (
        <div className="p-4 rounded text-sm bg-red-900 border border-red-700 text-red-200">
          Error loading reviews: {fetchError?.message || 'Unknown error'}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingReviews && !isReviewsError && reviewList.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <p>No reviews yet.</p>
          {/* Show prompt to review if logged in */}
          {user && (
             <Button 
               variant="outline" 
               size="sm" 
               className="mt-4" 
               onClick={() => { setEditingReview(null); setIsReviewFormOpen(true); }}
               disabled={isLoadingReviews} // Disable button if reviews are loading
             >
                <PlusCircleIcon className="mr-2 h-4 w-4" /> Be the first to review!
              </Button>
          )}
        </div>
      )}

      {/* Review List */}
      {!isLoadingReviews && !isReviewsError && reviewList.length > 0 && (
        <div className="space-y-6">
          {reviewList.map((review) => (
            <ReviewCard 
              key={review.id} 
              review={review} 
              isLiked={likedReviewIds.has(review.id)}
              onEdit={() => { 
                  setEditingReview(review);
                  setIsReviewFormOpen(true);
              }} 
              onDelete={handleDeleteReview}
            />
          ))}
        </div>
      )}
      
      {/* TODO: Add pagination controls later */}
    </div>
  );
}
