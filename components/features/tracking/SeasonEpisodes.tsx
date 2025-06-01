"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Circle,
  MoreHorizontal,
  Calendar
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EpisodeCard } from "./EpisodeCard"
import { 
  getWatchedEpisodesForSeason,
  markSeasonWatched,
  unmarkSeasonWatched,
  type EpisodeTracking 
} from "@/lib/supabase/client"
import { getTvSeason } from "@/lib/tmdb/client"
import { type TmdbSeasonDetails, type TmdbEpisode } from "@/lib/tmdb/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SeasonEpisodesProps {
  tmdbTvId: number
  seasonNumber: number
  seasonName?: string
  className?: string
}

export function SeasonEpisodes({ 
  tmdbTvId, 
  seasonNumber, 
  seasonName,
  className 
}: SeasonEpisodesProps) {
  const [season, setSeason] = useState<TmdbSeasonDetails | null>(null)
  const [watchedEpisodes, setWatchedEpisodes] = useState<EpisodeTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)

  const loadSeasonData = async () => {
    try {
      setLoading(true)
      const [seasonData, watchedData] = await Promise.all([
        getTvSeason(tmdbTvId, seasonNumber),
        getWatchedEpisodesForSeason(tmdbTvId, seasonNumber)
      ])
      
      setSeason(seasonData)
      setWatchedEpisodes(watchedData)
    } catch (error) {
      console.error('Error loading season data:', error)
      toast.error("Failed to load season data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSeasonData()
  }, [tmdbTvId, seasonNumber])

  const handleRefresh = () => {
    loadSeasonData()
  }

  const handleMarkSeasonWatched = async () => {
    if (!season) return
    
    setBulkLoading(true)
    try {
      await markSeasonWatched(tmdbTvId, seasonNumber, season.episodes.length)
      toast.success(`Season ${seasonNumber} marked as watched`)
      handleRefresh()
    } catch (error) {
      console.error('Error marking season as watched:', error)
      toast.error("Failed to mark season as watched")
    } finally {
      setBulkLoading(false)
    }
  }

  const handleUnmarkSeasonWatched = async () => {
    setBulkLoading(true)
    try {
      await unmarkSeasonWatched(tmdbTvId, seasonNumber)
      toast.success(`Season ${seasonNumber} unmarked as watched`)
      handleRefresh()
    } catch (error) {
      console.error('Error unmarking season as watched:', error)
      toast.error("Failed to unmark season as watched")
    } finally {
      setBulkLoading(false)
    }
  }

  const getEpisodeWatchedData = (episodeNumber: number): EpisodeTracking | undefined => {
    return watchedEpisodes.find(ep => ep.episode_number === episodeNumber)
  }

  const isEpisodeWatched = (episodeNumber: number): boolean => {
    return watchedEpisodes.some(ep => ep.episode_number === episodeNumber)
  }

  const watchedCount = watchedEpisodes.length
  const totalCount = season?.episodes.length || 0
  const progressPercentage = totalCount > 0 ? (watchedCount / totalCount) * 100 : 0
  const isSeasonComplete = watchedCount === totalCount && totalCount > 0

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!season) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Failed to load season data</p>
          <Button variant="outline" onClick={handleRefresh} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {seasonName || `Season ${seasonNumber}`}
              {isSeasonComplete && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                {watchedCount} of {totalCount} episodes
              </div>
              {season.air_date && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(season.air_date).getFullYear()}
                </div>
              )}
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-1">
                <Progress value={progressPercentage} className="flex-1" />
                <span className="text-sm text-muted-foreground">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={bulkLoading}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleMarkSeasonWatched}
                disabled={isSeasonComplete}
              >
                <Eye className="h-4 w-4 mr-2" />
                Mark Season Watched
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleUnmarkSeasonWatched}
                disabled={watchedCount === 0}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Unmark Season Watched
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {season.overview && (
          <p className="text-sm text-muted-foreground mt-2">
            {season.overview}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {season.episodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              tmdbTvId={tmdbTvId}
              isWatched={isEpisodeWatched(episode.episode_number)}
              watchedData={getEpisodeWatchedData(episode.episode_number)}
              onWatchedChange={handleRefresh}
            />
          ))}
        </div>

        {season.episodes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No episodes available for this season</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 