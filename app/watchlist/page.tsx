import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WatchlistContent } from '@/components/features/watchlist/WatchlistContent';

export default async function WatchlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/watchlist');
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Watchlist</h1>
        <p className="text-muted-foreground">Movies and TV shows you want to watch later</p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse" />
            ))}
          </div>
        }
      >
        <WatchlistContent />
      </Suspense>
    </div>
  );
}
