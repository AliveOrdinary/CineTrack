"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useUser from '@/hooks/useUser';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

/**
 * Component that displays a login prompt if the user was redirected from a protected route
 */
export default function AuthPrompt() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [attemptedPath, setAttemptedPath] = useState('');
  const { user } = useUser();

  useEffect(() => {
    // Check if user is already logged in
    if (user) {
      setVisible(false);
      return;
    }

    // Check if user was redirected from a protected route
    const authRequired = searchParams.get('auth_required');
    const fromPath = searchParams.get('from');
    
    if (authRequired === 'true' && fromPath) {
      setVisible(true);
      setAttemptedPath(fromPath);
      
      // Remove the query parameters from URL without refreshing the page
      const url = new URL(window.location.href);
      url.searchParams.delete('auth_required');
      url.searchParams.delete('from');
      window.history.replaceState({}, '', url);
      
      // Auto-hide the prompt after 10 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, user]);
  
  if (!visible) return null;
  
  const getFeatureName = (path: string) => {
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/watchlist')) return 'watchlist';
    if (path.startsWith('/watched')) return 'watched history';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/lists')) return 'custom lists';
    return 'this feature';
  };
  
  const handleLogin = () => {
    const loginUrl = new URL('/login', window.location.origin);
    if (attemptedPath) {
      loginUrl.searchParams.set('redirect', attemptedPath || window.location.pathname);
    } else {
      loginUrl.searchParams.set('redirect', window.location.pathname);
    }
    setVisible(false);
    router.push(loginUrl.toString());
  };

  const handleSignUp = () => {
    const signupUrl = new URL('/login', window.location.origin);
    if (attemptedPath) {
      signupUrl.searchParams.set('redirect', attemptedPath || window.location.pathname);
    } else {
      signupUrl.searchParams.set('redirect', window.location.pathname);
    }
    signupUrl.searchParams.set('mode', 'signup');
    setVisible(false);
    router.push(signupUrl.toString());
  };

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <LogIn className="h-12 w-12 text-blue-500" />
          </div>
          <DialogTitle className="text-center text-xl">Authentication Required</DialogTitle>
          <DialogDescription className="text-center">
            You need to be signed in to access your {getFeatureName(attemptedPath)}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2 pt-4">
          <Button onClick={handleLogin}>
            Login
          </Button>
          <Button variant="outline" onClick={handleSignUp}>
            Sign Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 