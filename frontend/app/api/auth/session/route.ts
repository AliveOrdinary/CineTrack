import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  // Create a Supabase client
  const supabase = createRouteHandlerClient({ cookies })
  
  // Get current session
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  if (!session) {
    return NextResponse.json({ status: 'SIGNED_OUT', message: 'No session found' })
  }
  
  return NextResponse.json({
    status: 'SIGNED_IN',
    session: {
      user: {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at,
      },
      expires_at: session.expires_at,
    }
  })
} 