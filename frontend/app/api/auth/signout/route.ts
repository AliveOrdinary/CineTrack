import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // First check if we have a session
    const { data: { session } } = await supabase.auth.getSession()
    
    // Attempt to sign out even if there's no session (to be thorough)
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('API signout error:', error.message)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
    
    // Clear all auth cookies from the response
    const allCookies = cookieStore.getAll()
    for (const cookie of allCookies) {
      if (cookie.name.includes('supabase') || cookie.name.startsWith('sb-') || 
          cookie.name.includes('auth') || cookie.name === 'login_attempt') {
        cookieStore.delete(cookie.name)
      }
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Signed out successfully',
        redirectUrl: '/' // Always redirect to home page
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in signout API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Unknown error occurred during sign out',
        redirectUrl: '/' // Still redirect to home even on error
      },
      { status: 500 }
    )
  }
} 