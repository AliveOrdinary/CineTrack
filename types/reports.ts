/**
 * Report System Types
 * Types for content reporting and moderation
 */

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'inappropriate_content'
  | 'copyright_violation'
  | 'misinformation'
  | 'violence'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export type ReportedContentType = 'review' | 'list' | 'user' | 'comment';

export type ResolutionAction =
  | 'no_action'
  | 'content_removed'
  | 'user_warned'
  | 'user_suspended'
  | 'user_banned';

export interface Report {
  id: string;
  reporter_id: string;
  reported_content_type: ReportedContentType;
  reported_content_id: string;
  reported_user_id: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  moderator_id?: string;
  moderator_notes?: string;
  resolution_action?: ResolutionAction;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface CreateReportData {
  reported_content_type: ReportedContentType;
  reported_content_id: string;
  reported_user_id: string;
  reason: ReportReason;
  details?: string;
}

export interface UpdateReportData {
  status?: ReportStatus;
  moderator_notes?: string;
  resolution_action?: ResolutionAction;
  resolved_at?: string;
}

export interface ReportWithReporter extends Report {
  reporter: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  reported_user: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  moderator?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface ReportStats {
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  dismissed_reports: number;
}

export interface ReportFormData {
  reason: ReportReason;
  details: string;
}

// Report reason labels for UI
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam or unwanted content',
  harassment: 'Harassment or bullying',
  hate_speech: 'Hate speech or discrimination',
  inappropriate_content: 'Inappropriate or offensive content',
  copyright_violation: 'Copyright violation',
  misinformation: 'False or misleading information',
  violence: 'Violence or threats',
  other: 'Other (please specify)',
};

// Report status labels for UI
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Pending Review',
  reviewed: 'Under Review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

// Resolution action labels for UI
export const RESOLUTION_ACTION_LABELS: Record<ResolutionAction, string> = {
  no_action: 'No Action Required',
  content_removed: 'Content Removed',
  user_warned: 'User Warned',
  user_suspended: 'User Suspended',
  user_banned: 'User Banned',
};
