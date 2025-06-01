'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import SocialLogins from './SocialLogins';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user && data.session === null) {
        setMessage('Signup successful! Please check your email to confirm your account.');
      } else if (data.user && data.session) {
        setMessage('Signup successful! You are now logged in.');
        router.push('/');
      } else {
        setMessage('Signup successful! Please check your email.');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <form onSubmit={handleSignup} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            type="text"
            placeholder="Your Name"
            required
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            disabled={loading}
          />
        </div>
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            disabled={loading}
            minLength={6}
          />
        </div>
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        {message && <p className="text-sm text-green-500 dark:text-green-400">{message}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing up...' : 'Create Account'}
        </Button>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link
            href="/login"
            legacyBehavior={false}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </div>
      </form>
      <SocialLogins />
    </div>
  );
}
