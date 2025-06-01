'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, MessageSquare, Bookmark, List, ArrowRight, Users } from 'lucide-react';
import { getFilteredActivity, type ActivityItem } from '@/lib/supabase/client';
import { getMovieDetails, getTvShowDetails } from '@/lib/tmdb/client';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface ActivityFeedPreviewProps {
  className?: string;
}

interface ActivityItemWithMedia extends ActivityItem {
  mediaDetails?: any;
}

function ActivityPreviewCard({ activity }: { activity: ActivityItemWithMedia }) {
  const user = activity.details?.user;
  const mediaDetails = activity.mediaDetails;

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'watched':
        return <Eye className="h-3 w-3 text-green-500" />;
      case 'review':
        return <MessageSquare className="h-3 w-3 text-blue-500" />;
      case 'watchlist':
        return <Bookmark className="h-3 w-3 text-yellow-500" />;
      case 'list':
        return <List className="h-3 w-3 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <Link href={`/profile/${user?.id}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatar_url} />
          <AvatarFallback className="text-xs">
            {user?.display_name?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-sm">
          {getActivityIcon()}
          <Link href={`/profile/${user?.id}`} className="font-medium hover:underline truncate">
            {user?.display_name || 'Anonymous'}
          </Link>
          <span className="text-muted-foreground truncate">{activity.action}</span>
        </div>

        {activity.tmdb_id && mediaDetails && (
          <Link
            href={`/${activity.media_type}/${activity.tmdb_id}`}
            className="text-sm text-muted-foreground hover:underline truncate block"
          >
            {mediaDetails.title || mediaDetails.name}
          </Link>
        )}

        {activity.type === 'list' && (
          <Link
            href={`/lists/${activity.details?.list_id}`}
            className="text-sm text-muted-foreground hover:underline truncate block"
          >
            {activity.details?.list_name}
          </Link>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
      </div>
    </div>
  );
}

export function ActivityFeedPreview({ className }: ActivityFeedPreviewProps) {
  const [activities, setActivities] = useState<ActivityItemWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      if (user) {
        try {
          const { activities: newActivities } = await getFilteredActivity(
            ['watched', 'review', 'watchlist', 'list'],
            5,
            0
          );

          // Fetch media details for activities that have TMDB IDs
          const activitiesWithMedia = await Promise.all(
            newActivities.map(async activity => {
              if (activity.tmdb_id && activity.media_type) {
                try {
                  const mediaDetails =
                    activity.media_type === 'movie'
                      ? await getMovieDetails(activity.tmdb_id)
                      : await getTvShowDetails(activity.tmdb_id);

                  return { ...activity, mediaDetails };
                } catch (error) {
                  return activity;
                }
              }
              return activity;
            })
          );

          setActivities(activitiesWithMedia);
        } catch (error) {
          console.error('Error loading activity preview:', error);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Link href="/feed">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No recent activity from people you follow
            </p>
            <Link href="/discover">
              <Button variant="outline" size="sm">
                Discover Users
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map(activity => (
              <ActivityPreviewCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
