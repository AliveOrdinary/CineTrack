import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('Auth callback: Processing with code:', code ? '✓ Present' : '✗ Missing');
  
  // Supabase requires a code to exchange for a session
  if (!code) {
    console.error('Auth callback: No code provided in URL');
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
  }
  
  // Create client
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    console.log('Auth callback: Exchanging code for session...');
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback: Error exchanging code:', error.message);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }
    
    // Verify we have a session after exchange
    const { data } = await supabase.auth.getSession()
    console.log('Auth callback: Session after exchange:', data.session ? '✓ Created' : '✗ Missing');
    
    if (!data.session) {
      console.error('Auth callback: No session after exchange');
      return NextResponse.redirect(new URL('/login?error=no_session_created', request.url))
    }
    
    console.log('Auth callback: Success! User ID:', data.session.user.id);
    
    // Successfully authenticated, redirect to profile page
    return NextResponse.redirect(new URL('/profile', request.url))
  } catch (err) {
    console.error('Auth callback: Unexpected error:', err);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Unexpected error during authentication')}`, request.url)
    )
  }
} 