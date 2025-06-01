'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ReportedContentType,
  ReportReason,
  REPORT_REASON_LABELS,
  ReportFormData,
} from '@/types/reports';
import { createReport } from '@/lib/supabase/reports';
import { toast } from 'sonner';

const reportFormSchema = z.object({
  reason: z.enum([
    'spam',
    'harassment',
    'hate_speech',
    'inappropriate_content',
    'copyright_violation',
    'misinformation',
    'violence',
    'other',
  ] as const),
  details: z
    .string()
    .min(10, 'Please provide at least 10 characters of detail')
    .max(500, 'Details must be less than 500 characters'),
});

interface ReportFormProps {
  contentType: ReportedContentType;
  contentId: string;
  reportedUserId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

export function ReportForm({
  contentType,
  contentId,
  reportedUserId,
  onSubmitted,
  onCancel,
}: ReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reason: undefined,
      details: '',
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    try {
      setIsSubmitting(true);

      await createReport({
        reported_content_type: contentType,
        reported_content_id: contentId,
        reported_user_id: reportedUserId,
        reason: data.reason,
        details: data.details.trim(),
      });

      toast.success(
        'Report submitted successfully. Thank you for helping keep our community safe.'
      );
      onSubmitted();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="reason"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Reason for reporting</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Additional details</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please provide specific details about why you're reporting this content..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
