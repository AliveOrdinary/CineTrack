import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRateLimit, RateLimitConfigs } from '@/lib/rate-limit';

async function handleConfirm(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/'; // Default redirect to home page

  if (token_hash && type) {
    const supabase = await createClient(); // Uses cookies from the request
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
      options: { redirectTo: next }, // It seems verifyOtp doesn't directly use redirectTo here.
      // The redirect below handles it.
    });

    if (!error) {
      // If verification is successful, redirect to 'next' or '/' (home)
      // The user's session should be active now.
      return NextResponse.redirect(new URL(next, request.url).toString());
    }
  }

  // If verification fails or parameters are missing, redirect to an error page or login with an error message.
  // For simplicity, redirecting to login with an error query param.
  // A dedicated /auth/error page would be better for UX.
  const redirectUrl = new URL('/login', request.url);
  redirectUrl.searchParams.set(
    'error',
    'Email verification failed. Please try again or contact support.'
  );
  if (!token_hash || !type) {
    redirectUrl.searchParams.set('error', 'Invalid confirmation link. Missing token or type.');
  }
  return NextResponse.redirect(redirectUrl);
}

export const GET = withRateLimit(RateLimitConfigs.auth)(handleConfirm);
