'use client';

import { useState, useMemo } from 'react';
import { Database } from '@cinetrack/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import useUser from '@/hooks/useUser';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId: string;
  reportedContentType: 'review' | 'comment'; // For future use, currently only 'review'
  reviewContent?: string | null; // Optional content for context
}

type ReportInsert = Database['public']['Tables']['content_reports']['Insert'];

export function ReportDialog({ 
  open, 
  onOpenChange, 
  reviewId, 
  reportedContentType,
  reviewContent
}: ReportDialogProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [reason, setReason] = useState('');

  const { mutate: submitReport, isPending } = useMutation<
    unknown, // Return type from insert (can be improved if needed)
    Error,
    { reason: string }
  >({
    mutationFn: async ({ reason }) => {
      if (!user) throw new Error('User not logged in.');
      if (!reason.trim()) throw new Error('Reason cannot be empty.');

      const reportData: ReportInsert = {
        reporter_user_id: user.id,
        reported_content_id: reviewId,
        reported_content_type: reportedContentType,
        reason: reason.trim(),
        // status defaults to 'pending' in the DB
      };

      const { error } = await supabase.from('content_reports').insert(reportData);

      if (error) {
        console.error("Error submitting report:", error);
        throw error;
      }
      return true; // Indicate success
    },
    onSuccess: () => {
      toast({ title: "Report Submitted", description: "Thank you, we will review your report." });
      setReason(''); // Clear reason
      onOpenChange(false); // Close dialog
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Report Failed",
        description: error.message || "Could not submit report. Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
       toast({ variant: "destructive", title: "Reason Required", description: "Please provide a reason for the report." });
       return;
    }
    submitReport({ reason });
  };

  // Close dialog resets reason
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setReason('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Please explain why you are reporting this {reportedContentType}. Your report is anonymous to the user.
          </DialogDescription>
        </DialogHeader>
        {reviewContent && (
           <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-md max-h-24 overflow-y-auto">
             <p className="text-sm text-gray-400 italic line-clamp-3">{reviewContent}</p>
           </div>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="reason" className="sr-only">
              Reason
            </Label>
            <Textarea
              id="reason"
              placeholder={`Reason for reporting this ${reportedContentType}...`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
              disabled={isPending}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || !reason.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 