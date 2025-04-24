'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useUser from '@/hooks/useUser';
import UserAvatar from '@/components/user-avatar';
import ProfileForm from '@/components/profile-form';
import { UserProfile } from '@cinetrack/shared/types';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

// Tab types
type ProfileTab = 'overview' | 'edit' | 'activity';

// Type for follow counts
interface FollowCounts {
  followers: number;
  following: number;
}

// Re-use or redefine fetchFollowCounts (can be moved to a service later)
const fetchFollowCounts = async (userId: string): Promise<FollowCounts> => {
    const supabase = createClient();
    const [followersRes, followingRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
    ]);
    if (followersRes.error || followingRes.error) {
        console.error("Error fetching follow counts:", followersRes.error || followingRes.error);
        // Return 0 counts on error, or re-throw based on desired behavior
        return { followers: 0, following: 0 }; 
    }
    return {
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
    };
};

export default function ProfilePage() {
  // Rely on useUser hook for auth state and profile data
  const { 
      user, 
      userData, 
      isLoading: isUserLoading,
      signOut, 
      error: userHookError,
      updateUserData, 
      uploadAvatar 
  } = useUser();
  
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  // Fetch Follow Counts for the logged-in user
  const { 
      data: followCounts, 
      isLoading: isLoadingCounts, 
      error: countsError 
  } = useQuery<FollowCounts, Error>({
      queryKey: ['followCounts', user?.id],
      queryFn: () => fetchFollowCounts(user!.id),
      enabled: !!user,
      staleTime: 5 * 60 * 1000,
  });

  // Redirect to login if not authenticated AFTER loading completes
  useEffect(() => {
    if (!isUserLoading && !user) {
      console.log('Profile page: No user found after loading, redirecting to login');
      router.push('/login?redirect=/profile');
    }
  }, [isUserLoading, user, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      // Redirect is handled by useUser or middleware now
      console.log('Sign out initiated, should redirect automatically');
      // Fallback push if needed, but might cause hydration errors if middleware races
      // router.push('/'); 
    } catch (err) {
      console.error('Error signing out:', err);
      setSignOutError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  // Combine loading states
  const isLoading = isUserLoading || (!!user && isLoadingCounts);
  // Combine error states
  const error = userHookError || (countsError instanceof Error ? countsError : null);

  // Show loading state while the useUser hook is loading or counts are loading
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-4xl mx-auto bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-800">
          <div className="animate-pulse flex flex-col md:flex-row items-center md:items-start gap-6">
             <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full flex-shrink-0" />
             <div className="flex-1 space-y-3 text-center md:text-left">
                 <Skeleton className="h-8 w-3/4 mx-auto md:mx-0" />
                 <Skeleton className="h-4 w-1/2 mx-auto md:mx-0" />
                 <div className="flex justify-center md:justify-start gap-4 mt-4">
                     <Skeleton className="h-5 w-16" />
                     <Skeleton className="h-5 w-16" />
                     <Skeleton className="h-5 w-20" />
                 </div>
             </div>
          </div>
        </div>
         {/* Skeleton for tabs/content */}
         <div className="w-full max-w-4xl mx-auto mt-6">
             <Skeleton className="h-12 w-full rounded-t-lg border-b border-gray-800" />
             <Skeleton className="h-64 w-full rounded-b-lg" />
         </div>
      </div>
    );
  }

  // Handle errors from useUser hook or counts query
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-4xl mx-auto bg-gray-900 p-8 rounded-lg shadow-lg border border-red-800">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Error Loading Profile</h1>
          <p className="text-gray-300 mb-4">There was a problem loading your profile information:</p>
          <div className="bg-gray-800 p-4 rounded-md mb-6">
            <p className="text-red-400">{String(error)}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Handle sign out specific errors
  if (signOutError) {
    // Same as before
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-4xl mx-auto bg-gray-900 p-8 rounded-lg shadow-lg border border-red-800">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Sign Out Error</h1>
          <p className="text-gray-300 mb-4">There was a problem signing out:</p>
          <div className="bg-gray-800 p-4 rounded-md mb-6">
            <p className="text-red-400">{signOutError}</p>
          </div>
          <button
            onClick={() => setSignOutError(null)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // If loading is done, but we still don't have a user or userData, show an error.
  if (!user || !userData) {
     // Same as before
     return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-4xl mx-auto bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-800">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <p className="text-gray-300 mb-4">
            Could not load user session or profile data. Please try logging in again.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push('/login?redirect=/profile')}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render profile page if user and userData are available --- 
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-800 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <UserAvatar 
              avatarUrl={userData.avatar_url} 
              name={userData.display_name} 
              email={user.email} 
              size="xl"
            />
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-1">{userData.display_name}</h1>
              <p className="text-gray-400 mt-1">{user.email}</p>
              
              {userData.bio && (
                <p className="mt-4 text-gray-300">{userData.bio}</p>
              )}
              
              <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-gray-400">
                  {/* Link Follower/Following Counts */}
                   <Link href={`/profile/${user.id}/followers`} className="hover:text-white cursor-pointer">
                    <span className="font-bold text-white">{followCounts?.followers ?? 0}</span> Followers
                  </Link>
                  <Link href={`/profile/${user.id}/following`} className="hover:text-white cursor-pointer">
                    <span className="font-bold text-white">{followCounts?.following ?? 0}</span> Following
                  </Link>
                
                {userData.region && (
                  <span className="flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.33 6.33a6 6 0 1111.34 0 6 6 0 01-11.34 0zM10 4a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
                     </svg>
                     {userData.region}
                  </span>
                )}
                <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                     </svg>
                    Joined: {new Date(userData.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Profile tabs */}
        <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800">
          <div className="border-b border-gray-800">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')} 
                className={`px-4 py-3 font-medium text-sm ${ 
                  activeTab === 'overview' 
                    ? 'text-blue-400 border-b-2 border-blue-400' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('edit')} 
                className={`px-4 py-3 font-medium text-sm ${ 
                  activeTab === 'edit' 
                    ? 'text-blue-400 border-b-2 border-blue-400' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Edit Profile
              </button>
              <button
                onClick={() => setActiveTab('activity')} 
                className={`px-4 py-3 font-medium text-sm ${ 
                  activeTab === 'activity' 
                    ? 'text-blue-400 border-b-2 border-blue-400' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Activity
              </button>
            </nav>
          </div>
          
          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Profile Overview</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">Account Information</h3>
                    <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Display Name:</span>
                        <span>{userData.display_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span>{user.email}</span>
                      </div>
                      {userData.region && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Region:</span>
                          <span>{userData.region}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Member Since:</span>
                        <span>{new Date(userData.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">Account Management</h3>
                    <div className="bg-gray-800 rounded-lg p-4">
                      {userData.role === 'admin' && (
                        <Link 
                          href="/admin" 
                          className="w-full flex justify-center items-center py-2 px-4 border border-blue-500 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-3"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'edit' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Edit Your Profile</h2>
                <ProfileForm 
                  userData={userData} 
                  onProfileUpdate={updateUserData} 
                  onAvatarUpload={uploadAvatar}
                  user={user} 
                />
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <p className="text-gray-400">Your recent activity will appear here.</p>
                {/* Activity will be implemented in future updates */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}