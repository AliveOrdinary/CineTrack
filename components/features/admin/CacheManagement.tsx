'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Database,
  RefreshCw,
  Trash2,
  TrendingUp,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  cacheWarmer,
  cacheInvalidator,
  cacheMonitor,
  type CacheMetrics,
} from '@/lib/tmdb/cache-manager';

interface CacheManagementProps {
  className?: string;
}

export default function CacheManagement({ className }: CacheManagementProps) {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [isWarming, setIsWarming] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [healthReport, setHealthReport] = useState<any>(null);

  // Refresh cache metrics
  const refreshMetrics = () => {
    try {
      const newMetrics = cacheWarmer.getCacheMetrics();
      const health = cacheMonitor.getHealthReport();
      setMetrics(newMetrics);
      setHealthReport(health);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh cache metrics:', error);
    }
  };

  // Warm cache
  const handleWarmCache = async (full = false) => {
    setIsWarming(true);
    try {
      await cacheWarmer.warmCache({
        trendingContent: true,
        popularMovies: full,
        popularTvShows: full,
        topRatedContent: full,
      });
      refreshMetrics();
    } catch (error) {
      console.error('Cache warming failed:', error);
    } finally {
      setIsWarming(false);
    }
  };

  // Clear all caches
  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all caches? This will impact performance temporarily.')) {
      cacheInvalidator.clearAll();
      refreshMetrics();
    }
  };

  // Invalidate trending caches
  const handleInvalidateTrending = () => {
    cacheInvalidator.invalidateTrending();
    refreshMetrics();
  };

  // Initial load and auto-refresh
  useEffect(() => {
    refreshMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!metrics || !healthReport) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            TMDB Cache Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading cache metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cache Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            TMDB Cache Management
            <Badge className={getStatusColor(healthReport.status)}>
              {getStatusIcon(healthReport.status)}
              {healthReport.status.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Monitor and manage TMDB API cache performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hit Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hit Rate</span>
                <span className="text-sm text-muted-foreground">
                  {(metrics.overallHitRate * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.overallHitRate * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {metrics.totalHits} hits, {metrics.totalMisses} misses
              </div>
            </div>

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-muted-foreground">
                  ~{metrics.memoryUsage.estimatedSizeKB}KB
                </span>
              </div>
              <Progress 
                value={Math.min((metrics.memoryUsage.estimatedSizeKB / 50000) * 100, 100)} 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground">
                {metrics.memoryUsage.entryCount} entries cached
              </div>
            </div>

            {/* Last Updated */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Updated</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshMetrics}
                  className="h-6 px-2"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {lastRefresh.toLocaleTimeString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Auto-refresh: 30s
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleWarmCache(false)}
              disabled={isWarming}
              size="sm"
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              {isWarming ? 'Warming...' : 'Quick Warm'}
            </Button>
            
            <Button
              onClick={() => handleWarmCache(true)}
              disabled={isWarming}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Full Warm
            </Button>
            
            <Button
              onClick={handleInvalidateTrending}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Trending
            </Button>
            
            <Button
              onClick={handleClearAll}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cache Details by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Performance by Type</CardTitle>
          <CardDescription>
            Detailed performance metrics for each cache type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(metrics.cachesByType).map(([cacheType, stats]) => (
              <div key={cacheType} className="p-4 border rounded-lg">
                <div className="font-medium capitalize mb-2">{cacheType}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hit Rate:</span>
                    <span className={`font-medium ${
                      stats.hitRate > 0.7 ? 'text-green-600' :
                      stats.hitRate > 0.4 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {(stats.hitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Entries:</span>
                    <span>{stats.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Hits:</span>
                    <span className="text-green-600">{stats.hits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Misses:</span>
                    <span className="text-red-600">{stats.misses}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Issues and Recommendations */}
      {(healthReport.issues.length > 0 || healthReport.recommendations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Health Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthReport.issues.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2 text-red-600">Issues:</h4>
                <ul className="space-y-1">
                  {healthReport.issues.map((issue: string, index: number) => (
                    <li key={index} className="text-sm text-red-600 flex items-center gap-2">
                      <XCircle className="h-3 w-3" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {healthReport.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-blue-600">Recommendations:</h4>
                <ul className="space-y-1">
                  {healthReport.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-blue-600 flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}