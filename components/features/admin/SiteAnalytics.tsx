'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MessageSquare,
  Heart,
  List,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface AnalyticsData {
  totalUsers: number;
  totalReviews: number;
  totalLists: number;
  totalWatchedEntries: number;
  totalFollows: number;
  usersThisWeek: number;
  usersLastWeek: number;
  reviewsThisWeek: number;
  reviewsLastWeek: number;
  listsThisWeek: number;
  listsLastWeek: number;
}

interface TrendData {
  label: string;
  current: number;
  previous: number;
  icon: React.ComponentType<any>;
  color: string;
}

export function SiteAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Get all analytics data in parallel
      const [
        totalUsersResult,
        totalReviewsResult,
        totalListsResult,
        totalWatchedResult,
        totalFollowsResult,
        usersThisWeekResult,
        usersLastWeekResult,
        reviewsThisWeekResult,
        reviewsLastWeekResult,
        listsThisWeekResult,
        listsLastWeekResult,
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('lists').select('id', { count: 'exact', head: true }),
        supabase.from('watched_content').select('id', { count: 'exact', head: true }),
        supabase.from('follows').select('id', { count: 'exact', head: true }),
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', oneWeekAgo.toISOString()),
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', oneWeekAgo.toISOString()),
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', oneWeekAgo.toISOString()),
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', oneWeekAgo.toISOString()),
        supabase
          .from('lists')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', oneWeekAgo.toISOString()),
        supabase
          .from('lists')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', oneWeekAgo.toISOString()),
      ]);

      setAnalytics({
        totalUsers: totalUsersResult.count || 0,
        totalReviews: totalReviewsResult.count || 0,
        totalLists: totalListsResult.count || 0,
        totalWatchedEntries: totalWatchedResult.count || 0,
        totalFollows: totalFollowsResult.count || 0,
        usersThisWeek: usersThisWeekResult.count || 0,
        usersLastWeek: usersLastWeekResult.count || 0,
        reviewsThisWeek: reviewsThisWeekResult.count || 0,
        reviewsLastWeek: reviewsLastWeekResult.count || 0,
        listsThisWeek: listsThisWeekResult.count || 0,
        listsLastWeek: listsLastWeekResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <BarChart3 className="h-3 w-3 text-muted-foreground" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600 dark:text-green-400';
    if (trend < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const trendData: TrendData[] = [
    {
      label: 'New Users',
      current: analytics.usersThisWeek,
      previous: analytics.usersLastWeek,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'New Reviews',
      current: analytics.reviewsThisWeek,
      previous: analytics.reviewsLastWeek,
      icon: MessageSquare,
      color: 'text-green-600',
    },
    {
      label: 'New Lists',
      current: analytics.listsThisWeek,
      previous: analytics.listsLastWeek,
      icon: List,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalReviews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">User reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Lists</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLists.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">User-created lists</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watched Content</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalWatchedEntries.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Tracking entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Trends</CardTitle>
          <CardDescription>Comparing this week vs last week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {trendData.map((trend, index) => {
              const trendPercentage = calculateTrend(trend.current, trend.previous);
              const Icon = trend.icon;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-muted`}>
                      <Icon className={`h-4 w-4 ${trend.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{trend.label}</p>
                      <p className="text-2xl font-bold">{trend.current}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 ${getTrendColor(trendPercentage)}`}>
                      {getTrendIcon(trendPercentage)}
                      <span className="text-sm font-medium">
                        {Math.abs(trendPercentage).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">vs last week</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Social Engagement</CardTitle>
            <CardDescription>User interaction metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Follows</span>
                <span className="font-medium">{analytics.totalFollows.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Reviews per User</span>
                <span className="font-medium">
                  {analytics.totalUsers > 0
                    ? (analytics.totalReviews / analytics.totalUsers).toFixed(1)
                    : '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Lists per User</span>
                <span className="font-medium">
                  {analytics.totalUsers > 0
                    ? (analytics.totalLists / analytics.totalUsers).toFixed(1)
                    : '0'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Activity</CardTitle>
            <CardDescription>Platform content metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Watched per User</span>
                <span className="font-medium">
                  {analytics.totalUsers > 0
                    ? (analytics.totalWatchedEntries / analytics.totalUsers).toFixed(1)
                    : '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Content Engagement Rate</span>
                <span className="font-medium">
                  {analytics.totalWatchedEntries > 0
                    ? ((analytics.totalReviews / analytics.totalWatchedEntries) * 100).toFixed(1)
                    : '0'}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">List Creation Rate</span>
                <span className="font-medium">
                  {analytics.totalUsers > 0
                    ? ((analytics.totalLists / analytics.totalUsers) * 100).toFixed(1)
                    : '0'}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
