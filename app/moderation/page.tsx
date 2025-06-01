import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ModerationDashboard } from '@/components/features/moderation/ModerationDashboard';

export const metadata: Metadata = {
  title: 'Moderation Dashboard - CineTrack',
  description: 'Review and manage reported content to maintain community standards.',
};

async function checkModeratorAccess() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login?message=Authentication required');
  }

  // Check if user has moderator role
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/profile?message=Profile not found');
  }

  // For now, allow access in development mode or if user has admin/moderator role
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasModeratorAccess = profile.role === 'admin' || profile.role === 'moderator';

  if (!isDevelopment && !hasModeratorAccess) {
    redirect('/?message=Access denied - Moderator privileges required');
  }

  return { user, profile };
}

export default async function ModerationPage() {
  // Check access before rendering
  await checkModeratorAccess();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Moderation Dashboard</h1>
        <p className="text-muted-foreground">
          Review reported content and maintain community standards
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Development Mode:</strong> Access granted for development purposes
          </div>
        )}
      </div>
      
      <ModerationDashboard />
    </div>
  );
} 