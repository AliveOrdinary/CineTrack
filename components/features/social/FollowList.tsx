"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, UserPlus } from "lucide-react"
import { 
  getUserFollowers, 
  getUserFollowing, 
  getUserFollowCounts,
  type UserWithFollowStatus 
} from "@/lib/supabase/client"
import { FollowButton } from "./FollowButton"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface FollowListProps {
  userId: string
  initialTab?: "followers" | "following"
}

interface UserCardProps {
  user: UserWithFollowStatus
}

function UserCard({ user }: UserCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>
                {user.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link 
                  href={`/profile/${user.id}`}
                  className="font-medium hover:underline"
                >
                  {user.display_name || 'User'}
                </Link>
                
                {user.is_followed_by && (
                  <Badge variant="secondary" className="text-xs">
                    Follows you
                  </Badge>
                )}
              </div>
              
              {user.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {user.bio}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{user.followers_count || 0} followers</span>
                <span>{user.following_count || 0} following</span>
                {user.created_at && (
                  <span>
                    Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <FollowButton userId={user.id} size="sm" />
        </div>
      </CardContent>
    </Card>
  )
}

export function FollowList({ userId, initialTab = "followers" }: FollowListProps) {
  const [followers, setFollowers] = useState<UserWithFollowStatus[]>([])
  const [following, setFollowing] = useState<UserWithFollowStatus[]>([])
  const [followCounts, setFollowCounts] = useState({ followersCount: 0, followingCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    loadFollowData()
  }, [userId])

  const loadFollowData = async () => {
    try {
      setIsLoading(true)
      
      const [followersData, followingData, countsData] = await Promise.all([
        getUserFollowers(userId),
        getUserFollowing(userId),
        getUserFollowCounts(userId)
      ])
      
      setFollowers(followersData)
      setFollowing(followingData)
      setFollowCounts(countsData)
    } catch (error) {
      console.error('Error loading follow data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                  <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "followers" | "following")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="followers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Followers ({followCounts.followersCount})
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Following ({followCounts.followingCount})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="followers" className="space-y-4">
          {followers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No followers yet</h3>
                <p className="text-muted-foreground">
                  When people follow this user, they'll appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {followers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="following" className="space-y-4">
          {following.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Not following anyone yet</h3>
                <p className="text-muted-foreground">
                  When this user follows people, they'll appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {following.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 