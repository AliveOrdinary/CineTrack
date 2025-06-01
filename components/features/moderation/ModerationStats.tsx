'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Flag
} from 'lucide-react';
import { getReportStats } from '@/lib/supabase/reports';
import { type ReportStats } from '@/types/reports';

export function ModerationStats() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const statsData = await getReportStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No statistics available</h3>
          <p className="text-muted-foreground">
            Unable to load moderation statistics
          </p>
        </CardContent>
      </Card>
    );
  }

  const pendingPercentage = stats.total_reports > 0 
    ? Math.round((stats.pending_reports / stats.total_reports) * 100)
    : 0;

  const resolvedPercentage = stats.total_reports > 0 
    ? Math.round((stats.resolved_reports / stats.total_reports) * 100)
    : 0;

  const dismissedPercentage = stats.total_reports > 0 
    ? Math.round((stats.dismissed_reports / stats.total_reports) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_reports}</div>
            <p className="text-xs text-muted-foreground">
              All time reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending_reports}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingPercentage}% of total reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.resolved_reports}
            </div>
            <p className="text-xs text-muted-foreground">
              {resolvedPercentage}% of total reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dismissed</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.dismissed_reports}
            </div>
            <p className="text-xs text-muted-foreground">
              {dismissedPercentage}% of total reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resolution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resolved</span>
                <span className="text-sm text-muted-foreground">
                  {stats.resolved_reports} reports
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${resolvedPercentage}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dismissed</span>
                <span className="text-sm text-muted-foreground">
                  {stats.dismissed_reports} reports
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dismissedPercentage}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pending</span>
                <span className="text-sm text-muted-foreground">
                  {stats.pending_reports} reports
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pendingPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Moderation Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {stats.pending_reports === 0 ? '✅' : '⚠️'}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats.pending_reports === 0 
                    ? 'All reports have been reviewed'
                    : `${stats.pending_reports} reports awaiting review`
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Response Rate</span>
                  <span className="font-medium">
                    {stats.total_reports > 0 
                      ? Math.round(((stats.resolved_reports + stats.dismissed_reports) / stats.total_reports) * 100)
                      : 0
                    }%
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Total Processed</span>
                  <span className="font-medium">
                    {stats.resolved_reports + stats.dismissed_reports}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 