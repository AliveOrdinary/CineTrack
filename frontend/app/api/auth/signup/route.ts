import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestBody = await request.json()
  const { email, password } = requestBody
  
  // Create a Supabase client
  const supabase = createRouteHandlerClient({ cookies })
  
  // Sign up
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
    },
  })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  
  return NextResponse.json({ 
    user: data.user,
    message: 'Registration successful! Please check your email to confirm your account.',
  })
} 