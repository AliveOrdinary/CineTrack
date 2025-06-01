/**
 * Supabase Reports Client
 * Functions for managing content reports and moderation
 */

import { createClient } from '@/lib/supabase/client';
import { 
  Report, 
  CreateReportData, 
  UpdateReportData, 
  ReportWithReporter, 
  ReportStats,
  ReportStatus,
  ReportedContentType 
} from '@/types/reports';

const supabase = createClient();

/**
 * Create a new report
 */
export async function createReport(reportData: CreateReportData): Promise<Report> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create a report');
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      ...reportData
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating report:', error);
    throw new Error('Failed to create report');
  }

  return data;
}

/**
 * Get reports created by the current user
 */
export async function getUserReports(): Promise<ReportWithReporter[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to view reports');
  }

  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:users!reporter_id(id, username, avatar_url),
      reported_user:users!reported_user_id(id, username, avatar_url),
      moderator:users!moderator_id(id, username, avatar_url)
    `)
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user reports:', error);
    throw new Error('Failed to fetch reports');
  }

  return data || [];
}

/**
 * Get all reports (for moderators)
 */
export async function getAllReports(
  status?: ReportStatus,
  contentType?: ReportedContentType,
  limit: number = 50,
  offset: number = 0
): Promise<ReportWithReporter[]> {
  let query = supabase
    .from('reports')
    .select(`
      *,
      reporter:users!reporter_id(id, username, avatar_url),
      reported_user:users!reported_user_id(id, username, avatar_url),
      moderator:users!moderator_id(id, username, avatar_url)
    `);

  if (status) {
    query = query.eq('status', status);
  }

  if (contentType) {
    query = query.eq('reported_content_type', contentType);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching all reports:', error);
    throw new Error('Failed to fetch reports');
  }

  return data || [];
}

/**
 * Get a specific report by ID
 */
export async function getReport(reportId: string): Promise<ReportWithReporter | null> {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:users!reporter_id(id, username, avatar_url),
      reported_user:users!reported_user_id(id, username, avatar_url),
      moderator:users!moderator_id(id, username, avatar_url)
    `)
    .eq('id', reportId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Report not found
    }
    console.error('Error fetching report:', error);
    throw new Error('Failed to fetch report');
  }

  return data;
}

/**
 * Update a report (for moderators)
 */
export async function updateReport(
  reportId: string, 
  updateData: UpdateReportData
): Promise<Report> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to update reports');
  }

  // Add moderator_id and resolved_at if resolving
  const dataToUpdate = {
    ...updateData,
    moderator_id: user.id,
    ...(updateData.status === 'resolved' && !updateData.resolved_at && {
      resolved_at: new Date().toISOString()
    })
  };

  const { data, error } = await supabase
    .from('reports')
    .update(dataToUpdate)
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    console.error('Error updating report:', error);
    throw new Error('Failed to update report');
  }

  return data;
}

/**
 * Delete a report
 */
export async function deleteReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    console.error('Error deleting report:', error);
    throw new Error('Failed to delete report');
  }
}

/**
 * Get report statistics
 */
export async function getReportStats(): Promise<ReportStats> {
  const { data, error } = await supabase
    .rpc('get_report_stats');

  if (error) {
    console.error('Error fetching report stats:', error);
    throw new Error('Failed to fetch report statistics');
  }

  return data[0] || {
    total_reports: 0,
    pending_reports: 0,
    resolved_reports: 0,
    dismissed_reports: 0
  };
}

/**
 * Check if user has already reported specific content
 */
export async function hasUserReportedContent(
  contentType: ReportedContentType,
  contentId: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('reported_content_type', contentType)
    .eq('reported_content_id', contentId)
    .limit(1);

  if (error) {
    console.error('Error checking existing report:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Get reports for specific content
 */
export async function getContentReports(
  contentType: ReportedContentType,
  contentId: string
): Promise<ReportWithReporter[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:users!reporter_id(id, username, avatar_url),
      reported_user:users!reported_user_id(id, username, avatar_url),
      moderator:users!moderator_id(id, username, avatar_url)
    `)
    .eq('reported_content_type', contentType)
    .eq('reported_content_id', contentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching content reports:', error);
    throw new Error('Failed to fetch content reports');
  }

  return data || [];
} 