import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, RateLimitConfigs } from '@/lib/rate-limit';
import { createReport } from '@/lib/supabase/reports';
import { type CreateReportData, type ReportReason, type ReportedContentType } from '@/types/reports';

async function handleCreateReport(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reported_content_type, reported_content_id, reported_user_id, reason, details } = body;

    // Validate required fields
    if (!reported_content_type || !reported_content_id || !reported_user_id || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate content type
    const validContentTypes: ReportedContentType[] = ['review', 'list', 'user', 'comment'];
    if (!validContentTypes.includes(reported_content_type)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons: ReportReason[] = [
      'spam',
      'harassment',
      'hate_speech',
      'inappropriate_content',
      'copyright_violation',
      'misinformation',
      'violence',
      'other'
    ];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid report reason' },
        { status: 400 }
      );
    }

    // Create report data
    const reportData: CreateReportData = {
      reported_content_type,
      reported_content_id,
      reported_user_id,
      reason,
      details: details?.trim() || undefined,
    };

    // Create the report
    const report = await createReport(reportData);

    return NextResponse.json(
      { 
        success: true, 
        report: {
          id: report.id,
          created_at: report.created_at,
          status: report.status
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating report:', error);
    
    if (error instanceof Error && error.message.includes('already reported')) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

// Apply strict rate limiting for reporting
export const POST = withRateLimit(RateLimitConfigs.moderation)(handleCreateReport);