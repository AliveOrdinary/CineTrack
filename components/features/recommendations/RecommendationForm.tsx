'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Rating } from '@/components/ui/rating';
import { 
  Send, 
  Heart, 
  Loader2, 
  UserPlus,
  Check,
  ChevronsUpDown,
  X,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CreateRecommendationInput,
  RECOMMENDATION_TAGS,
  RecommendationTag,
  getTagConfig,
  validatePersonalRating,
} from '@/types/recommendations';
import {
  createRecommendation,
  hasRecommended,
} from '@/lib/supabase/recommendations';

interface User {
  id: string;
  display_name: string;
  avatar_url?: string;
}

interface RecommendationFormProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  users: User[]; // Available users to recommend to
  trigger?: React.ReactNode;
  onRecommendationCreated?: () => void;
}

export function RecommendationForm({ 
  tmdbId, 
  mediaType, 
  title, 
  users,
  trigger,
  onRecommendationCreated
}: RecommendationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  
  // Form state
  const [message, setMessage] = useState('');
  const [personalRating, setPersonalRating] = useState<number | undefined>(undefined);
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedTags, setSelectedTags] = useState<RecommendationTag[]>([]);
  const [existingRecommendation, setExistingRecommendation] = useState<any>(null);

  // Check for existing recommendation when user is selected
  useEffect(() => {
    if (selectedUser) {
      checkExistingRecommendation();
    }
  }, [selectedUser, tmdbId, mediaType]);

  const checkExistingRecommendation = async () => {
    if (!selectedUser) return;
    
    try {
      const existing = await hasRecommended(tmdbId, mediaType, selectedUser.id);
      setExistingRecommendation(existing);
    } catch (error) {
      console.error('Error checking existing recommendation:', error);
    }
  };

  const handleTagToggle = (tag: RecommendationTag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.error('Please select a user to recommend to');
      return;
    }

    if (!message.trim()) {
      toast.error('Please add a message with your recommendation');
      return;
    }

    if (personalRating && !validatePersonalRating(personalRating)) {
      toast.error('Rating must be between 1 and 10');
      return;
    }

    setIsLoading(true);
    try {
      const recommendationData: CreateRecommendationInput = {
        tmdb_id: tmdbId,
        media_type: mediaType,
        recipient_id: selectedUser.id,
        message: message.trim(),
        personal_rating: personalRating,
        is_urgent: isUrgent,
        tags: selectedTags,
      };

      await createRecommendation(recommendationData);
      
      toast.success(`Recommendation sent to ${selectedUser.display_name}!`);
      resetForm();
      setIsOpen(false);
      onRecommendationCreated?.();
    } catch (error: any) {
      console.error('Error creating recommendation:', error);
      toast.error(error.message || 'Failed to send recommendation');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setMessage('');
    setPersonalRating(undefined);
    setIsUrgent(false);
    setSelectedTags([]);
    setExistingRecommendation(null);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Send className="h-4 w-4 mr-2" />
      Recommend
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
            <Heart className="h-5 w-5" />
            Recommend "{title}"
          </DialogTitle>
          <DialogDescription>
            Share this {mediaType === 'movie' ? 'movie' : 'TV show'} with someone you think would enjoy it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Choose Recipient
              </CardTitle>
              <CardDescription>
                Who would you like to recommend this to?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedUser ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedUser.avatar_url} />
                          <AvatarFallback>
                            {selectedUser.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {selectedUser.display_name}
                      </div>
                    ) : (
                      "Select user..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.display_name}
                            onSelect={() => {
                              setSelectedUser(user);
                              setUserSearchOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback>
                                  {user.display_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {user.display_name}
                            </div>
                            <Check
                              className={`ml-auto h-4 w-4 ${
                                selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {existingRecommendation && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    You already recommended this content to {selectedUser?.display_name}. 
                    Status: <Badge variant="secondary">{existingRecommendation.status}</Badge>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message */}
          <Card>
            <CardHeader>
              <CardTitle>Your Recommendation</CardTitle>
              <CardDescription>
                Why do you think they'd enjoy this?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell them why you think they'd love this..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {message.length}/500 characters
                </p>
              </div>

              {/* Personal Rating */}
              <div className="space-y-2">
                <Label>Your Rating (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Rating
                    value={personalRating || 0}
                    onChange={setPersonalRating}
                    size="sm"
                  />
                  <div className="text-sm text-muted-foreground">
                    {personalRating ? `${personalRating}/10` : 'Not rated'}
                  </div>
                </div>
              </div>

              {/* Urgent Flag */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Mark as Urgent
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    They'll be notified immediately about this recommendation
                  </p>
                </div>
                <Switch
                  checked={isUrgent}
                  onCheckedChange={setIsUrgent}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags (Optional)</CardTitle>
              <CardDescription>
                Add tags to help categorize your recommendation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(RECOMMENDATION_TAGS).map(([key, tag]) => {
                  const isSelected = selectedTags.includes(key as RecommendationTag);
                  return (
                    <Badge
                      key={key}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "" : "hover:bg-muted"
                      }`}
                      onClick={() => handleTagToggle(key as RecommendationTag)}
                    >
                      <span className="mr-1">{tag.emoji}</span>
                      {tag.label}
                    </Badge>
                  );
                })}
              </div>
              
              {selectedTags.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm">Selected Tags:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTags.map((tagKey) => {
                      const tag = getTagConfig(tagKey);
                      return (
                        <Badge key={tagKey} variant="secondary" className="flex items-center gap-1">
                          <span>{tag.emoji}</span>
                          <span>{tag.label}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 ml-1"
                            onClick={() => handleTagToggle(tagKey)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedUser || !message.trim() || isLoading || !!existingRecommendation}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Recommendation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}