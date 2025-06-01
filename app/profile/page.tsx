import { Suspense } from 'react';
import { ProfileContent } from '@/components/features/profile/ProfileContent';

export default function ProfilePage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-32 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                ))}
              </div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <ProfileContent />
      </Suspense>
    </div>
  );
}
