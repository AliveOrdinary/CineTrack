import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, createSuccessResponse } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated and has admin role
    const { data: { user } } = await (await supabase).auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const { data: profile } = await (await supabase)
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Since cache statistics are client-side, we'll return a structure
    // that can be used by the frontend to display cache management
    const cacheInfo = {
      message: 'Cache statistics are managed client-side',
      endpoints: {
        warm: '/api/admin/cache/warm',
        clear: '/api/admin/cache/clear',
        invalidate: '/api/admin/cache/invalidate',
      },
      note: 'Use the admin dashboard to view real-time cache statistics'
    };

    return createSuccessResponse(cacheInfo);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated and has admin role
    const { data: { user } } = await (await supabase).auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const { data: profile } = await (await supabase)
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Note: Actual cache clearing happens on the client side
    // This endpoint can be used to trigger cache clearing via server action
    
    return createSuccessResponse({
      message: 'Cache clear request received',
      note: 'Cache clearing is handled client-side via the admin dashboard'
    });
  } catch (error) {
    return handleApiError(error);
  }
}