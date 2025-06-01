"use client"

import { useState, useEffect } from "react"
import { createClient, getUserWatchlist, removeFromWatchlist, type WatchlistEntry } from "@/lib/supabase/client"
import { getMovieDetails, getTvShowDetails } from "@/lib/tmdb/client"
import { TmdbMovieDetails, TmdbTvDetails } from "@/lib/tmdb/types"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Eye, EyeOff, Calendar, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { format } from "date-fns"

interface WatchlistItemWithDetails extends WatchlistEntry {
  details?: TmdbMovieDetails | TmdbTvDetails
}

const priorityLabels = {
  0: { label: "No Priority", color: "bg-gray-500" },
  1: { label: "Low", color: "bg-blue-500" },
  2: { label: "Medium", color: "bg-yellow-500" },
  3: { label: "High", color: "bg-red-500" },
}

export function WatchlistContent() {
  const [user, setUser] = useState<any>(null)
  const [watchlist, setWatchlist] = useState<WatchlistItemWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'added_date' | 'priority'>('added_date')
  const [filterBy, setFilterBy] = useState<'all' | 'movie' | 'tv'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | '0' | '1' | '2' | '3'>('all')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  useEffect(() => {
    if (user) {
      loadWatchlist()
    }
  }, [user, sortBy])

  const loadWatchlist = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const entries = await getUserWatchlist(user.id, sortBy, false)
      
      // Fetch TMDB details for each entry
      const entriesWithDetails = await Promise.all(
        entries.map(async (entry) => {
          try {
            const details = entry.media_type === 'movie' 
              ? await getMovieDetails(entry.tmdb_id)
              : await getTvShowDetails(entry.tmdb_id)
            return { ...entry, details }
          } catch (error) {
            console.error(`Failed to fetch details for ${entry.media_type} ${entry.tmdb_id}:`, error)
            return entry
          }
        })
      )
      
      setWatchlist(entriesWithDetails)
    } catch (error) {
      console.error("Error loading watchlist:", error)
      toast.error("Failed to load watchlist")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveItem = async (entry: WatchlistEntry) => {
    if (!user) return

    try {
      await removeFromWatchlist(user.id, entry.tmdb_id, entry.media_type)
      setWatchlist(prev => prev.filter(item => item.id !== entry.id))
      toast.success("Item removed from watchlist")
    } catch (error) {
      console.error("Error removing from watchlist:", error)
      toast.error("Failed to remove item")
    }
  }

  const filteredWatchlist = watchlist.filter(item => {
    if (filterBy !== 'all' && item.media_type !== filterBy) return false
    if (priorityFilter !== 'all' && item.priority?.toString() !== priorityFilter) return false
    return true
  })

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Sign in to view your watchlist</h2>
        <p className="text-muted-foreground">Create an account to start tracking what you want to watch.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
        <p className="text-muted-foreground mb-4">
          Start adding movies and TV shows you want to watch later.
        </p>
        <Link href="/">
          <Button>Discover Content</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sort by:</label>
          <Select value={sortBy} onValueChange={(value: 'added_date' | 'priority') => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="added_date">Date Added</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Type:</label>
          <Select value={filterBy} onValueChange={(value: 'all' | 'movie' | 'tv') => setFilterBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="movie">Movies</SelectItem>
              <SelectItem value="tv">TV Shows</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Priority:</label>
          <Select value={priorityFilter} onValueChange={(value: 'all' | '0' | '1' | '2' | '3') => setPriorityFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="3">High</SelectItem>
              <SelectItem value="2">Medium</SelectItem>
              <SelectItem value="1">Low</SelectItem>
              <SelectItem value="0">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Watchlist Items */}
      <div className="space-y-4">
        {filteredWatchlist.map((item) => {
          const details = item.details
          const title = details ? (details.media_type === 'movie' ? details.title : details.name) : `${item.media_type} ${item.tmdb_id}`
          const year = details ? (
            details.media_type === 'movie' 
              ? details.release_date ? new Date(details.release_date).getFullYear() : null
              : details.first_air_date ? new Date(details.first_air_date).getFullYear() : null
          ) : null
          const posterUrl = details?.poster_path 
            ? `https://image.tmdb.org/t/p/w200${details.poster_path}`
            : null

          return (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Poster */}
                  <div className="flex-shrink-0">
                    {posterUrl ? (
                      <div className="aspect-[2/3] w-20 relative">
                        <Image
                          src={posterUrl}
                          alt={title}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[2/3] w-20 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/${item.media_type}/${item.tmdb_id}`}
                          className="hover:underline"
                        >
                          <h3 className="font-semibold text-lg truncate">{title}</h3>
                        </Link>
                        {year && (
                          <p className="text-muted-foreground">{year}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="capitalize">
                            {item.media_type}
                          </Badge>
                          
                          {item.priority !== undefined && item.priority > 0 && (
                            <Badge className={priorityLabels[item.priority as keyof typeof priorityLabels].color}>
                              {priorityLabels[item.priority as keyof typeof priorityLabels].label} Priority
                            </Badge>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {item.visibility === 'private' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            <span className="capitalize">{item.visibility}</span>
                          </div>
                        </div>

                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {item.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Calendar className="h-3 w-3" />
                          <span>Added {format(new Date(item.added_date!), 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {details?.vote_average && details.vote_average > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{details.vote_average.toFixed(1)}</span>
                          </div>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredWatchlist.length === 0 && watchlist.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No items match your current filters.</p>
        </div>
      )}
    </div>
  )
} 