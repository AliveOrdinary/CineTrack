'use client';

import { useState, useEffect } from 'react';
import {
  createClient,
  getUserReview,
  createReview,
  updateReview,
  deleteReview,
  type Review,
} from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Edit, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Rating } from '@/components/ui/rating';

interface ReviewButtonProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  className?: string;
}

export function ReviewButton({ tmdbId, mediaType, title, className }: ReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    content: '',
    rating: 0,
    is_spoiler: false,
    is_anonymous: false,
    visibility: 'public' as 'public' | 'followers' | 'private',
  });

  useEffect(() => {
    if (isOpen) {
      loadExistingReview();
    }
  }, [isOpen]);

  const loadExistingReview = async () => {
    try {
      setIsLoading(true);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please log in to write reviews');
        return;
      }

      const review = await getUserReview(user.id, tmdbId, mediaType);

      if (review) {
        setExistingReview(review);
        setForm({
          content: review.content,
          rating: review.rating || 0,
          is_spoiler: review.is_spoiler || false,
          is_anonymous: review.is_anonymous || false,
          visibility: review.visibility || 'public',
        });
      } else {
        setExistingReview(null);
        setForm({
          content: '',
          rating: 0,
          is_spoiler: false,
          is_anonymous: false,
          visibility: 'public',
        });
      }
    } catch (error) {
      console.error('Error loading review:', error);
      toast.error('Failed to load review');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!form.content.trim()) {
        toast.error('Please write a review');
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please log in to write reviews');
        return;
      }

      const reviewData = {
        user_id: user.id,
        tmdb_id: tmdbId,
        media_type: mediaType,
        content: form.content.trim(),
        rating: form.rating > 0 ? form.rating : undefined,
        is_spoiler: form.is_spoiler,
        is_anonymous: form.is_anonymous,
        visibility: form.visibility,
      };

      if (existingReview) {
        await updateReview(existingReview.id!, reviewData);
        toast.success('Review updated successfully');
      } else {
        await createReview(reviewData);
        toast.success('Review published successfully');
      }

      setIsOpen(false);
      // Reload the review to get updated data
      await loadExistingReview();
    } catch (error) {
      console.error('Error saving review:', error);
      toast.error('Failed to save review');
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;

    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteReview(existingReview.id!);
      setExistingReview(null);
      setForm({
        content: '',
        rating: 0,
        is_spoiler: false,
        is_anonymous: false,
        visibility: 'public',
      });
      setIsOpen(false);
      toast.success('Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={existingReview ? 'outline' : 'default'} className={className}>
          {existingReview ? (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit Review
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4 mr-2" />
              Write Review
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? 'Edit Review' : 'Write Review'} for "{title}"
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-32 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Rating */}
            <div>
              <Label>Rating (Optional)</Label>
              <div className="mt-2">
                <Rating
                  value={form.rating}
                  onChange={value => setForm(prev => ({ ...prev, rating: value }))}
                  size="lg"
                />
                {form.rating > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">{form.rating}/10 stars</p>
                )}
              </div>
            </div>

            {/* Review Content */}
            <div>
              <Label htmlFor="content">Review *</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your thoughts about this movie/show..."
                rows={8}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.content.length}/2000 characters
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="spoiler"
                  checked={form.is_spoiler}
                  onCheckedChange={checked =>
                    setForm(prev => ({ ...prev, is_spoiler: checked as boolean }))
                  }
                />
                <Label htmlFor="spoiler" className="text-sm">
                  This review contains spoilers
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={form.is_anonymous}
                  onCheckedChange={checked =>
                    setForm(prev => ({ ...prev, is_anonymous: checked as boolean }))
                  }
                />
                <Label htmlFor="anonymous" className="text-sm">
                  Post anonymously
                </Label>
              </div>

              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={form.visibility}
                  onValueChange={(value: 'public' | 'followers' | 'private') =>
                    setForm(prev => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can see this review</SelectItem>
                    <SelectItem value="followers">
                      Followers - Only your followers can see this review
                    </SelectItem>
                    <SelectItem value="private">Private - Only you can see this review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <div>
                {existingReview && (
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Review
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {existingReview ? 'Update Review' : 'Publish Review'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
