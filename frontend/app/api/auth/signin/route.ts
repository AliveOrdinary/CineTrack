import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestBody = await request.json()
  const { email, password, redirectTo } = requestBody
  
  // Create a Supabase client
  const supabase = createRouteHandlerClient({ cookies })
  
  // Sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  
  // Directly redirect to the target page
  const redirectUrl = redirectTo || '/profile'
  return NextResponse.json({ 
    success: true,
    user: data.user,
    redirectTo: redirectUrl,
  })
} 