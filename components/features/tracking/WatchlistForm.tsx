'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Flag } from 'lucide-react';
import { addToWatchlist, updateWatchlistEntry, type WatchlistEntry } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface WatchlistFormProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  existingEntry?: WatchlistEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const priorityOptions = [
  { value: 0, label: 'No Priority', icon: null },
  { value: 1, label: 'Low Priority', icon: '🔵' },
  { value: 2, label: 'Medium Priority', icon: '🟡' },
  { value: 3, label: 'High Priority', icon: '🔴' },
];

export function WatchlistForm({
  tmdbId,
  mediaType,
  title,
  existingEntry,
  onSuccess,
  onCancel,
}: WatchlistFormProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get user on component mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Form state
  const [priority, setPriority] = useState(existingEntry?.priority || 0);
  const [notes, setNotes] = useState(existingEntry?.notes || '');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>(
    existingEntry?.visibility || 'public'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to add to watchlist');
      return;
    }

    setIsLoading(true);

    try {
      const entryData = {
        user_id: user.id,
        tmdb_id: tmdbId,
        media_type: mediaType,
        priority,
        notes: notes.trim() || undefined,
        visibility,
      };

      if (existingEntry) {
        await updateWatchlistEntry(existingEntry.id!, entryData);
        toast.success('Watchlist entry updated!');
      } else {
        await addToWatchlist(entryData);
        toast.success(`${title} added to watchlist!`);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving watchlist entry:', error);
      toast.error('Failed to save watchlist entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select value={priority.toString()} onValueChange={value => setPriority(parseInt(value))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map(option => (
              <SelectItem key={option.value} value={option.value.toString()}>
                <div className="flex items-center gap-2">
                  {option.icon && <span>{option.icon}</span>}
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Why do you want to watch this? Any specific thoughts?"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">Who can see this?</Label>
        <Select
          value={visibility}
          onValueChange={(value: 'public' | 'followers' | 'private') => setVisibility(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Public - Everyone can see
              </div>
            </SelectItem>
            <SelectItem value="followers">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Followers - Only people you follow
              </div>
            </SelectItem>
            <SelectItem value="private">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                Private - Only you can see
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : existingEntry ? 'Update Entry' : 'Add to Watchlist'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
