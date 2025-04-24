"use client";

import { useState, useEffect, useMemo } from 'react';
import { PlusIcon, CheckIcon, Loader2 } from 'lucide-react';
import WithAuth from '@/components/with-auth';
import { createClient } from '@/lib/supabase/client';
import useUser from '@/hooks/useUser';
import { MediaType } from '@cinetrack/shared/types';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  tmdbId: number;
  mediaType: Extract<MediaType, 'movie' | 'tv'>;
  title: string;
  className?: string;
}

/**
 * Button component for adding/removing content to watchlist
 * Uses WithAuth to handle authentication status
 */
export default function WatchlistButton({
  tmdbId,
  mediaType,
  title,
  className = '',
}: WatchlistButtonProps) {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [watchlistItemId, setWatchlistItemId] = useState<string | null>(null);

  useEffect(() => {
    const checkWatchlist = async () => {
      if (!user) {
        setIsInWatchlist(false);
        setWatchlistItemId(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('watchlist_content')
          .select('id')
          .eq('user_id', user.id)
          .eq('tmdb_id', tmdbId)
          .eq('media_type', mediaType)
          .maybeSingle();

        if (error) {
          console.error('Error checking watchlist status:', error);
          toast({ 
            variant: "destructive",
            title: "Watchlist Error",
            description: "Could not check watchlist status",
           });
        } else {
          setIsInWatchlist(!!data);
          setWatchlistItemId(data?.id || null);
        }
      } catch (err) {
        console.error('Failed to check watchlist status:', err);
        toast({
          variant: "destructive",
          title: "Watchlist Error",
          description: "Failed to check watchlist status",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkWatchlist();
  }, [user, tmdbId, mediaType, supabase, toast]);

  const handleWatchlistClick = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (isInWatchlist && watchlistItemId) {
        const { error } = await supabase
          .from('watchlist_content')
          .delete()
          .eq('id', watchlistItemId);

        if (error) throw error;
        setIsInWatchlist(false);
        setWatchlistItemId(null);
        toast({ 
          title: "Watchlist Update",
          description: `Removed "${title}" from watchlist`,
         });
      } else {
        const { data, error } = await supabase
          .from('watchlist_content')
          .insert({
            user_id: user.id,
            tmdb_id: tmdbId,
            media_type: mediaType,
            added_date: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) throw error;
        setIsInWatchlist(true);
        setWatchlistItemId(data?.id || null);
        toast({ 
          title: "Watchlist Update",
          description: `Added "${title}" to watchlist`,
        });
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast({ 
        variant: "destructive",
        title: "Watchlist Error",
        description: `Failed to update watchlist for "${title}"`,
       });
    } finally {
      setIsLoading(false);
    }
  };

  const WatchlistButtonContent = () => (
    <Button
      variant={isInWatchlist ? "default" : "secondary"}
      size="sm"
      className={cn("gap-1", className)}
      onClick={handleWatchlistClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isInWatchlist ? (
        <>
          <CheckIcon className="h-4 w-4" />
          <span>In Watchlist</span>
        </>
      ) : (
        <>
          <PlusIcon className="h-4 w-4" />
          <span>Add to Watchlist</span>
        </>
      )}
    </Button>
  );

  const PublicButtonView = () => (
    <Button
      variant="secondary"
      size="sm"
      className={cn("gap-1", className)}
    >
      <PlusIcon className="h-4 w-4" />
      <span>Add to Watchlist</span>
    </Button>
  );

  return (
    <WithAuth
      showPrompt="modal"
      promptMessage={`Sign in to add "${title}" to your watchlist`}
      fallback={<PublicButtonView />}
    >
      <WatchlistButtonContent />
    </WithAuth>
  );
} 