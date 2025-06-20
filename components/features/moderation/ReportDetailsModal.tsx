'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  MessageSquare,
  List,
  Flag,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  type ReportWithReporter,
  ResolutionAction,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  RESOLUTION_ACTION_LABELS,
} from '@/types/reports';
import { updateReport, getReportedContent } from '@/lib/supabase/reports';
import { ReportedContentDisplay } from './ReportedContentDisplay';
import { toast } from 'sonner';

interface ReportDetailsModalProps {
  report: ReportWithReporter;
  isOpen: boolean;
  onClose: () => void;
  onReportUpdated: () => void;
}

export function ReportDetailsModal({
  report,
  isOpen,
  onClose,
  onReportUpdated,
}: ReportDetailsModalProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionAction, setResolutionAction] = useState<ResolutionAction>('no_action');
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [reportedContent, setReportedContent] = useState<any>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);

  // Fetch reported content when modal opens
  useEffect(() => {
    if (isOpen && report) {
      const fetchReportedContent = async () => {
        setIsLoadingContent(true);
        setContentError(null);
        
        try {
          const content = await getReportedContent(
            report.reported_content_type,
            report.reported_content_id
          );
          setReportedContent(content);
        } catch (error) {
          console.error('Error fetching reported content:', error);
          setContentError('Failed to load reported content');
        } finally {
          setIsLoadingContent(false);
        }
      };

      fetchReportedContent();
    }
  }, [isOpen, report]);

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

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
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

  const handleResolve = async () => {
    try {
      setIsResolving(true);

      await updateReport(report.id, {
        status: 'resolved',
        resolution_action: resolutionAction,
        moderator_notes: moderatorNotes.trim() || undefined,
        resolved_at: new Date().toISOString(),
      });

      toast.success('Report resolved successfully');
      onReportUpdated();
      onClose();
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
    } finally {
      setIsResolving(false);
    }
  };

  const handleDismiss = async () => {
    try {
      setIsResolving(true);

      await updateReport(report.id, {
        status: 'dismissed',
        moderator_notes: moderatorNotes.trim() || undefined,
      });

      toast.success('Report dismissed successfully');
      onReportUpdated();
      onClose();
    } catch (error) {
      console.error('Error dismissing report:', error);
      toast.error('Failed to dismiss report');
    } finally {
      setIsResolving(false);
    }
  };

  const handleMarkUnderReview = async () => {
    try {
      setIsResolving(true);

      await updateReport(report.id, {
        status: 'reviewed',
        moderator_notes: moderatorNotes.trim() || undefined,
      });

      toast.success('Report marked as under review');
      onReportUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Report Details
          </DialogTitle>
          <DialogDescription>Review and take action on this content report</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getContentTypeIcon(report.reported_content_type)}
                Report Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getReasonColor(report.reason)}>
                  {REPORT_REASON_LABELS[report.reason]}
                </Badge>
                <Badge className={getStatusColor(report.status)}>
                  {getStatusIcon(report.status)}
                  <span className="ml-1">{REPORT_STATUS_LABELS[report.status]}</span>
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Content Type</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {report.reported_content_type}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Content ID</h4>
                  <p className="text-sm text-muted-foreground font-mono">
                    {report.reported_content_id}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Reported</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                  </p>
                </div>
                {report.resolved_at && (
                  <div>
                    <h4 className="font-medium mb-2">Resolved</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(report.resolved_at), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>

              {report.details && (
                <div>
                  <h4 className="font-medium mb-2">Report Details</h4>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm">{report.details}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users Involved */}
          <Card>
            <CardHeader>
              <CardTitle>Users Involved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={report.reporter.avatar_url} />
                    <AvatarFallback>
                      {report.reporter.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">Reporter</h4>
                    <p className="text-sm text-muted-foreground">{report.reporter.display_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={report.reported_user.avatar_url} />
                    <AvatarFallback>
                      {report.reported_user.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">Reported User</h4>
                    <p className="text-sm text-muted-foreground">
                      {report.reported_user.display_name}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reported Content */}
          <ReportedContentDisplay
            contentType={report.reported_content_type}
            content={reportedContent}
            isLoading={isLoadingContent}
            error={contentError || undefined}
          />

          {/* Previous Resolution */}
          {(report.moderator || report.moderator_notes || report.resolution_action) && (
            <Card>
              <CardHeader>
                <CardTitle>Previous Resolution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.moderator && (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={report.moderator.avatar_url} />
                      <AvatarFallback>
                        {report.moderator.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">Moderator</h4>
                      <p className="text-sm text-muted-foreground">
                        {report.moderator.display_name}
                      </p>
                    </div>
                  </div>
                )}

                {report.resolution_action && (
                  <div>
                    <h4 className="font-medium mb-2">Action Taken</h4>
                    <Badge variant="outline">
                      {RESOLUTION_ACTION_LABELS[report.resolution_action]}
                    </Badge>
                  </div>
                )}

                {report.moderator_notes && (
                  <div>
                    <h4 className="font-medium mb-2">Moderator Notes</h4>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">{report.moderator_notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Moderation Actions */}
          {report.status !== 'resolved' && report.status !== 'dismissed' && (
            <Card>
              <CardHeader>
                <CardTitle>Take Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Resolution Action</label>
                  <Select
                    value={resolutionAction}
                    onValueChange={(value: ResolutionAction) => setResolutionAction(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RESOLUTION_ACTION_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Moderator Notes</label>
                  <Textarea
                    placeholder="Add notes about your decision..."
                    value={moderatorNotes}
                    onChange={e => setModeratorNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleResolve}
                    disabled={isResolving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isResolving ? 'Resolving...' : 'Resolve'}
                  </Button>

                  <Button onClick={handleDismiss} disabled={isResolving} variant="outline">
                    <XCircle className="h-4 w-4 mr-2" />
                    {isResolving ? 'Dismissing...' : 'Dismiss'}
                  </Button>

                  <Button onClick={handleMarkUnderReview} disabled={isResolving} variant="outline">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {isResolving ? 'Updating...' : 'Mark Under Review'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
