'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Rating } from '@/components/ui/rating';
import { 
  Star, 
  MessageSquare, 
  Edit, 
  Trash2, 
  Loader2,
  BarChart3,
  Heart,
  Calendar,
  Eye,
  Save,
  Zap,
  Microscope
} from 'lucide-react';
import { toast } from 'sonner';
import {
  EnhancedReview,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewType,
  WatchMethod,
  RATING_CATEGORIES,
  EMOTIONAL_REACTIONS,
  REVIEW_TYPE_CONFIG,
  WATCH_METHOD_CONFIG,
  validateReviewInput,
  calculateWeightedRating,
  getEmotionalReactionSummary
} from '@/types/enhanced-reviews';
import {
  createEnhancedReview,
  updateEnhancedReview,
  deleteEnhancedReview,
  getUserReviewForContent
} from '@/lib/supabase/enhanced-reviews';

interface EnhancedReviewButtonProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  className?: string;
}

export function EnhancedReviewButton({ 
  tmdbId, 
  mediaType, 
  title, 
  className 
}: EnhancedReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingReview, setExistingReview] = useState<EnhancedReview | null>(null);
  const [activeTab, setActiveTab] = useState<ReviewType>('full');

  // Form state
  const [form, setForm] = useState<CreateReviewInput>({
    tmdb_id: tmdbId,
    media_type: mediaType,
    title: '',
    content: '',
    overall_rating: undefined,
    
    // Category ratings
    acting_rating: undefined,
    story_rating: undefined,
    directing_rating: undefined,
    cinematography_rating: undefined,
    music_rating: undefined,
    production_rating: undefined,
    
    // Emotional reactions
    emotional_reactions: {},
    
    // Metadata
    contains_spoilers: false,
    is_anonymous: false,
    review_type: 'full',
    visibility: 'public',
    
    // Watch context
    watched_date: undefined,
    rewatch_number: 1,
    watch_method: undefined,
  });

  useEffect(() => {
    if (isOpen) {
      loadExistingReview();
    }
  }, [isOpen]);

  const loadExistingReview = async () => {
    setIsLoading(true);
    try {
      const review = await getUserReviewForContent(tmdbId, mediaType);
      setExistingReview(review);
      
      if (review) {
        setForm({
          tmdb_id: review.tmdb_id,
          media_type: review.media_type,
          title: review.title || '',
          content: review.content || '',
          overall_rating: review.overall_rating,
          
          acting_rating: review.acting_rating,
          story_rating: review.story_rating,
          directing_rating: review.directing_rating,
          cinematography_rating: review.cinematography_rating,
          music_rating: review.music_rating,
          production_rating: review.production_rating,
          
          emotional_reactions: {
            made_me_cry: review.made_me_cry,
            made_me_laugh: review.made_me_laugh,
            was_scary: review.was_scary,
            was_inspiring: review.was_inspiring,
            was_thought_provoking: review.was_thought_provoking,
            was_nostalgic: review.was_nostalgic,
            was_romantic: review.was_romantic,
            was_intense: review.was_intense,
            was_confusing: review.was_confusing,
            was_boring: review.was_boring,
          },
          
          contains_spoilers: review.contains_spoilers,
          is_anonymous: review.is_anonymous,
          review_type: review.review_type,
          visibility: review.visibility,
          
          watched_date: review.watched_date,
          rewatch_number: review.rewatch_number,
          watch_method: review.watch_method,
        });
        
        setActiveTab(review.review_type);
      } else {
        // Reset form for new review
        setForm(prev => ({
          ...prev,
          title: '',
          content: '',
          overall_rating: undefined,
          review_type: 'full',
        }));
        setActiveTab('full');
      }
    } catch (error) {
      console.error('Error loading review:', error);
      toast.error('Failed to load existing review');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const reviewData = { ...form, review_type: activeTab };
    
    // Validate input
    const validation = validateReviewInput(reviewData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    setIsSaving(true);
    try {
      if (existingReview) {
        const updateData: UpdateReviewInput = { id: existingReview.id, ...reviewData };
        await updateEnhancedReview(updateData);
        toast.success('Review updated successfully');
      } else {
        await createEnhancedReview(reviewData);
        toast.success('Review published successfully');
      }
      
      setIsOpen(false);
      await loadExistingReview(); // Reload to get updated data
    } catch (error) {
      console.error('Error saving review:', error);
      toast.error('Failed to save review');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;

    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteEnhancedReview(existingReview.id);
      setExistingReview(null);
      setIsOpen(false);
      toast.success('Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const updateForm = (updates: Partial<CreateReviewInput>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const updateEmotionalReaction = (key: string, value: boolean) => {
    setForm(prev => ({
      ...prev,
      emotional_reactions: {
        ...prev.emotional_reactions,
        [key]: value
      }
    }));
  };

  const calculateOverallFromCategories = () => {
    const ratings = RATING_CATEGORIES.map(cat => form[cat.key]).filter(Boolean);
    if (ratings.length === 0) return null;
    return Math.round(ratings.reduce((sum, rating) => sum + rating!, 0) / ratings.length);
  };

  const hasAnyContent = () => {
    const hasRating = form.overall_rating || RATING_CATEGORIES.some(cat => form[cat.key]);
    const hasText = form.content?.trim() || form.title?.trim();
    const hasEmotions = Object.values(form.emotional_reactions || {}).some(Boolean);
    return hasRating || hasText || hasEmotions;
  };

  const getActiveReactions = () => {
    if (!form.emotional_reactions) return [];
    return EMOTIONAL_REACTIONS.filter(reaction => form.emotional_reactions![reaction.key]);
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
      
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? 'Edit Review' : 'Write Review'} for "{title}"
          </DialogTitle>
          <DialogDescription>
            Share your thoughts with quick ratings, full reviews, or detailed analysis
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading review...
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReviewType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick
              </TabsTrigger>
              <TabsTrigger value="full" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Full Review
              </TabsTrigger>
              <TabsTrigger value="detailed" className="flex items-center gap-2">
                <Microscope className="h-4 w-4" />
                Detailed Analysis
              </TabsTrigger>
            </TabsList>

            {/* Quick Review Tab */}
            <TabsContent value="quick" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Review</CardTitle>
                  <CardDescription>Just a rating and optional brief thoughts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Overall Rating *</Label>
                    <Rating
                      value={form.overall_rating || 0}
                      onChange={(value) => updateForm({ overall_rating: value })}
                      size="lg"
                      className="mt-2"
                    />
                    {form.overall_rating && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {form.overall_rating}/10 stars
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Quick Thoughts (Optional)</Label>
                    <Textarea
                      value={form.content || ''}
                      onChange={(e) => updateForm({ content: e.target.value })}
                      placeholder="What did you think? (optional)"
                      rows={3}
                      maxLength={500}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(form.content || '').length}/500 characters
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Full Review Tab */}
            <TabsContent value="full" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Full Review</CardTitle>
                  <CardDescription>Share your detailed thoughts and rating</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Review Title (Optional)</Label>
                    <Input
                      value={form.title || ''}
                      onChange={(e) => updateForm({ title: e.target.value })}
                      placeholder="Give your review a title..."
                      maxLength={200}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Overall Rating *</Label>
                    <Rating
                      value={form.overall_rating || 0}
                      onChange={(value) => updateForm({ overall_rating: value })}
                      size="lg"
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>Your Review *</Label>
                    <Textarea
                      value={form.content || ''}
                      onChange={(e) => updateForm({ content: e.target.value })}
                      placeholder="Share your thoughts about this movie/show..."
                      rows={8}
                      maxLength={5000}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(form.content || '').length}/5000 characters
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Detailed Analysis Tab */}
            <TabsContent value="detailed" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Review Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Review Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Review Title</Label>
                      <Input
                        value={form.title || ''}
                        onChange={(e) => updateForm({ title: e.target.value })}
                        placeholder="Review title..."
                        maxLength={200}
                      />
                    </div>
                    
                    <div>
                      <Label>Overall Rating *</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Rating
                          value={form.overall_rating || 0}
                          onChange={(value) => updateForm({ overall_rating: value })}
                          size="lg"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateForm({ overall_rating: calculateOverallFromCategories() })}
                          disabled={!calculateOverallFromCategories()}
                        >
                          Auto-calculate
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Review Content *</Label>
                      <Textarea
                        value={form.content || ''}
                        onChange={(e) => updateForm({ content: e.target.value })}
                        placeholder="Share your detailed thoughts..."
                        rows={6}
                        maxLength={5000}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Category Ratings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Category Ratings
                    </CardTitle>
                    <CardDescription>Rate different aspects (optional)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {RATING_CATEGORIES.map((category) => (
                      <div key={category.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">{category.label}</Label>
                          <span className="text-xs text-muted-foreground">
                            {form[category.key] ? `${form[category.key]}/10` : 'Not rated'}
                          </span>
                        </div>
                        <Rating
                          value={form[category.key] || 0}
                          onChange={(value) => updateForm({ [category.key]: value })}
                          size="sm"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Emotional Reactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Emotional Reactions
                  </CardTitle>
                  <CardDescription>How did this content make you feel?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {EMOTIONAL_REACTIONS.map((reaction) => (
                      <div key={reaction.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={reaction.key}
                          checked={form.emotional_reactions?.[reaction.key] || false}
                          onCheckedChange={(checked) => 
                            updateEmotionalReaction(reaction.key, checked as boolean)
                          }
                        />
                        <Label htmlFor={reaction.key} className="text-sm flex items-center gap-1">
                          <span>{reaction.emoji}</span>
                          <span>{reaction.label}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  {getActiveReactions().length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-sm font-medium">Active Reactions:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getActiveReactions().map((reaction) => (
                          <Badge key={reaction.key} variant="secondary">
                            {reaction.emoji} {reaction.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Common Settings for All Types */}
            <Card>
              <CardHeader>
                <CardTitle>Review Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Visibility</Label>
                    <Select
                      value={form.visibility}
                      onValueChange={(value: 'public' | 'followers' | 'private') =>
                        updateForm({ visibility: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Public - Anyone can see
                          </div>
                        </SelectItem>
                        <SelectItem value="followers">Followers only</SelectItem>
                        <SelectItem value="private">Private - Only you</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>When did you watch this?</Label>
                    <Input
                      type="date"
                      value={form.watched_date || ''}
                      onChange={(e) => updateForm({ watched_date: e.target.value || undefined })}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="spoilers"
                      checked={form.contains_spoilers}
                      onCheckedChange={(checked) =>
                        updateForm({ contains_spoilers: checked as boolean })
                      }
                    />
                    <Label htmlFor="spoilers">Contains spoilers</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="anonymous"
                      checked={form.is_anonymous}
                      onCheckedChange={(checked) =>
                        updateForm({ is_anonymous: checked as boolean })
                      }
                    />
                    <Label htmlFor="anonymous">Post anonymously</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4">
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
                <Button 
                  onClick={handleSave} 
                  disabled={!hasAnyContent() || isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {existingReview ? 'Update Review' : 'Publish Review'}
                </Button>
              </div>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}