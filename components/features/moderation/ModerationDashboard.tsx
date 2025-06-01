'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  BarChart3,
  Users,
  Flag,
} from 'lucide-react';
import { getAllReports, getReportStats } from '@/lib/supabase/reports';
import {
  ReportStatus,
  ReportedContentType,
  REPORT_STATUS_LABELS,
  REPORT_REASON_LABELS,
  type ReportWithReporter,
} from '@/types/reports';
import { ModerationQueue } from './ModerationQueue';
import { ModerationStats } from './ModerationStats';
import { ReportDetailsModal } from './ReportDetailsModal';

export function ModerationDashboard() {
  const [reports, setReports] = useState<ReportWithReporter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportWithReporter | null>(null);
  const [activeTab, setActiveTab] = useState('queue');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('pending');
  const [contentTypeFilter, setContentTypeFilter] = useState<ReportedContentType | 'all'>('all');

  useEffect(() => {
    loadReports();
  }, [statusFilter, contentTypeFilter]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const reportsData = await getAllReports(
        statusFilter === 'all' ? undefined : statusFilter,
        contentTypeFilter === 'all' ? undefined : contentTypeFilter,
        100
      );
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportUpdated = () => {
    loadReports();
    setSelectedReport(null);
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'reviewed':
        return <AlertTriangle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'dismissed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Moderation Queue
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value: ReportStatus | 'all') => setStatusFilter(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Under Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Content Type</label>
                  <Select
                    value={contentTypeFilter}
                    onValueChange={(value: ReportedContentType | 'all') =>
                      setContentTypeFilter(value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="review">Reviews</SelectItem>
                      <SelectItem value="list">Lists</SelectItem>
                      <SelectItem value="user">Users</SelectItem>
                      <SelectItem value="comment">Comments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={loadReports} disabled={isLoading}>
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Queue */}
          <ModerationQueue
            reports={reports}
            isLoading={isLoading}
            onReportSelect={setSelectedReport}
            onReportUpdated={handleReportUpdated}
          />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <ModerationStats />
        </TabsContent>
      </Tabs>

      {/* Report Details Modal */}
      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          onReportUpdated={handleReportUpdated}
        />
      )}
    </div>
  );
}
