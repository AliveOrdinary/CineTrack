import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminDashboard } from '@/components/features/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard - CineTrack',
  description: 'Administrative dashboard for managing users, analytics, and platform health.',
};

async function checkAdminAccess() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?message=Authentication required');
  }

  // Check if user has admin role
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/profile?message=Profile not found');
  }

  // Only allow admin role (stricter than moderation)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasAdminAccess = profile.role === 'admin';

  if (!isDevelopment && !hasAdminAccess) {
    redirect('/?message=Access denied - Administrator privileges required');
  }

  return { user, profile };
}

export default async function AdminPage() {
  // Check access before rendering
  await checkAdminAccess();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, monitor platform health, and view analytics
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded text-sm text-blue-800 dark:text-blue-200">
            <strong>Development Mode:</strong> Admin access granted for development purposes
          </div>
        )}
      </div>

      <AdminDashboard />
    </div>
  );
}
