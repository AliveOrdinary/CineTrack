'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import type { User } from '@supabase/supabase-js';

export default function AuthStatusHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getUserSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    }

    getUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        // Can add logic here if needed upon sign in, e.g. router.refresh()
      }
      if (event === 'SIGNED_OUT') {
        router.push('/'); // Redirect to home on logout
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      // Optionally show an error message to the user
    }
    // onAuthStateChange will handle redirect via SIGNED_OUT event
  };

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-md bg-muted"></div>; // Placeholder for loading state
  }

  return user ? (
    <div className="flex items-center gap-3">
      <span className="text-sm hidden sm:inline">{user.email}</span>
      <Button onClick={handleLogout} variant="outline" size="sm">
        Logout
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Login</Link>
      </Button>
      <Button asChild variant="default" size="sm">
        <Link href="/signup">Sign Up</Link>
      </Button>
    </div>
  );
} 