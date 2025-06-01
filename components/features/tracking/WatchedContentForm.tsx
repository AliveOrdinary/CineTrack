"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Rating } from "@/components/ui/rating"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Eye, EyeOff } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { addWatchedContent, updateWatchedContent, type WatchedContentEntry } from "@/lib/supabase/client"
import { toast } from "sonner"

interface WatchedContentFormProps {
  tmdbId: number
  mediaType: 'movie' | 'tv'
  title: string
  existingEntry?: WatchedContentEntry
  onSuccess?: () => void
  onCancel?: () => void
}

export function WatchedContentForm({
  tmdbId,
  mediaType,
  title,
  existingEntry,
  onSuccess,
  onCancel
}: WatchedContentFormProps) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Get user on component mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])
  
  // Form state
  const [watchedDate, setWatchedDate] = useState<Date>(
    existingEntry?.watched_date ? new Date(existingEntry.watched_date) : new Date()
  )
  const [rating, setRating] = useState(existingEntry?.user_rating || 0)
  const [isRewatch, setIsRewatch] = useState(existingEntry?.is_rewatch || false)
  const [rewatchCount, setRewatchCount] = useState(existingEntry?.rewatch_count || 0)
  const [notes, setNotes] = useState(existingEntry?.notes || "")
  const [containsSpoilers, setContainsSpoilers] = useState(existingEntry?.contains_spoilers || false)
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>(
    existingEntry?.visibility || 'public'
  )
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("You must be logged in to track content")
      return
    }
    
    setIsLoading(true)
    
    try {
      const entryData = {
        user_id: user.id,
        tmdb_id: tmdbId,
        media_type: mediaType,
        watched_date: watchedDate.toISOString(),
        user_rating: rating > 0 ? rating : undefined,
        is_rewatch: isRewatch,
        rewatch_count: isRewatch ? rewatchCount : 0,
        notes: notes.trim() || undefined,
        contains_spoilers: containsSpoilers,
        visibility,
        posted_as_review: false
      }
      
      if (existingEntry) {
        await updateWatchedContent(existingEntry.id!, entryData)
        toast.success("Watch entry updated successfully!")
      } else {
        await addWatchedContent(entryData)
        toast.success(`${title} marked as watched!`)
      }
      
      onSuccess?.()
    } catch (error) {
      console.error("Error saving watched content:", error)
      toast.error("Failed to save watch entry. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="watched-date">When did you watch it?</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !watchedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {watchedDate ? format(watchedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={watchedDate}
              onSelect={(date: Date | undefined) => date && setWatchedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <Label>Your Rating</Label>
        <Rating
          value={rating}
          onChange={setRating}
          size="lg"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-rewatch"
          checked={isRewatch}
          onCheckedChange={(checked) => setIsRewatch(checked as boolean)}
        />
        <Label htmlFor="is-rewatch">This is a rewatch</Label>
      </div>
      
      {isRewatch && (
        <div className="space-y-2">
          <Label htmlFor="rewatch-count">How many times have you watched this?</Label>
          <Input
            id="rewatch-count"
            type="number"
            min="1"
            value={rewatchCount}
            onChange={(e) => setRewatchCount(parseInt(e.target.value) || 0)}
            placeholder="Number of times watched"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Share your thoughts about this content..."
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="contains-spoilers"
          checked={containsSpoilers}
          onCheckedChange={(checked) => setContainsSpoilers(checked as boolean)}
        />
        <Label htmlFor="contains-spoilers">My notes contain spoilers</Label>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="visibility">Who can see this?</Label>
        <Select value={visibility} onValueChange={(value: 'public' | 'followers' | 'private') => setVisibility(value)}>
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
          {isLoading ? "Saving..." : existingEntry ? "Update Entry" : "Mark as Watched"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
} 