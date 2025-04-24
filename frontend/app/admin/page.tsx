'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useUser from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, Flag, BarChart2, ShieldAlert } from 'lucide-react';

interface DashboardStats {
  usersCount: number;
  reportsCount: number;
  pendingReportsCount: number;
  reviewsCount: number;
}

// Function to fetch dashboard stats
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const supabase = createClient();
  
  // Run multiple queries in parallel
  const [
    usersResult,
    reportsResult,
    pendingReportsResult,
    reviewsResult
  ] = await Promise.all([
    // Get total users count
    supabase.from('users').select('*', { count: 'exact', head: true }),
    // Get total reports count
    supabase.from('content_reports').select('*', { count: 'exact', head: true }),
    // Get pending reports count
    supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    // Get total reviews count
    supabase.from('reviews').select('*', { count: 'exact', head: true })
  ]);

  if (usersResult.error) throw usersResult.error;
  if (reportsResult.error) throw reportsResult.error;
  if (pendingReportsResult.error) throw pendingReportsResult.error;
  if (reviewsResult.error) throw reviewsResult.error;

  return {
    usersCount: usersResult.count || 0,
    reportsCount: reportsResult.count || 0,
    pendingReportsCount: pendingReportsResult.count || 0,
    reviewsCount: reviewsResult.count || 0
  };
};

export default function AdminDashboardPage() {
  const { user, userData, isLoading: isUserLoading } = useUser();
  const router = useRouter();

  const { 
    data: stats, 
    isLoading: isLoadingStats, 
    error: statsError 
  } = useQuery<DashboardStats>({
    queryKey: ['adminDashboardStats'],
    queryFn: fetchDashboardStats,
    enabled: !isUserLoading && userData?.role === 'admin',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!isUserLoading && (!user || userData?.role !== 'admin')) {
      console.warn('[AdminDashboard] Non-admin user detected, redirecting.');
      router.push('/'); 
    }
  }, [isUserLoading, user, userData, router]);

  const isLoading = isUserLoading || (userData?.role === 'admin' && isLoadingStats);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-8 w-48 mt-8 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-red-500">Error</h1>
        <Alert variant="destructive">
          <AlertTitle>Failed to load dashboard data</AlertTitle>
          <AlertDescription>
            {statsError instanceof Error ? statsError.message : 'An unknown error occurred'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (userData?.role !== 'admin') {
    return null; // This will be handled by the useEffect redirect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.usersCount}</div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <BarChart2 className="mr-2 h-4 w-4" />
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reviewsCount}</div>
            <p className="text-xs text-muted-foreground">
              User-submitted reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Flag className="mr-2 h-4 w-4" />
              Content Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reportsCount}</div>
            <p className="text-xs text-muted-foreground">
              Total reported content
            </p>
          </CardContent>
        </Card>

        <Card className={stats?.pendingReportsCount ? "border-yellow-600 bg-yellow-900/20" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-base font-medium flex items-center ${stats?.pendingReportsCount ? "text-yellow-400" : ""}`}>
              <ShieldAlert className="mr-2 h-4 w-4" />
              Pending Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats?.pendingReportsCount ? "text-yellow-400" : ""}`}>
              {stats?.pendingReportsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting moderation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <h2 className="text-xl font-semibold mb-4">Admin Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts, roles, and suspension status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users" passHref>
              <Button className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className={stats?.pendingReportsCount ? "border-yellow-600 bg-yellow-900/10" : ""}>
          <CardHeader>
            <CardTitle>Content Moderation</CardTitle>
            <CardDescription>
              Review and moderate reported content
              {stats?.pendingReportsCount && stats.pendingReportsCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900 text-yellow-300">
                  {stats.pendingReportsCount} pending
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/reports" passHref>
              <Button className="w-full" variant={stats?.pendingReportsCount ? "default" : "outline"}>
                <Flag className="mr-2 h-4 w-4" />
                Review Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 