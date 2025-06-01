'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Eye,
  MessageSquare,
  Heart,
  List,
  AlertTriangle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface OverviewStats {
  totalUsers: number;
  totalReviews: number;
  totalLists: number;
  totalWatchedEntries: number;
  totalReports: number;
  pendingReports: number;
  newUsersToday: number;
  activeUsersToday: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverviewStats();
  }, []);

  const loadOverviewStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all stats in parallel
      const [
        usersResult,
        reviewsResult,
        listsResult,
        watchedResult,
        reportsResult,
        pendingReportsResult,
        newUsersResult,
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('lists').select('id', { count: 'exact', head: true }),
        supabase.from('watched_content').select('id', { count: 'exact', head: true }),
        supabase.from('review_reports').select('id', { count: 'exact', head: true }),
        supabase
          .from('review_reports')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalReviews: reviewsResult.count || 0,
        totalLists: listsResult.count || 0,
        totalWatchedEntries: watchedResult.count || 0,
        totalReports: reportsResult.count || 0,
        pendingReports: pendingReportsResult.count || 0,
        newUsersToday: newUsersResult.count || 0,
        activeUsersToday: 0, // Would need session tracking for this
      });
    } catch (error) {
      console.error('Error loading overview stats:', error);
      setError('Failed to load overview statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1"></div>
              <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      description: `+${stats.newUsersToday} today`,
      icon: Users,
      trend: stats.newUsersToday > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Total Reviews',
      value: stats.totalReviews.toLocaleString(),
      description: 'User reviews',
      icon: MessageSquare,
      trend: 'neutral',
    },
    {
      title: 'Custom Lists',
      value: stats.totalLists.toLocaleString(),
      description: 'User-created lists',
      icon: List,
      trend: 'neutral',
    },
    {
      title: 'Watched Entries',
      value: stats.totalWatchedEntries.toLocaleString(),
      description: 'Content tracked',
      icon: Eye,
      trend: 'neutral',
    },
    {
      title: 'Total Reports',
      value: stats.totalReports.toLocaleString(),
      description: 'Content reports',
      icon: AlertTriangle,
      trend: 'neutral',
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports.toLocaleString(),
      description: 'Needs attention',
      icon: AlertTriangle,
      trend: stats.pendingReports > 0 ? 'warning' : 'neutral',
    },
    {
      title: 'New Users Today',
      value: stats.newUsersToday.toLocaleString(),
      description: 'Last 24 hours',
      icon: TrendingUp,
      trend: stats.newUsersToday > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Active Users',
      value: stats.activeUsersToday.toLocaleString(),
      description: 'Today',
      icon: Activity,
      trend: 'neutral',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                  {stat.trend === 'warning' && (
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  )}
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.pendingReports > 0 && (
              <Badge variant="destructive" className="cursor-pointer">
                {stats.pendingReports} Pending Reports
              </Badge>
            )}
            <Badge variant="secondary" className="cursor-pointer">
              View System Logs
            </Badge>
            <Badge variant="secondary" className="cursor-pointer">
              Database Health
            </Badge>
            <Badge variant="secondary" className="cursor-pointer">
              Export Data
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
