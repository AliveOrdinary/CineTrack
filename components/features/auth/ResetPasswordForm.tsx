'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client'; // Uncomment Supabase client

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    // setIsSubmitted(false); // Keep true if already submitted, or reset based on desired UX

    try {
      // Ensure window.location.origin is available (client-side)
      const redirectTo = `${window.location.origin}/auth/update-password`;
      // Note: The /auth/update-password page needs to be created to handle the actual password update.

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        throw resetError;
      }

      setMessage(
        'If an account exists for this email, a password reset link has been sent. Please check your inbox.'
      );
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setIsSubmitted(false); // Allow retry if error occurs
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted && !error) {
    // Only show success message if no error and submitted
    return (
      <div className="w-full max-w-sm space-y-6 text-center">
        <h2 className="text-2xl font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link href="/login" legacyBehavior={false} className="inline-block w-full">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handlePasswordReset} className="w-full max-w-sm space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>
      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      {/* Display message here as well if needed, e.g. for non-submitted success before redirect or specific info messages */}
      {/* {!isSubmitted && message && <p className="text-sm text-green-500 dark:text-green-400">{message}</p>} */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending...' : 'Send Password Reset Email'}
      </Button>
      <div className="mt-4 text-center text-sm">
        Remember your password?{' '}
        <Link
          href="/login"
          legacyBehavior={false}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </div>
    </form>
  );
}
