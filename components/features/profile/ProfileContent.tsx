"use client"

import { useState, useEffect } from "react"
import { createClient, getUserProfile, getUserStats, getUserActivity, updateUserProfile, getUserFollowCounts, type UserProfile, type UserStats, type ActivityItem } from "@/lib/supabase/client"
import { getMovieDetails, getTvShowDetails } from "@/lib/tmdb/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Film, Tv, Star, Bookmark, List, Calendar, Eye, EyeOff, Users } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { FollowButton } from "../social/FollowButton"

interface ActivityItemWithDetails extends ActivityItem {
  title?: string;
  poster_path?: string | null;
}

interface ProfileContentProps {
  userId?: string; // If provided, show another user's profile
}

export function ProfileContent({ userId }: ProfileContentProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [activity, setActivity] = useState<ActivityItemWithDetails[]>([])
  const [followCounts, setFollowCounts] = useState({ followersCount: 0, followingCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: ''
  })

  useEffect(() => {
    loadProfileData()
  }, [userId])

  const loadProfileData = async () => {
    try {
      setIsLoading(true)
      
      // Check if user is authenticated
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Please log in to view profiles")
        return
      }

      // Determine if this is the user's own profile
      const targetUserId = userId || user.id
      const isOwn = targetUserId === user.id
      setIsOwnProfile(isOwn)

      // Load profile, stats, activity, and follow counts in parallel
      const [profileData, statsData, activityData, followCountsData] = await Promise.all([
        getUserProfile(targetUserId),
        getUserStats(targetUserId),
        getUserActivity(targetUserId),
        getUserFollowCounts(targetUserId)
      ])

      setProfile(profileData)
      setStats(statsData)
      setFollowCounts(followCountsData)
      setEditForm({
        display_name: profileData.display_name || '',
        bio: profileData.bio || ''
      })

      // Enhance activity with TMDB data
      const enhancedActivity = await Promise.all(
        activityData.map(async (item) => {
          if (item.tmdb_id && item.media_type) {
            try {
              const details = item.media_type === 'movie' 
                ? await getMovieDetails(item.tmdb_id)
                : await getTvShowDetails(item.tmdb_id)
              
              return {
                ...item,
                title: details.title || details.name,
                poster_path: details.poster_path
              }
            } catch (error) {
              return item
            }
          }
          return item
        })
      )

      setActivity(enhancedActivity)
    } catch (error) {
      console.error('Error loading profile data:', error)
      toast.error("Failed to load profile data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProfile = async () => {
    try {
      const updatedProfile = await updateUserProfile({
        display_name: editForm.display_name || undefined,
        bio: editForm.bio || undefined
      })
      
      setProfile(updatedProfile)
      setIsEditOpen(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error("Failed to update profile")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'watched': return <Eye className="h-4 w-4" />
      case 'watchlist': return <Bookmark className="h-4 w-4" />
      case 'review': return <Star className="h-4 w-4" />
      case 'list': return <List className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'watched': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'watchlist': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'list': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} alt={profile.display_name || profile.email} />
              <AvatarFallback className="text-lg">
                {(profile.display_name || profile.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold">
                    {profile.display_name || 'Anonymous User'}
                  </h1>
                  <p className="text-muted-foreground">{profile.email}</p>
                  
                  {/* Follow counts */}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <Link 
                      href={`/profile/${profile.id}/followers`}
                      className="hover:text-foreground hover:underline"
                    >
                      <span className="font-medium text-foreground">{followCounts.followersCount}</span> followers
                    </Link>
                    <Link 
                      href={`/profile/${profile.id}/following`}
                      className="hover:text-foreground hover:underline"
                    >
                      <span className="font-medium text-foreground">{followCounts.followingCount}</span> following
                    </Link>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* Follow button for other users */}
                  {!isOwnProfile && (
                    <FollowButton userId={profile.id} />
                  )}
                  
                  {/* Edit button for own profile */}
                  {isOwnProfile && (
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="display_name">Display Name</Label>
                            <Input
                              id="display_name"
                              value={editForm.display_name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                              placeholder="Enter your display name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                              id="bio"
                              value={editForm.bio}
                              onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                              placeholder="Tell us about yourself..."
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleEditProfile}>
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              
              {profile.bio && (
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Joined {formatDistanceToNow(new Date(profile.created_at || ''), { addSuffix: true })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2">
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="privacy">Privacy Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {activity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No recent activity. Start watching movies and TV shows to see your activity here!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {activity.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border">
                          <div className={`p-2 rounded-full ${getActivityColor(item.type)}`}>
                            {getActivityIcon(item.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-medium">You</span> {item.action}
                                  {item.title && (
                                    <Link 
                                      href={`/${item.media_type}/${item.tmdb_id}`}
                                      className="font-medium text-primary hover:underline ml-1"
                                    >
                                      {item.title}
                                    </Link>
                                  )}
                                </p>
                                
                                {item.details?.rating && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-muted-foreground">
                                      {item.details.rating}/10
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="privacy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Profile Visibility</h4>
                        <p className="text-sm text-muted-foreground">
                          Control who can see your profile
                        </p>
                      </div>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Activity Visibility</h4>
                        <p className="text-sm text-muted-foreground">
                          Control who can see your watching activity
                        </p>
                      </div>
                      <Badge variant="secondary">
                        <Eye className="h-3 w-3 mr-1" />
                        Followers
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Watchlist Visibility</h4>
                        <p className="text-sm text-muted-foreground">
                          Control who can see your watchlist
                        </p>
                      </div>
                      <Badge variant="secondary">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Privacy controls will be fully functional in a future update.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Film className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Movies Watched</span>
                    </div>
                    <Badge variant="secondary">{stats.moviesWatched}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tv className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">TV Shows Watched</span>
                    </div>
                    <Badge variant="secondary">{stats.tvShowsWatched}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Reviews Written</span>
                    </div>
                    <Badge variant="secondary">{stats.reviewsWritten}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Watchlist Items</span>
                    </div>
                    <Badge variant="secondary">{stats.watchlistItems}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Custom Lists</span>
                    </div>
                    <Badge variant="secondary">{stats.customLists}</Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/watchlist">
                  <Bookmark className="h-4 w-4 mr-2" />
                  View Watchlist
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/lists">
                  <List className="h-4 w-4 mr-2" />
                  My Lists
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" disabled>
                <Star className="h-4 w-4 mr-2" />
                My Reviews
                <Badge variant="secondary" className="ml-auto">Soon</Badge>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 