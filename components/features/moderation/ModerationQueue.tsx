'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  List,
  User,
  Flag,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  type ReportWithReporter,
  ReportStatus,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
} from '@/types/reports';

interface ModerationQueueProps {
  reports: ReportWithReporter[];
  isLoading: boolean;
  onReportSelect: (report: ReportWithReporter) => void;
  onReportUpdated: () => void;
}

export function ModerationQueue({
  reports,
  isLoading,
  onReportSelect,
  onReportUpdated,
}: ModerationQueueProps) {
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

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'review':
        return <MessageSquare className="h-4 w-4" />;
      case 'list':
        return <List className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'spam':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'harassment':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'hate_speech':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'inappropriate_content':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'violence':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No reports found</h3>
          <p className="text-muted-foreground">No reports match the current filters</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reports ({reports.length})</h3>
      </div>

      <div className="space-y-4">
        {reports.map(report => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {getContentTypeIcon(report.reported_content_type)}
                    <span className="text-sm font-medium capitalize">
                      {report.reported_content_type}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getReasonColor(report.reason)}>
                        {REPORT_REASON_LABELS[report.reason]}
                      </Badge>

                      <Badge className={getStatusColor(report.status)}>
                        {getStatusIcon(report.status)}
                        <span className="ml-1">{REPORT_STATUS_LABELS[report.status]}</span>
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>Reported by:</span>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={report.reporter.avatar_url} />
                          <AvatarFallback>
                            {report.reporter.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{report.reporter.display_name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span>Target:</span>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={report.reported_user.avatar_url} />
                          <AvatarFallback>
                            {report.reported_user.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{report.reported_user.display_name}</span>
                      </div>

                      <span>
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReportSelect(report)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Review
                </Button>
              </div>
            </CardHeader>

            {report.details && (
              <CardContent className="pt-0">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>Details:</strong> {report.details}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
