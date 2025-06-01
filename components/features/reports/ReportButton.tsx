'use client';

import { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReportForm } from './ReportForm';
import { ReportedContentType } from '@/types/reports';
import { hasUserReportedContent } from '@/lib/supabase/reports';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface ReportButtonProps {
  contentType: ReportedContentType;
  contentId: string;
  reportedUserId: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function ReportButton({
  contentType,
  contentId,
  reportedUserId,
  className,
  variant = 'ghost',
  size = 'sm',
  showText = false,
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkExistingReport();
  }, [contentType, contentId]);

  const checkExistingReport = async () => {
    try {
      setIsLoading(true);
      const reported = await hasUserReportedContent(contentType, contentId);
      setHasReported(reported);
    } catch (error) {
      console.error('Error checking existing report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportSubmitted = () => {
    setIsOpen(false);
    setHasReported(true);
    toast.success('Report submitted successfully');
  };

  if (isLoading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Flag className="h-4 w-4" />
        {showText && <span className="ml-2">Report</span>}
      </Button>
    );
  }

  if (hasReported) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={`${className} text-orange-600 dark:text-orange-400`}
        disabled
        title="You have already reported this content"
      >
        <AlertTriangle className="h-4 w-4" />
        {showText && <span className="ml-2">Reported</span>}
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className} title="Report this content">
          <Flag className="h-4 w-4" />
          {showText && <span className="ml-2">Report</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Help us maintain a safe and welcoming community by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>
        <ReportForm
          contentType={contentType}
          contentId={contentId}
          reportedUserId={reportedUserId}
          onSubmitted={handleReportSubmitted}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
