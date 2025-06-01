"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Eye, 
  EyeOff, 
  Star, 
  Calendar,
  Clock,
  MoreHorizontal
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Rating } from "@/components/ui/rating"
import { 
  markEpisodeWatched, 
  unmarkEpisodeWatched, 
  updateEpisodeTracking,
  type EpisodeTracking 
} from "@/lib/supabase/client"
import { type TmdbEpisode } from "@/lib/tmdb/types"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface EpisodeCardProps {
  episode: TmdbEpisode
  tmdbTvId: number
  isWatched: boolean
  watchedData?: EpisodeTracking
  onWatchedChange: () => void
  className?: string
}

export function EpisodeCard({ 
  episode, 
  tmdbTvId, 
  isWatched, 
  watchedData, 
  onWatchedChange,
  className 
}: EpisodeCardProps) {
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [rating, setRating] = useState(watchedData?.rating || 0)
  const [notes, setNotes] = useState(watchedData?.notes || "")

  const handleToggleWatched = async () => {
    setLoading(true)
    try {
      if (isWatched) {
        await unmarkEpisodeWatched(tmdbTvId, episode.season_number, episode.episode_number)
        toast.success("Episode unmarked as watched")
      } else {
        await markEpisodeWatched({
          tmdb_tv_id: tmdbTvId,
          season_number: episode.season_number,
          episode_number: episode.episode_number
        })
        toast.success("Episode marked as watched")
      }
      onWatchedChange()
    } catch (error) {
      console.error('Error toggling episode watched status:', error)
      toast.error("Failed to update episode status")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDetails = async () => {
    if (!watchedData?.id) return

    try {
      await updateEpisodeTracking(watchedData.id, {
        rating: rating || undefined,
        notes: notes || undefined
      })
      toast.success("Episode details updated")
      setShowDetails(false)
      onWatchedChange()
    } catch (error) {
      console.error('Error updating episode details:', error)
      toast.error("Failed to update episode details")
    }
  }

  const formatRuntime = (runtime: number | null) => {
    if (!runtime) return null
    const hours = Math.floor(runtime / 60)
    const minutes = runtime % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isWatched && "bg-muted/50 border-green-200 dark:border-green-800",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Episode Still */}
          <div className="relative w-24 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
            {episode.still_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                alt={episode.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Calendar className="h-6 w-6" />
              </div>
            )}
            {isWatched && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                <Eye className="h-4 w-4 text-green-600" />
              </div>
            )}
          </div>

          {/* Episode Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    E{episode.episode_number}
                  </Badge>
                  {episode.vote_average > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {episode.vote_average.toFixed(1)}
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-sm line-clamp-1 mb-1">
                  {episode.name}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {episode.overview || "No overview available."}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {episode.air_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(episode.air_date).toLocaleDateString()}
                    </div>
                  )}
                  {episode.runtime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRuntime(episode.runtime)}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant={isWatched ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleWatched}
                  disabled={loading}
                  className="h-8 px-2"
                >
                  {isWatched ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>

                {isWatched && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowDetails(true)}>
                        Edit Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Watched Details */}
            {isWatched && watchedData && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {watchedData.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {watchedData.rating}/10
                    </div>
                  )}
                  {watchedData.watched_date && (
                    <span>
                      Watched {formatDistanceToNow(new Date(watchedData.watched_date), { addSuffix: true })}
                    </span>
                  )}
                </div>
                {watchedData.notes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {watchedData.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Episode Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Episode Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">
                {episode.episode_number}. {episode.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {episode.overview}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Your Rating
              </label>
              <Rating
                value={rating}
                onChange={setRating}
                size="lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your thoughts about this episode..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveDetails}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 