"use client";

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import AuthPrompt from './auth-prompt';
import useUser from '../hooks/useUser';

type WithAuthProps = {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  showPrompt?: boolean | 'modal' | 'banner' | 'inline';
  promptMessage?: string;
};

/**
 * Higher-order component that conditionally renders content based on authentication state
 * 
 * @param children The content to render when authenticated
 * @param fallback Optional fallback content to render when not authenticated
 * @param redirectTo Optional path to redirect to when not authenticated
 * @param showPrompt Whether to show an auth prompt when not authenticated
 * @param promptMessage Optional custom message for the auth prompt
 */
export default function WithAuth({
  children,
  fallback,
  redirectTo,
  showPrompt = true,
  promptMessage,
}: WithAuthProps) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // If still loading auth state, show nothing or a loading indicator
  if (isLoading) {
    return null;
  }

  // If authenticated, show the children
  if (user) {
    return <>{children}</>;
  }

  // If not authenticated and redirectTo is specified, redirect
  if (redirectTo) {
    router.push(redirectTo);
    return null;
  }

  // If not authenticated and showPrompt is true, show the auth prompt
  if (showPrompt) {
    const variant = typeof showPrompt === 'string' ? showPrompt : 'inline';
    
    // Show both the auth prompt and the fallback if provided
    return (
      <>
        <AuthPrompt
          variant={variant as 'modal' | 'banner' | 'inline'}
          message={promptMessage}
        />
        {fallback}
      </>
    );
  }

  // If not authenticated and no prompt, show the fallback
  return <>{fallback}</> || null;
} 