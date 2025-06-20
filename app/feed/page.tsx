import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ActivityFeed } from '@/components/features/social/ActivityFeed';

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/feed');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ActivityFeed />
    </div>
  );
}
