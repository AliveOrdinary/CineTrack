'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import useUser from '@/hooks/useUser';
import { useToast } from "@/hooks/use-toast";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const redirectTo = redirectPath || '/';
  const mode = searchParams.get('mode');
  
  const { user, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  
  const supabase = createClient();

  useEffect(() => {
    if (!isUserLoading && user) {
      console.log('Login page: User authenticated via hook, redirecting to:', redirectTo);
      toast({
        title: "Already Logged In",
      });
      router.push(redirectTo);
    }
  }, [isUserLoading, user, router, redirectTo, toast]);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) throw signUpError;

        toast({
          title: "Account Created",
          description: "Please check your email to confirm your account.",
        });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
      }
    } catch (authError: any) {
      console.error('Authentication error:', authError);
      const message = authError.message || 'Authentication failed. Please try again.';
      setError(message);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-800 animate-pulse">
        <div className="h-8 bg-gray-800 rounded mb-6 w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-800 rounded mb-2 w-1/4"></div>
        <div className="h-10 bg-gray-800 rounded mb-4"></div>
        <div className="h-4 bg-gray-800 rounded mb-2 w-1/4"></div>
        <div className="h-10 bg-gray-800 rounded mb-6"></div>
        <div className="h-10 bg-gray-800 rounded w-full"></div>
        <div className="h-6 bg-gray-800 rounded mt-6 w-1/2 mx-auto"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="w-full max-w-md bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-800">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {isSignUp ? 'Create an Account' : 'Sign In to CineTrack'}
      </h1>
      
      {redirectPath && (
        <div className="p-3 mb-4 rounded text-sm bg-blue-900 text-blue-200">
          Sign in to access {redirectPath.startsWith('/') ? redirectPath.substring(1) : redirectPath}
        </div>
      )}
      
      {error && (
        <div 
          className="p-3 mb-4 rounded text-sm bg-red-900 text-red-200"
        >
          {error}
        </div>
      )}
      
      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Enter your password"
            minLength={6}
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          disabled={isSubmitting}
          className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
} 