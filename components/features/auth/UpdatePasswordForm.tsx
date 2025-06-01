'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Supabase handles the recovery token from the URL automatically when the page loads
  // if it was initiated by a magic link / recovery link.
  // We listen for the PASSWORD_RECOVERY event to confirm this stage.
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMessage('You can now set your new password.');
        // The session should now contain the user, even if they weren't logged in.
        // The user is in a state where they can update their password.
      } else if (event === 'USER_UPDATED') {
        // This event fires after a successful password update via updateUser
        // setMessage('Password updated successfully! You can now log in.');
        // setTimeout(() => router.push('/login'), 3000); // Redirect after a delay
      }
    });

    // Check if there's an error in the URL params (e.g., from Supabase redirect)
    const errorParam = searchParams.get('error');
    const errorDescriptionParam = searchParams.get('error_description');
    if (errorParam) {
      setError(errorDescriptionParam || 'An error occurred during password recovery.');
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [searchParams, router]);

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      // The user should be in a recovery session state here
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }
      
      setMessage('Password updated successfully! Redirecting to login...');
      // Clear form or show success state before redirect
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        router.push('/login');
      }, 2000); // Delay redirect for message visibility

    } catch (err: any) {
      console.error('Update password error:', err);
      setError(err.message || 'Failed to update password. Please try again or request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdatePassword} className="w-full max-w-sm space-y-6">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          minLength={6}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
      {message && (
        <p className="text-sm text-green-500 dark:text-green-400">{message}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Updating Password...' : 'Update Password'}
      </Button>
      <div className="mt-4 text-center text-sm">
        Remembered your password? Or need to request a new link?{' '}
        <Link href="/login" legacyBehavior={false} className="font-medium text-primary underline-offset-4 hover:underline">
          Back to Login
        </Link>
      </div>
    </form>
  );
} 