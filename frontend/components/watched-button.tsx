'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, PlusIcon, CalendarIcon, StarIcon, XIcon, LogInIcon } from 'lucide-react';
import { format } from "date-fns";
import { createClient } from '@/lib/supabase/client';
import useUser from '@/hooks/useUser';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose
} from "@/components/ui/dialog";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MediaType } from '@/types/tmdb';
import { Database } from '@cinetrack/shared';

type WatchedContent = Database['public']['Tables']['watched_content']['Row'];
type WatchedContentInsert = Database['public']['Tables']['watched_content']['Insert'];

interface WatchedButtonProps {
  tmdbId: number;
  mediaType: MediaType;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}

export default function WatchedButton({
  tmdbId,
  mediaType,
  variant = "outline",
  size = "sm",
  className = "",
}: WatchedButtonProps) {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const router = useRouter();

  const [isWatched, setIsWatched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [watchedRecord, setWatchedRecord] = useState<WatchedContent | null>(null);
  
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const [watchedDate, setWatchedDate] = useState<Date | undefined>(new Date());
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [reviewText, setReviewText] = useState<string>('');

  const checkWatchedStatus = useCallback(async () => {
    if (!user) {
      setIsWatched(false);
      setWatchedRecord(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('watched_content')
        .select('*')
        .eq('user_id', user.id)
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)
        .maybeSingle();

      if (error) throw error;

      setIsWatched(!!data);
      setWatchedRecord(data);
      if (data) {
        setWatchedDate(data.watched_date ? new Date(data.watched_date) : new Date());
        setUserRating(data.user_rating ?? undefined);
        setReviewText(data.notes || '');
      } else {
        setWatchedDate(new Date());
        setUserRating(undefined);
        setReviewText('');
      }

    } catch (err) {
      console.error('Failed to fetch watched status', err);
      setIsWatched(false);
      setWatchedRecord(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, tmdbId, mediaType, supabase]);

  useEffect(() => {
    checkWatchedStatus();
  }, [checkWatchedStatus]);

  const handleAddWatched = async (details: { date: Date | undefined; rating: number | undefined; notes: string }) => {
    if (!user) return; 

    setIsUpdating(true);
    const previousState = isWatched;
    setIsWatched(true);

    try {
      const recordToUpsert: WatchedContentInsert = {
        user_id: user.id,
        tmdb_id: tmdbId,
        media_type: mediaType,
        watched_date: details.date?.toISOString() ?? new Date().toISOString(),
        user_rating: details.rating !== undefined && details.rating >= 1 && details.rating <= 10 ? details.rating : null,
        notes: details.notes,
      };

      const { error } = await supabase
        .from('watched_content')
        .upsert(recordToUpsert, { onConflict: 'user_id, tmdb_id, media_type' });

      if (error) throw error;

      await checkWatchedStatus();
      toast({ 
        title: previousState ? "Watched Entry Updated" : "Added to Watched History",
        description: `Rating: ${details.rating || 'None'}, Watched: ${format(details.date || new Date(), "PPP")}` 
      });
      setIsDetailsDialogOpen(false);

    } catch (err: any) {
      console.error("Error adding/updating watched record:", err);
      toast({ variant: "destructive", title: "Error", description: err.message || "Could not save watched information." });
      setIsWatched(previousState);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveWatched = async () => {
    if (!user || !watchedRecord) return;

    setIsUpdating(true);
    const previousState = isWatched;
    setIsWatched(false);

    try {
      const { error } = await supabase
        .from('watched_content')
        .delete()
        .match({ id: watchedRecord.id, user_id: user.id });

      if (error) throw error;

      setWatchedRecord(null);
      toast({ description: "Removed from Watched History" });
      setWatchedDate(new Date());
      setUserRating(undefined);
      setReviewText('');

    } catch (err: any) {
      console.error("Error removing from watched:", err);
      toast({ variant: "destructive", title: "Error", description: err.message || "Could not remove from watched history." });
      setIsWatched(previousState);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClick = () => {
    if (!user) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (isUpdating || isLoading) return;

    if (isWatched) {
      if (watchedRecord) {
        setWatchedDate(watchedRecord.watched_date ? new Date(watchedRecord.watched_date) : new Date());
        setUserRating(watchedRecord.user_rating ?? undefined);
        setReviewText(watchedRecord.notes || '');
      } else {
        setWatchedDate(new Date());
        setUserRating(undefined);
        setReviewText('');
      }
      setIsDetailsDialogOpen(true);
    } else {
      setWatchedDate(new Date());
      setUserRating(undefined);
      setReviewText('');
      setIsDetailsDialogOpen(true);
    }
  };

  const handleSaveDetails = () => {
    if (userRating !== undefined && (userRating < 1 || userRating > 10)) {
      toast({ variant: "destructive", title: "Invalid Rating", description: "Rating must be between 1 and 10." });
      return;
    }
    handleAddWatched({ date: watchedDate, rating: userRating, notes: reviewText });
  };

  const handleRemoveFromDialog = () => {
    setIsDetailsDialogOpen(false);
    handleRemoveWatched();
  };

  return (
    <>
      <Button
        variant={isWatched ? "secondary" : variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={isLoading || isUpdating}
        aria-label={isWatched ? "Edit Watched Entry" : "Mark as Watched"}
      >
        {isLoading ? (
          <span className="animate-pulse">...</span>
        ) : isWatched ? (
          <>
            <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
            <span>Watched</span>
          </>
        ) : (
          <>
            <PlusIcon className="mr-2 h-4 w-4" />
            <span>Mark as Watched</span>
          </>
        )}
        {isUpdating && <span className="ml-2 animate-pulse">...</span>}
      </Button>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{watchedRecord ? 'Edit Watched Entry' : 'Add to Watched History'}</DialogTitle>
            <DialogDescription>
              Update the date, rating, and notes for this item.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="watchedDate-dialog" className="text-right col-span-1">
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal col-span-3",
                      !watchedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedDate ? format(watchedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watchedDate}
                    onSelect={(date: Date | undefined) => { setWatchedDate(date); }}
                    initialFocus
                    disabled={(date: Date) => date > new Date() || date < new Date("1900-01-01")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating-dialog" className="text-right col-span-1">
                Rating
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="rating-dialog"
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={userRating ?? ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        setUserRating(val === '' ? undefined : Number(val));
                    }}
                    className="w-20"
                    placeholder="-"
                  />
                  <span className="text-sm text-muted-foreground">/ 10</span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="review-notes-dialog" className="text-right col-span-1 pt-2">
                Notes
              </Label>
              <Textarea
                id="review-notes-dialog"
                placeholder="Add your thoughts... (optional)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="col-span-3 min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className='justify-between'>
            {watchedRecord ? (
                <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleRemoveFromDialog} 
                    disabled={isUpdating}
                    className='mr-auto'
                 >
                    <XIcon className="mr-2 h-4 w-4"/>
                    Remove Entry
                </Button>
             ) : ( <div></div> )}
             
            <div>
                <DialogClose asChild>
                  <Button type="button" variant="outline" className='mr-2'>
                      Cancel
                  </Button>
                </DialogClose>
                <Button type="button" onClick={handleSaveDetails} disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : watchedRecord ? 'Update Entry' : 'Save to Watched'}
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 