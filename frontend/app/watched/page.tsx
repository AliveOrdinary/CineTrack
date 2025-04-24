'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useUser from '@/hooks/useUser';

export default function WatchedPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/watched');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Watched List</h1>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="aspect-[2/3] bg-gray-800"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-800 rounded mb-2"></div>
                  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Watched List</h1>
      
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Your watched list is empty</h2>
        <p className="text-gray-400 mb-6">
          Start adding movies and TV shows that you've watched to keep track of your viewing history.
        </p>
        <div className="flex justify-center gap-4">
          <Link 
            href="/movies" 
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Browse Movies
          </Link>
          <Link 
            href="/tv" 
            className="inline-block px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          >
            Browse TV Shows
          </Link>
        </div>
      </div>
    </div>
  );
} 