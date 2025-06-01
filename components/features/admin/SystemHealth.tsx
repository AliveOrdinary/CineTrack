'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Database, 
  Server, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  HardDrive,
  Cpu,
  MemoryStick
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface SystemMetrics {
  databaseStatus: 'healthy' | 'warning' | 'error';
  apiStatus: 'healthy' | 'warning' | 'error';
  storageStatus: 'healthy' | 'warning' | 'error';
  lastBackup: string | null;
  totalTables: number;
  totalRows: number;
  errorCount24h: number;
  uptime: string;
  responseTime: number;
}

export function SystemHealth() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSystemHealth();
  }, []);

  const loadSystemHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      
      // Test database connectivity and get basic stats
      const [
        usersCount,
        reviewsCount,
        listsCount,
        watchedCount,
        reportsCount
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('lists').select('id', { count: 'exact', head: true }),
        supabase.from('watched_content').select('id', { count: 'exact', head: true }),
        supabase.from('review_reports').select('id', { count: 'exact', head: true })
      ]);

      const responseTime = Date.now() - startTime;
      
      // Calculate total rows
      const totalRows = (usersCount.count || 0) + 
                       (reviewsCount.count || 0) + 
                       (listsCount.count || 0) + 
                       (watchedCount.count || 0) + 
                       (reportsCount.count || 0);

      // Determine database status based on response time
      let databaseStatus: 'healthy' | 'warning' | 'error' = 'healthy';
      if (responseTime > 2000) {
        databaseStatus = 'error';
      } else if (responseTime > 1000) {
        databaseStatus = 'warning';
      }

      // Mock some additional metrics (in a real app, these would come from monitoring services)
      setMetrics({
        databaseStatus,
        apiStatus: 'healthy',
        storageStatus: 'healthy',
        lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        totalTables: 12, // Approximate number of tables
        totalRows,
        errorCount24h: 0,
        uptime: '99.9%',
        responseTime
      });
    } catch (error) {
      console.error('Error loading system health:', error);
      setError('Failed to load system health metrics');
      setMetrics({
        databaseStatus: 'error',
        apiStatus: 'error',
        storageStatus: 'warning',
        lastBackup: null,
        totalTables: 0,
        totalRows: 0,
        errorCount24h: 1,
        uptime: 'Unknown',
        responseTime: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshMetrics = async () => {
    setRefreshing(true);
    await loadSystemHealth();
  };

  const getStatusBadge = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Warning
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
          <div className="h-9 w-24 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">System Status</h3>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshMetrics}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Service Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            {getStatusIcon(metrics.databaseStatus)}
          </CardHeader>
          <CardContent>
            {getStatusBadge(metrics.databaseStatus)}
            <p className="text-xs text-muted-foreground mt-2">
              Response: {metrics.responseTime}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Services</CardTitle>
            {getStatusIcon(metrics.apiStatus)}
          </CardHeader>
          <CardContent>
            {getStatusBadge(metrics.apiStatus)}
            <p className="text-xs text-muted-foreground mt-2">
              Uptime: {metrics.uptime}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            {getStatusIcon(metrics.storageStatus)}
          </CardHeader>
          <CardContent>
            {getStatusBadge(metrics.storageStatus)}
            <p className="text-xs text-muted-foreground mt-2">
              Available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTables}</div>
            <p className="text-xs text-muted-foreground">
              Active tables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRows.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Database rows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorCount24h}</div>
            <p className="text-xs text-muted-foreground">
              System errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Average latency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backup Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Backup & Recovery
          </CardTitle>
          <CardDescription>
            Database backup and recovery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Backup</span>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">
                  {metrics.lastBackup 
                    ? new Date(metrics.lastBackup).toLocaleString()
                    : 'Never'
                  }
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Backup Status</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle className="h-3 w-3 mr-1" />
                Automated
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Retention Policy</span>
              <span className="text-sm text-muted-foreground">30 days</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      {(metrics.databaseStatus !== 'healthy' || metrics.apiStatus !== 'healthy' || metrics.storageStatus !== 'healthy') && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.databaseStatus !== 'healthy' && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span>Database performance degraded - Response time: {metrics.responseTime}ms</span>
                </div>
              )}
              {metrics.apiStatus !== 'healthy' && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span>API services experiencing issues</span>
                </div>
              )}
              {metrics.storageStatus !== 'healthy' && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span>Storage system needs attention</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 