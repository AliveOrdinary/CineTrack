import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, RateLimitConfigs } from '@/lib/rate-limit';

async function handleCreateReview(request: NextRequest) {
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
    const { tmdb_id, media_type, content, rating, contains_spoilers, is_anonymous } = body;

    // Validate required fields
    if (!tmdb_id || !media_type || !content || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate media type
    if (!['movie', 'tv'].includes(media_type)) {
      return NextResponse.json(
        { error: 'Invalid media type' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user already has a review for this content
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('tmdb_id', tmdb_id)
      .eq('media_type', media_type)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this content' },
        { status: 409 }
      );
    }

    // Create the review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        tmdb_id,
        media_type,
        content: content.trim(),
        rating,
        contains_spoilers: !!contains_spoilers,
        is_anonymous: !!is_anonymous,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        review: {
          id: review.id,
          created_at: review.created_at,
          rating: review.rating
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

async function handleGetReviews(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const tmdb_id = searchParams.get('tmdb_id');
    const media_type = searchParams.get('media_type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!tmdb_id || !media_type) {
      return NextResponse.json(
        { error: 'tmdb_id and media_type are required' },
        { status: 400 }
      );
    }

    const query = supabase
      .from('reviews')
      .select(`
        *,
        users!inner(display_name, avatar_url)
      `)
      .eq('tmdb_id', tmdb_id)
      .eq('media_type', media_type)
      .order('created_at', { ascending: false });

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reviews });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// Apply different rate limits for different operations
export const POST = withRateLimit(RateLimitConfigs.api)(handleCreateReview);
export const GET = withRateLimit(RateLimitConfigs.content)(handleGetReviews);