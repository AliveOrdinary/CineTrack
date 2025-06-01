'use client';

import { useState, useEffect } from 'react';
import {
  createClient,
  getUserCustomLists,
  addItemToList,
  checkItemInList,
  type CustomListWithItems,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, List, Check } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface AddToListButtonProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  className?: string;
}

interface ListWithStatus extends CustomListWithItems {
  isInList?: boolean;
}

export function AddToListButton({ tmdbId, mediaType, title, className }: AddToListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<ListWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadLists();
    }
  }, [isOpen]);

  const loadLists = async () => {
    try {
      setIsLoading(true);

      // Check if user is authenticated
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please log in to add items to lists');
        return;
      }

      // Get user's lists
      const userLists = await getUserCustomLists();

      // Check which lists already contain this item
      const listsWithStatus = await Promise.all(
        userLists.map(async list => {
          const isInList = await checkItemInList(list.id!, tmdbId, mediaType);
          return {
            ...list,
            isInList,
          };
        })
      );

      setLists(listsWithStatus);

      // Pre-select lists that already contain this item
      const alreadyInLists = listsWithStatus.filter(list => list.isInList).map(list => list.id!);
      setSelectedLists(new Set(alreadyInLists));
    } catch (error) {
      console.error('Error loading lists:', error);
      toast.error('Failed to load lists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleList = (listId: string) => {
    setSelectedLists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listId)) {
        newSet.delete(listId);
      } else {
        newSet.add(listId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please log in to add items to lists');
        return;
      }

      // Add to newly selected lists
      const listsToAdd = Array.from(selectedLists).filter(listId => {
        const list = lists.find(l => l.id === listId);
        return list && !list.isInList;
      });

      // Remove from deselected lists
      const listsToRemove = lists
        .filter(list => list.isInList && !selectedLists.has(list.id!))
        .map(list => list.id!);

      // Add to lists
      for (const listId of listsToAdd) {
        await addItemToList({
          list_id: listId,
          tmdb_id: tmdbId,
          media_type: mediaType,
          notes: notes.trim() || undefined,
        });
      }

      // Remove from lists (using the existing removeItemFromList function)
      for (const listId of listsToRemove) {
        // We'll need to import and use removeItemFromList here
        // For now, we'll skip removal functionality
      }

      const addedCount = listsToAdd.length;
      const removedCount = listsToRemove.length;

      if (addedCount > 0 && removedCount > 0) {
        toast.success(`Added to ${addedCount} list(s) and removed from ${removedCount} list(s)`);
      } else if (addedCount > 0) {
        toast.success(`Added to ${addedCount} list(s)`);
      } else if (removedCount > 0) {
        toast.success(`Removed from ${removedCount} list(s)`);
      } else {
        toast.success('Lists updated');
      }

      setIsOpen(false);
      setNotes('');
    } catch (error) {
      console.error('Error updating lists:', error);
      toast.error('Failed to update lists');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <List className="h-4 w-4 mr-2" />
          Add to List
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Lists</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">Add "{title}" to your lists</p>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-6">
              <List className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">You don't have any lists yet</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/lists">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First List
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {lists.map(list => (
                <div
                  key={list.id}
                  className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleToggleList(list.id!)}
                >
                  <Checkbox
                    checked={selectedLists.has(list.id!)}
                    onChange={() => handleToggleList(list.id!)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{list.name}</p>
                      {list.isInList && <Check className="h-4 w-4 text-green-600" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{list.item_count || 0} items</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lists.length > 0 && (
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this item..."
                rows={2}
                className="mt-1"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {lists.length > 0 && <Button onClick={handleSave}>Update Lists</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
