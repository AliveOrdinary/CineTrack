'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@cinetrack/shared';
import { MediaType } from '@/types/tmdb';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];
type ReviewRow = Database['public']['Tables']['reviews']['Row'];

interface ReviewFormProps {
  tmdbId: number;
  mediaType: MediaType;
  userId: string; // Assume user is logged in when this form is shown
  initialData?: ReviewRow | null; // For editing
  onSubmitSuccess: () => void; // Callback after successful submission
}

export default function ReviewForm({
  tmdbId,
  mediaType,
  userId,
  initialData,
  onSubmitSuccess,
}: ReviewFormProps) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [rating, setRating] = useState<number | undefined>(undefined);
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = !!initialData;

  // Effect to populate form when editing
  useEffect(() => {
    if (isEditing && initialData) {
      setRating(initialData.rating ?? undefined);
      setContent(initialData.content);
      setIsSpoiler(initialData.is_spoiler ?? false);
      setFormError(null);
    } else {
      setRating(undefined);
      setContent('');
      setIsSpoiler(false);
      setFormError(null);
    }
  }, [initialData, isEditing]);

  // --- TanStack Mutation for creating/updating reviews --- 
  const reviewMutation = useMutation({
    mutationFn: async (formData: { rating: number; content: string; isSpoiler: boolean }) => {
      if (isEditing && initialData) {
        // Update
        const reviewUpdate: ReviewUpdate = {
          rating: formData.rating,
          content: formData.content,
          is_spoiler: formData.isSpoiler,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase
          .from('reviews')
          .update(reviewUpdate)
          .eq('id', initialData.id)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert
        const newReview: ReviewInsert = {
          user_id: userId,
          tmdb_id: tmdbId,
          media_type: mediaType,
          rating: formData.rating,
          content: formData.content,
          is_spoiler: formData.isSpoiler,
        };
        const { error } = await supabase.from('reviews').insert(newReview);
        if (error) {
           if (error.code === '23505') { 
               throw new Error("You have already submitted a review for this item.");
           } else {
               throw error; 
           }
        }
      }
    },
    onSuccess: () => {
      toast({ title: `Review ${isEditing ? 'Updated' : 'Submitted'} Successfully!` });
      queryClient.invalidateQueries({ queryKey: ['reviews', tmdbId, mediaType] });
      onSubmitSuccess();
    },
    onError: (error: Error) => {
      console.error(`Error ${isEditing ? 'updating' : 'submitting'} review (mutation):`, error);
      setFormError(error.message || `Failed to ${isEditing ? 'update' : 'submit'} review.`);
      toast({ 
        variant: "destructive", 
        title: `${isEditing ? 'Update' : 'Submission'} Error`, 
        description: error.message || `Failed to ${isEditing ? 'update' : 'submit'} review.`
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation
    if (rating === undefined || rating < 1 || rating > 10) {
      setFormError("Rating must be between 1 and 10.");
      return;
    }
    if (!content.trim()) {
      setFormError("Review content cannot be empty.");
      return;
    }

    reviewMutation.mutate({ 
        rating: rating, 
        content: content.trim(), 
        isSpoiler: isSpoiler 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating Input */}
      <div className="space-y-2">
        <Label htmlFor="rating" className="text-gray-200">Your Rating (1-10)</Label>
        <Input
          id="rating"
          type="number"
          min={1}
          max={10}
          step={1}
          value={rating ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setRating(val === '' ? undefined : Number(val));
            setFormError(null);
          }}
          required
          className="w-24"
          disabled={reviewMutation.isPending}
        />
      </div>

      {/* Content Textarea */}
      <div className="space-y-2">
        <Label htmlFor="content" className="text-gray-200">Your Review</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => {
             setContent(e.target.value);
             setFormError(null);
          }}
          placeholder="Share your thoughts..."
          rows={6}
          required
          maxLength={2000}
          disabled={reviewMutation.isPending}
        />
        <p className="text-xs text-gray-400 text-right">{content.length} / 2000</p>
      </div>

      {/* Spoiler Switch */}
      <div className="flex items-center justify-between space-x-2 bg-gray-800 p-4 rounded-md border border-gray-700">
         <div>
            <Label htmlFor="isSpoiler" className="font-medium text-gray-200">Mark as Spoiler?</Label>
            <p className="text-xs text-gray-400">Hide your review content behind a warning.</p>
         </div>
        <Switch
          id="isSpoiler"
          checked={isSpoiler}
          onCheckedChange={setIsSpoiler}
          disabled={reviewMutation.isPending}
        />
      </div>

      {/* Error Display */}
      {formError && (
        <p className="text-sm text-red-500">{formError}</p>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={reviewMutation.isPending}>
          {reviewMutation.isPending ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Review' : 'Submit Review')}
        </Button>
      </div>
    </form>
  );
} 