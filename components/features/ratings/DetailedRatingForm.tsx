'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Rating } from '@/components/ui/rating';
import { 
  Star, 
  Heart, 
  Loader2, 
  BarChart3,
  MessageSquare,
  Save,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DetailedRating,
  DetailedRatingInput,
  RATING_CATEGORIES,
  EMOTIONAL_REACTIONS,
  RatingCategory,
  EmotionalReaction,
  calculateOverallRating,
  formatRatingDisplay,
  getRatingColor,
} from '@/types/detailed-ratings';
import {
  upsertDetailedRating,
  getDetailedRating,
  deleteDetailedRating,
} from '@/lib/supabase/detailed-ratings';

interface DetailedRatingFormProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  trigger?: React.ReactNode;
  onRatingChange?: (rating: DetailedRating | null) => void;
}

export function DetailedRatingForm({ 
  tmdbId, 
  mediaType, 
  title, 
  trigger,
  onRatingChange 
}: DetailedRatingFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [existingRating, setExistingRating] = useState<DetailedRating | null>(null);

  // Rating state
  const [categoryRatings, setCategoryRatings] = useState<Partial<Record<RatingCategory, number>>>({});
  const [emotionalReactions, setEmotionalReactions] = useState<Record<EmotionalReaction, boolean>>({
    made_me_cry: false,
    made_me_laugh: false,
    was_scary: false,
    was_inspiring: false,
    was_thought_provoking: false,
    was_nostalgic: false,
    was_romantic: false,
    was_intense: false,
  });
  const [notes, setNotes] = useState('');

  // Load existing rating when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadExistingRating();
    }
  }, [isOpen, tmdbId, mediaType]);

  const loadExistingRating = async () => {
    setIsLoading(true);
    try {
      const rating = await getDetailedRating(tmdbId, mediaType);
      setExistingRating(rating);
      
      if (rating) {
        // Populate form with existing data
        setCategoryRatings({
          acting: rating.acting_rating || undefined,
          story: rating.story_rating || undefined,
          directing: rating.directing_rating || undefined,
          cinematography: rating.cinematography_rating || undefined,
          music: rating.music_rating || undefined,
          production: rating.production_rating || undefined,
        });
        
        setEmotionalReactions({
          made_me_cry: rating.made_me_cry,
          made_me_laugh: rating.made_me_laugh,
          was_scary: rating.was_scary,
          was_inspiring: rating.was_inspiring,
          was_thought_provoking: rating.was_thought_provoking,
          was_nostalgic: rating.was_nostalgic,
          was_romantic: rating.was_romantic,
          was_intense: rating.was_intense,
        });
        
        setNotes(rating.notes || '');
      }
    } catch (error) {
      console.error('Error loading existing rating:', error);
      toast.error('Failed to load existing rating');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryRatingChange = (category: RatingCategory, rating: number) => {
    setCategoryRatings(prev => ({
      ...prev,
      [category]: rating,
    }));
  };

  const handleEmotionalReactionChange = (reaction: EmotionalReaction, checked: boolean) => {
    setEmotionalReactions(prev => ({
      ...prev,
      [reaction]: checked,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const ratingData: DetailedRatingInput = {
        tmdb_id: tmdbId,
        media_type: mediaType,
        acting_rating: categoryRatings.acting,
        story_rating: categoryRatings.story,
        directing_rating: categoryRatings.directing,
        cinematography_rating: categoryRatings.cinematography,
        music_rating: categoryRatings.music,
        production_rating: categoryRatings.production,
        ...emotionalReactions,
        notes: notes.trim() || undefined,
      };

      const savedRating = await upsertDetailedRating(ratingData);
      
      toast.success(existingRating ? 'Rating updated successfully' : 'Rating saved successfully');
      setExistingRating(savedRating);
      onRatingChange?.(savedRating);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving rating:', error);
      toast.error('Failed to save rating');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDetailedRating(tmdbId, mediaType);
      
      toast.success('Rating deleted successfully');
      setExistingRating(null);
      resetForm();
      onRatingChange?.(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error deleting rating:', error);
      toast.error('Failed to delete rating');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setCategoryRatings({});
    setEmotionalReactions({
      made_me_cry: false,
      made_me_laugh: false,
      was_scary: false,
      was_inspiring: false,
      was_thought_provoking: false,
      was_nostalgic: false,
      was_romantic: false,
      was_intense: false,
    });
    setNotes('');
  };

  const overallRating = calculateOverallRating(categoryRatings);
  const hasAnyRating = Object.values(categoryRatings).some(rating => rating && rating > 0);
  const hasEmotionalReactions = Object.values(emotionalReactions).some(Boolean);

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <BarChart3 className="h-4 w-4 mr-2" />
      {existingRating ? 'Edit Detailed Rating' : 'Add Detailed Rating'}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Detailed Rating
          </DialogTitle>
          <DialogDescription>
            Rate different aspects of "{title}" and share your emotional reactions
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Rating Display */}
            {overallRating && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Overall Rating</h4>
                      <p className="text-sm text-muted-foreground">
                        Calculated from your category ratings
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getRatingColor(overallRating)}`}>
                        {formatRatingDisplay(overallRating)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Category Ratings
                </CardTitle>
                <CardDescription>
                  Rate different aspects of the content (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(RATING_CATEGORIES).map(([key, category]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{category.icon}</span>
                        <div>
                          <Label className="font-medium">{category.label}</Label>
                          <p className="text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {categoryRatings[key as RatingCategory] 
                          ? `${categoryRatings[key as RatingCategory]}/10`
                          : 'Not rated'
                        }
                      </div>
                    </div>
                    <Rating
                      value={categoryRatings[key as RatingCategory] || 0}
                      onChange={(rating) => handleCategoryRatingChange(key as RatingCategory, rating)}
                      size="sm"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Emotional Reactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Emotional Reactions
                </CardTitle>
                <CardDescription>
                  How did this content make you feel? (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(EMOTIONAL_REACTIONS).map(([key, reaction]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{reaction.emoji}</span>
                        <Label className="text-sm">{reaction.label}</Label>
                      </div>
                      <Switch
                        checked={emotionalReactions[key as EmotionalReaction]}
                        onCheckedChange={(checked) => 
                          handleEmotionalReactionChange(key as EmotionalReaction, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notes
                </CardTitle>
                <CardDescription>
                  Additional thoughts or comments (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share your thoughts about this content..."
                  rows={3}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {notes.length}/1000 characters
                </p>
              </CardContent>
            </Card>

            {/* Active Reactions Summary */}
            {hasEmotionalReactions && (
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-3">Your Reactions</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(emotionalReactions)
                      .filter(([_, active]) => active)
                      .map(([key, _]) => {
                        const reaction = EMOTIONAL_REACTIONS[key as EmotionalReaction];
                        return (
                          <Badge key={key} variant="secondary" className="flex items-center gap-1">
                            <span>{reaction.emoji}</span>
                            <span className="text-xs">{reaction.label}</span>
                          </Badge>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div>
              {existingRating && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasAnyRating || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {existingRating ? 'Update' : 'Save'} Rating
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}