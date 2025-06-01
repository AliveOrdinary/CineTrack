"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Eye, 
  Star, 
  Bookmark, 
  List, 
  MessageSquare, 
  RefreshCw,
  Filter,
  Calendar,
  Users
} from "lucide-react"
import { 
  getFilteredActivity, 
  type ActivityItem 
} from "@/lib/supabase/client"
import { getMovieDetails, getTvShowDetails } from "@/lib/tmdb/client"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import { Rating } from "@/components/ui/rating"
import { cn } from "@/lib/utils"

interface ActivityFeedProps {
  className?: string
}

interface ActivityItemWithMedia extends ActivityItem {
  mediaDetails?: any
}

const ACTIVITY_TYPES = [
  { id: 'all', label: 'All Activity', icon: Users },
  { id: 'watched', label: 'Watched', icon: Eye },
  { id: 'review', label: 'Reviews', icon: MessageSquare },
  { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  { id: 'list', label: 'Lists', icon: List }
]

function ActivityItemCard({ activity }: { activity: ActivityItemWithMedia }) {
  const user = activity.details?.user
  const mediaDetails = activity.mediaDetails

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'watched':
        return <Eye className="h-4 w-4 text-green-500" />
      case 'review':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'watchlist':
        return <Bookmark className="h-4 w-4 text-yellow-500" />
      case 'list':
        return <List className="h-4 w-4 text-purple-500" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  const getActivityColor = () => {
    switch (activity.type) {
      case 'watched':
        return 'border-l-green-500'
      case 'review':
        return 'border-l-blue-500'
      case 'watchlist':
        return 'border-l-yellow-500'
      case 'list':
        return 'border-l-purple-500'
      default:
        return 'border-l-gray-500'
    }
  }

  return (
    <Card className={cn("border-l-4", getActivityColor())}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* User Avatar */}
          <Link href={`/profile/${user?.id}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>
                {user?.display_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 space-y-2">
            {/* Activity Header */}
            <div className="flex items-center gap-2 text-sm">
              {getActivityIcon()}
              <Link 
                href={`/profile/${user?.id}`}
                className="font-medium hover:underline"
              >
                {user?.display_name || 'Anonymous User'}
              </Link>
              <span className="text-muted-foreground">{activity.action}</span>
              <Badge variant="outline" className="text-xs">
                {activity.type}
              </Badge>
            </div>

            {/* Media Content */}
            {activity.tmdb_id && mediaDetails && (
              <div className="flex gap-3">
                {/* Media Poster */}
                <Link 
                  href={`/${activity.media_type}/${activity.tmdb_id}`}
                  className="flex-shrink-0"
                >
                  <div className="relative w-16 h-24 rounded overflow-hidden">
                    <Image
                      src={`https://image.tmdb.org/t/p/w200${mediaDetails.poster_path}`}
                      alt={mediaDetails.title || mediaDetails.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>

                {/* Media Info */}
                <div className="flex-1">
                  <Link 
                    href={`/${activity.media_type}/${activity.tmdb_id}`}
                    className="font-medium hover:underline line-clamp-2"
                  >
                    {mediaDetails.title || mediaDetails.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {activity.media_type === 'movie' ? 'Movie' : 'TV Show'} • {
                      mediaDetails.release_date?.split('-')[0] || 
                      mediaDetails.first_air_date?.split('-')[0]
                    }
                  </p>

                  {/* Activity-specific details */}
                  {activity.type === 'watched' && activity.details?.rating && (
                    <div className="flex items-center gap-2 mt-1">
                      <Rating value={activity.details.rating} readonly size="sm" />
                      <span className="text-sm text-muted-foreground">
                        {activity.details.rating}/10
                      </span>
                    </div>
                  )}

                  {activity.type === 'review' && (
                    <div className="mt-2">
                      {activity.details?.rating && (
                        <div className="flex items-center gap-2 mb-1">
                          <Rating value={activity.details.rating} readonly size="sm" />
                          <span className="text-sm text-muted-foreground">
                            {activity.details.rating}/10
                          </span>
                        </div>
                      )}
                      {activity.details?.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {activity.details.content}
                        </p>
                      )}
                    </div>
                  )}

                  {activity.type === 'watchlist' && activity.details?.priority && (
                    <Badge variant="outline" className="mt-1">
                      {activity.details.priority} priority
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* List Activity */}
            {activity.type === 'list' && (
              <div className="bg-muted/50 rounded-lg p-3">
                <Link 
                  href={`/lists/${activity.details?.list_id}`}
                  className="font-medium hover:underline"
                >
                  {activity.details?.list_name}
                </Link>
                {activity.details?.list_description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {activity.details.list_description}
                  </p>
                )}
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ActivityFeed({ className }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItemWithMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [offset, setOffset] = useState(0)

  const loadActivities = useCallback(async (
    filter: string = 'all', 
    loadOffset: number = 0, 
    append: boolean = false
  ) => {
    try {
      if (!append) setLoading(true)
      
      const activityTypes = filter === 'all' 
        ? ['watched', 'review', 'watchlist', 'list']
        : [filter]

      const { activities: newActivities, hasMore: moreAvailable } = 
        await getFilteredActivity(activityTypes, 20, loadOffset)

      // Fetch media details for activities that have TMDB IDs
      const activitiesWithMedia = await Promise.all(
        newActivities.map(async (activity) => {
          if (activity.tmdb_id && activity.media_type) {
            try {
              const mediaDetails = activity.media_type === 'movie'
                ? await getMovieDetails(activity.tmdb_id)
                : await getTvShowDetails(activity.tmdb_id)
              
              return { ...activity, mediaDetails }
            } catch (error) {
              console.error('Error fetching media details:', error)
              return activity
            }
          }
          return activity
        })
      )

      if (append) {
        setActivities(prev => [...prev, ...activitiesWithMedia])
      } else {
        setActivities(activitiesWithMedia)
      }
      
      setHasMore(moreAvailable)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
    setOffset(0)
    loadActivities(filter, 0, false)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setOffset(0)
    loadActivities(activeFilter, 0, false)
  }

  const handleLoadMore = () => {
    const newOffset = offset + 20
    setOffset(newOffset)
    loadActivities(activeFilter, newOffset, true)
  }

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Activity Feed</h2>
          <p className="text-muted-foreground">
            See what people you follow are watching and reviewing
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Activity Type Filters */}
      <Tabs value={activeFilter} onValueChange={handleFilterChange}>
        <TabsList className="grid w-full grid-cols-5">
          {ACTIVITY_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {ACTIVITY_TYPES.map((type) => (
          <TabsContent key={type.id} value={type.id} className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                          <div className="h-16 bg-muted rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeFilter === 'all' 
                      ? "Follow some users to see their activity here!"
                      : `No ${type.label.toLowerCase()} activity from people you follow.`
                    }
                  </p>
                  <Link href="/discover">
                    <Button>Discover Users</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <ActivityItemCard key={activity.id} activity={activity} />
                ))}
                
                {hasMore && (
                  <div className="text-center">
                    <Button variant="outline" onClick={handleLoadMore}>
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
} 