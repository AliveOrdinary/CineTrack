'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function AuthStatusHeader() {
  const { user, loading } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
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
