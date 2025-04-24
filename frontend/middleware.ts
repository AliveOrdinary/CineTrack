import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware'; // Use the new middleware client utility

// Define protected routes that require authentication
const PROTECTED_ROUTES = ['/profile', '/settings', '/library', '/lists', '/create-list'];
const PUBLIC_ROUTES_NEEDING_REDIRECT = ['/login', '/signup'];

export async function middleware(req: NextRequest) {
  // Use the utility function to create a Supabase client and get the initial response
  const { supabase, response } = createClient(req);

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  // Check if the current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the current path is a public auth route (login/signup)
  const isAuthRoute = PUBLIC_ROUTES_NEEDING_REDIRECT.some(route => pathname === route);

  // Log for debugging
  console.log(`[Middleware] Path: ${pathname}, Protected: ${isProtectedRoute}, Auth: ${isAuthRoute}, User: ${user ? 'found' : 'not found'}`);

  // Case 1: Protected route but no authenticated user
  if (isProtectedRoute && !user) {
    console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to login`);
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case 2: Auth route (login/signup) with authenticated user
  if (isAuthRoute && user) {
    console.log(`[Middleware] Redirecting authenticated user from ${pathname} to home`);
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }

  // If none of the above conditions are met, continue with the request
  // The response object has potentially been modified by createClient
  // to refresh the session cookie
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     * - .well-known (well-known routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api|.well-known).*) ',
  ],
}; 