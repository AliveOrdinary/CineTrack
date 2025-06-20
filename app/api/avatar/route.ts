import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, RateLimitConfigs } from '@/lib/rate-limit';

async function handleAvatarUpdate(request: NextRequest) {
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
    const { avatar_url } = body;

    // Validate avatar_url (can be null to remove avatar)
    if (avatar_url !== null && avatar_url !== undefined) {
      if (typeof avatar_url !== 'string' || avatar_url.trim() === '') {
        return NextResponse.json(
          { error: 'Invalid avatar URL' },
          { status: 400 }
        );
      }

      // Basic URL validation
      try {
        new URL(avatar_url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid avatar URL format' },
          { status: 400 }
        );
      }
    }

    // Update user profile in database
    const { error: dbError } = await supabase
      .from('users')
      .update({ 
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (dbError) {
      console.error('Error updating avatar in database:', dbError);
      return NextResponse.json(
        { error: 'Failed to update avatar' },
        { status: 500 }
      );
    }

    // Update user metadata in auth
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: avatar_url || null,
      },
    });

    if (authUpdateError) {
      console.error('Error updating auth metadata:', authUpdateError);
      // Don't fail the request as the database update succeeded
    }

    return NextResponse.json(
      { 
        success: true, 
        avatar_url: avatar_url || null,
        message: avatar_url ? 'Avatar updated successfully' : 'Avatar removed successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error handling avatar update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleAvatarDelete(request: NextRequest) {
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

    // Get current avatar URL to delete from storage
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Delete from storage if avatar exists
    if (userData.avatar_url) {
      try {
        // Extract file path from URL
        const url = new URL(userData.avatar_url);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts.slice(-2).join('/'); // userId/filename

        const { error: storageError } = await supabase.storage
          .from('avatars')
          .remove([fileName]);

        if (storageError) {
          console.error('Error deleting avatar from storage:', storageError);
          // Continue with database update even if storage deletion fails
        }
      } catch (urlError) {
        console.error('Error parsing avatar URL:', urlError);
        // Continue with database update
      }
    }

    // Update user profile to remove avatar
    const { error: dbError } = await supabase
      .from('users')
      .update({ 
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (dbError) {
      console.error('Error removing avatar from database:', dbError);
      return NextResponse.json(
        { error: 'Failed to remove avatar' },
        { status: 500 }
      );
    }

    // Update user metadata in auth
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: null,
      },
    });

    if (authUpdateError) {
      console.error('Error updating auth metadata:', authUpdateError);
      // Don't fail the request as the database update succeeded
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Avatar removed successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error handling avatar deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to avatar operations
export const PUT = withRateLimit(RateLimitConfigs.api)(handleAvatarUpdate);
export const DELETE = withRateLimit(RateLimitConfigs.api)(handleAvatarDelete);