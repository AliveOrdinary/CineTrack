'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Eye, Check } from 'lucide-react';
import { WatchedContentForm } from './WatchedContentForm';
import { getWatchedContent, type WatchedContentEntry, createClient } from '@/lib/supabase/client';

interface WatchedContentButtonProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  className?: string;
}

export function WatchedContentButton({
  tmdbId,
  mediaType,
  title,
  className,
}: WatchedContentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [watchedEntries, setWatchedEntries] = useState<WatchedContentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    if (user) {
      loadWatchedEntries();
    }
  }, [user, tmdbId, mediaType]);

  const loadWatchedEntries = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const entries = await getWatchedContent(user.id, tmdbId, mediaType);
      setWatchedEntries(entries || []);
    } catch (error) {
      console.error('Error loading watched content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setIsOpen(false);
    loadWatchedEntries(); // Refresh the entries
  };

  const isWatched = watchedEntries.length > 0;
  const latestEntry = watchedEntries[0]; // Most recent entry

  if (!user) {
    return (
      <Button variant="outline" disabled className={className}>
        <Eye className="mr-2 h-4 w-4" />
        Sign in to track
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isWatched ? 'default' : 'outline'}
          className={className}
          disabled={isLoading}
        >
          {isWatched ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Watched
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Mark as Watched
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isWatched ? 'Update Watch Entry' : 'Mark as Watched'}</DialogTitle>
        </DialogHeader>
        <WatchedContentForm
          tmdbId={tmdbId}
          mediaType={mediaType}
          title={title}
          existingEntry={latestEntry}
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
