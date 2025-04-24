'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useUser from '@/hooks/useUser';
import { Button } from "@/components/ui/button"; 
import { PlusIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'; // Import Supabase client
// import { Tables } from '@cinetrack/shared/types'; // Type helper not found
type CustomList = any; // Use any for now

// Placeholder for list display component - replace later
// Cast list to any here as well
function ListCardPlaceholder({ list }: { list: any }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      <Link href={`/lists/${list.id}`}> {/* Link to list detail page (to be created) */}
        <h3 className="font-semibold text-lg mb-1 truncate">{list.name}</h3>
      </Link>
      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
        {list.description || 'No description'}
      </p>
      <div className="text-xs text-gray-500 flex justify-between items-center">
        <span>{list.is_public ? 'Public' : 'Private'}</span>
        <span>{/* TODO: Add item count later */}</span>
        {/* Ensure dates exist before formatting */}
        <span>Updated: {new Date(list.updated_at || list.created_at || Date.now()).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

export default function ListsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []); // Memoize Supabase client

  const [customLists, setCustomLists] = useState<CustomList[]>([]); // Use specific type
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/lists');
    }
  }, [isUserLoading, user, router]);

  // Fetch custom lists
  useEffect(() => {
    if (user && !isUserLoading) {
      const fetchData = async () => {
        setIsLoadingData(true);
        setError(null);
        setCustomLists([]); // Clear previous
        
        try {
          const { data, error: fetchError } = await supabase
            .from('custom_lists')
            .select('*') // Select all columns for now
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (fetchError) throw fetchError;

          setCustomLists(data || []);

        } catch (err: any) {
          console.error("Error fetching custom lists:", err);
          setError(err.message || "Failed to load your lists.");
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    }
    // Set loading false if user is not logged in after check
    if (!isUserLoading && !user) {
        setIsLoadingData(false);
    }
  }, [user, isUserLoading, supabase]);

  // Loading state for user session
  if (isUserLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="h-10 bg-gray-800 rounded w-32"></div>
          </div>
          <div className="h-20 bg-gray-800 rounded"></div> 
        </div>
      </div>
    );
  }

  // If loading finished but no user (should be redirected)
  if (!user) {
    return null; 
  }

  // Main content when user is loaded
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Lists</h1>
        <Link href="/create-list">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" /> Create List
          </Button>
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 mb-4 rounded text-sm bg-red-900 border border-red-700 text-red-200">
          Error: {error}
        </div>
      )}

      {/* List Display Area */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 min-h-[200px]">
        {isLoadingData ? (
          <div className="flex justify-center items-center h-full">
             <p className="text-gray-400">Loading your lists...</p>
          </div>
        ) : customLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customLists.map(list => (
              <ListCardPlaceholder key={list.id} list={list} /> 
            ))}
          </div>
        ) : (
           <div className="flex justify-center items-center h-full">
             <p className="text-gray-500">You haven't created any lists yet.</p>
          </div>
        )}
      </div>
    </div>
  );
} 