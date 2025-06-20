import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, RateLimitConfigs } from '@/lib/rate-limit';

interface PrivacyStats {
  totalReviews: number;
  totalLists: number;
  publicReviews: number;
  publicLists: number;
  followersOnlyReviews: number;
  followersOnlyLists: number;
  privateReviews: number;
  privateLists: number;
  lastUpdated: string;
}

async function handleGetPrivacyStats(request: NextRequest) {
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

    // Get review statistics
    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select('visibility')
      .eq('user_id', user.id);

    if (reviewError) {
      console.error('Error fetching review stats:', reviewError);
      return NextResponse.json(
        { error: 'Failed to fetch review statistics' },
        { status: 500 }
      );
    }

    // Get list statistics
    const { data: lists, error: listError } = await supabase
      .from('lists')
      .select('is_public')
      .eq('user_id', user.id);

    if (listError) {
      console.error('Error fetching list stats:', listError);
      return NextResponse.json(
        { error: 'Failed to fetch list statistics' },
        { status: 500 }
      );
    }

    // Calculate review visibility distribution
    const reviewStats = reviews.reduce((acc, review) => {
      const visibility = review.visibility || 'public';
      acc[visibility] = (acc[visibility] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate list visibility distribution
    const listStats = lists.reduce((acc, list) => {
      const visibility = list.is_public ? 'public' : 'private';
      acc[visibility] = (acc[visibility] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stats: PrivacyStats = {
      totalReviews: reviews.length,
      totalLists: lists.length,
      publicReviews: reviewStats.public || 0,
      publicLists: listStats.public || 0,
      followersOnlyReviews: reviewStats.followers || 0,
      followersOnlyLists: 0, // Lists don't have followers-only option currently
      privateReviews: reviewStats.private || 0,
      privateLists: listStats.private || 0,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(
      { stats },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error getting privacy stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply standard rate limiting
export const GET = withRateLimit(RateLimitConfigs.api)(handleGetPrivacyStats);