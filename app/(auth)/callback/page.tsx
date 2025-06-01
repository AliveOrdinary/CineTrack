'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is primarily a fallback or intermediate loading page.
// The actual OAuth code exchange should be handled by `app/auth/callback/route.ts`.

export default function AuthCallbackClientPage() {
  const router = useRouter();

  useEffect(() => {
    // The server route app/auth/callback/route.ts should handle session exchange.
    // This client page will redirect based on the outcome handled by the server route or if user lands here directly.
    // Typically, after the server route processes the code, it redirects.
    // If the user is redirected here, we can try to push them to the homepage or login.
    
    // A small delay to allow any server-side session processing and redirection to occur.
    const timer = setTimeout(() => {
      // Check if a user session exists after the server-side callback might have run.
      // This check here is a bit indirect; ideally the server route handles the final redirect.
      // For now, we just redirect to home, assuming success, or user can navigate if stuck.
      router.replace('/'); 
    }, 1500); // Increased delay slightly

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-8 text-3xl font-bold">Authenticating...</h1>
      <p>Please wait while we complete your authentication. You will be redirected shortly.</p>
      {/* You can add a spinner component here */}
    </div>
  );
} 