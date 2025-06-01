"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Bookmark, BookmarkCheck, Plus } from "lucide-react"
import { WatchlistForm } from "./WatchlistForm"
import { getWatchlistEntry, removeFromWatchlist, type WatchlistEntry, createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface WatchlistButtonProps {
  tmdbId: number
  mediaType: 'movie' | 'tv'
  title: string
  className?: string
}

export function WatchlistButton({
  tmdbId,
  mediaType,
  title,
  className
}: WatchlistButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [watchlistEntry, setWatchlistEntry] = useState<WatchlistEntry | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])
  
  useEffect(() => {
    if (user) {
      loadWatchlistEntry()
    }
  }, [user, tmdbId, mediaType])
  
  const loadWatchlistEntry = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const entry = await getWatchlistEntry(user.id, tmdbId, mediaType)
      setWatchlistEntry(entry)
    } catch (error) {
      console.error("Error loading watchlist entry:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleRemoveFromWatchlist = async () => {
    if (!user || !watchlistEntry) return
    
    setIsLoading(true)
    try {
      await removeFromWatchlist(user.id, tmdbId, mediaType)
      setWatchlistEntry(null)
      toast.success(`${title} removed from watchlist`)
    } catch (error) {
      console.error("Error removing from watchlist:", error)
      toast.error("Failed to remove from watchlist")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSuccess = () => {
    setIsOpen(false)
    loadWatchlistEntry() // Refresh the entry
  }
  
  const isInWatchlist = !!watchlistEntry
  
  if (!user) {
    return (
      <Button variant="outline" disabled className={className}>
        <Bookmark className="mr-2 h-4 w-4" />
        Sign in to add to watchlist
      </Button>
    )
  }
  
  if (isInWatchlist) {
    return (
      <div className="flex gap-2">
        <Button 
          variant="default" 
          className={className}
          disabled={isLoading}
          onClick={() => setIsOpen(true)}
        >
          <BookmarkCheck className="mr-2 h-4 w-4" />
          In Watchlist
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveFromWatchlist}
          disabled={isLoading}
        >
          Remove
        </Button>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Watchlist Entry</DialogTitle>
            </DialogHeader>
            <WatchlistForm
              tmdbId={tmdbId}
              mediaType={mediaType}
              title={title}
              existingEntry={watchlistEntry}
              onSuccess={handleSuccess}
              onCancel={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={className}
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add to Watchlist
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
        </DialogHeader>
        <WatchlistForm
          tmdbId={tmdbId}
          mediaType={mediaType}
          title={title}
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
} 