import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, RateLimitConfigs } from '@/lib/rate-limit';
import { VisibilityLevel } from '@/types/preferences';

interface BulkUpdateRequest {
  reviews?: VisibilityLevel;
  lists?: 'public' | 'private';
  watchlist?: VisibilityLevel;
  activity?: VisibilityLevel;
  updateDefaults?: boolean;
}

async function handleBulkUpdate(request: NextRequest) {
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
    const body: BulkUpdateRequest = await request.json();
    const { reviews, lists, watchlist, activity, updateDefaults = true } = body;

    // Validate input
    const validVisibilityLevels: VisibilityLevel[] = ['public', 'followers', 'private'];
    
    if (reviews && !validVisibilityLevels.includes(reviews)) {
      return NextResponse.json(
        { error: 'Invalid review visibility level' },
        { status: 400 }
      );
    }

    if (lists && !['public', 'private'].includes(lists)) {
      return NextResponse.json(
        { error: 'Invalid list visibility level' },
        { status: 400 }
      );
    }

    if (watchlist && !validVisibilityLevels.includes(watchlist)) {
      return NextResponse.json(
        { error: 'Invalid watchlist visibility level' },
        { status: 400 }
      );
    }

    if (activity && !validVisibilityLevels.includes(activity)) {
      return NextResponse.json(
        { error: 'Invalid activity visibility level' },
        { status: 400 }
      );
    }

    const updatedCounts = {
      reviews: 0,
      lists: 0,
    };

    const errors: any[] = [];

    // Update reviews
    if (reviews) {
      try {
        // Get count of affected reviews first
        const { count: reviewCount } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        updatedCounts.reviews = reviewCount || 0;

        // Update reviews
        const { error: reviewError } = await supabase
          .from('reviews')
          .update({ visibility: reviews })
          .eq('user_id', user.id);

        if (reviewError) {
          errors.push(reviewError);
        }
      } catch (error) {
        errors.push(error);
      }
    }

    // Update lists
    if (lists) {
      try {
        // Get count of affected lists first
        const { count: listCount } = await supabase
          .from('lists')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        updatedCounts.lists = listCount || 0;

        // Update lists
        const { error: listError } = await supabase
          .from('lists')
          .update({ is_public: lists === 'public' })
          .eq('user_id', user.id);

        if (listError) {
          errors.push(listError);
        }
      } catch (error) {
        errors.push(error);
      }
    }
    
    // Check for errors in content updates
    if (errors.length > 0) {
      console.error('Errors in bulk update:', errors);
      return NextResponse.json(
        { error: 'Some updates failed. Please try again.' },
        { status: 500 }
      );
    }

    // Update default preferences if requested
    if (updateDefaults) {
      const preferenceUpdates: Record<string, any> = {};
      
      if (reviews) {
        preferenceUpdates.default_review_visibility = reviews;
      }
      if (lists) {
        preferenceUpdates.default_list_visibility = lists;
      }
      if (watchlist) {
        preferenceUpdates.default_watchlist_visibility = watchlist;
      }
      if (activity) {
        preferenceUpdates.default_activity_visibility = activity;
      }

      if (Object.keys(preferenceUpdates).length > 0) {
        const { error: prefError } = await supabase
          .from('user_preferences')
          .update({
            ...preferenceUpdates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (prefError) {
          console.error('Error updating preferences:', prefError);
          // Don't fail the request as content updates succeeded
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Bulk privacy update completed successfully',
        updated: updatedCounts,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in bulk privacy update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to bulk updates (more restrictive)
export const POST = withRateLimit({
  limit: 5,
  window: 300, // 5 requests per 5 minutes
  message: 'Too many bulk updates. Please wait before trying again.',
})(handleBulkUpdate);