'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@cinetrack/shared/types';
import UserAvatar from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

// Function to fetch follower profiles
const fetchFollowers = async (userId: string): Promise<UserProfile[]> => {
  const supabase = createClient();

  // 1. Get follower IDs
  const { data: followData, error: followError } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId);

  if (followError) {
    console.error("Error fetching follower IDs:", followError);
    throw new Error('Could not fetch follower list.');
  }

  if (!followData || followData.length === 0) {
    return []; // No followers
  }

  const followerIds = followData.map(f => f.follower_id);

  // 2. Get profiles for those IDs
  const { data: profiles, error: profileError } = await supabase
    .from('users')
    .select('id, display_name, avatar_url') // Select necessary fields
    .in('id', followerIds);

  if (profileError) {
    console.error("Error fetching follower profiles:", profileError);
    throw new Error('Could not fetch follower profiles.');
  }

  return (profiles || []) as UserProfile[];
};

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);

  // Fetch the display name of the user whose followers we are viewing
  useEffect(() => {
      const fetchDisplayName = async () => {
          if (!userId) return;
          const supabase = createClient();
          const { data, error } = await supabase
              .from('users')
              .select('display_name')
              .eq('id', userId)
              .single();
          if (data) {
              setProfileDisplayName(data.display_name);
          }
      };
      fetchDisplayName();
  }, [userId]);

  const { data: followers, isLoading, error } = useQuery<UserProfile[], Error>({
    queryKey: ['followers', userId],
    queryFn: () => fetchFollowers(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <Skeleton className="h-6 w-1/4 mb-6" />
        <Skeleton className="h-8 w-1/3 mb-8" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Link href={`/profile/${userId}`} className="mb-6 inline-flex items-center text-sm text-blue-400 hover:text-blue-300">
             <ArrowLeft className="mr-2 h-4 w-4" />
             Back to Profile
        </Link>
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-400 mb-6">{error.message}</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
       <Link href={`/profile/${userId}`} className="mb-6 inline-flex items-center text-sm text-blue-400 hover:text-blue-300">
         <ArrowLeft className="mr-2 h-4 w-4" />
         Back to Profile
       </Link>

       <h1 className="text-3xl font-bold mb-8">Followers of {profileDisplayName || 'User'}</h1>

       {followers && followers.length > 0 ? (
         <div className="space-y-3">
           {followers.map((follower) => (
             <Link key={follower.id} href={`/profile/${follower.id}`} className="block hover:bg-gray-800 rounded-lg transition-colors">
               <div className="flex items-center gap-4 p-3 bg-gray-900 rounded-lg border border-gray-800">
                 <UserAvatar
                   avatarUrl={follower.avatar_url}
                   name={follower.display_name}
                   size="md"
                 />
                 <span className="font-medium text-white">{follower.display_name}</span>
                 {/* Optional: Add a follow button here too? */}
               </div>
            </Link>
           ))}
         </div>
       ) : (
         <div className="text-center py-16 bg-gray-900 rounded-lg border border-dashed border-gray-800">
           <p className="text-xl text-gray-400">This user doesn't have any followers yet.</p>
         </div>
       )}
    </div>
  );
} 