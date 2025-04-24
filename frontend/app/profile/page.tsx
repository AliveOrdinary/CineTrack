'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useUser from '@/hooks/useUser';
import UserAvatar from '@/components/user-avatar';
import ProfileForm from '@/components/profile-form';
import { UserProfile } from '@cinetrack/shared/types';

// Tab types
type ProfileTab = 'overview' | 'edit' | 'activity';

export default function ProfilePage() {
  // Rely on useUser hook for auth state and profile data
  const { user, userData, isLoading, signOut, error, updateUserData, uploadAvatar } = useUser();
  
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  // Redirect to login if not authenticated AFTER loading completes
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('Profile page: No user found after loading, redirecting to login');
      router.push('/login?redirect=/profile');
    }
  }, [isLoading, user, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      // Redirect is handled by useUser or middleware now
      // If onAuthStateChange fires, the useEffect above will redirect.
      // As a fallback, manually push to home.
      console.log('Sign out initiated, redirecting to home page');
      router.push('/');
    } catch (err) {
      console.error('Error signing out:', err);
      setSignOutError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  // Show loading state while the useUser hook is loading
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-4xl mx-auto bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-800">
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-12 bg-gray-800 rounded w-1/4"></div>
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2"></div>
            <div className="h-20 bg-gray-800 rounded w-full"></div>
            <div className="h-12 bg-gray-800 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle errors from useUser hook
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
  // This indicates a problem with the session or profile fetching in the hook.
  if (!user || !userData) {
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
              avatarUrl={userData.avatar_url} // Use userData directly
              name={userData.display_name} // Use userData directly
              email={user.email} // Use user from hook
              size="xl"
            />
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold">{userData.display_name}</h1>
              <p className="text-gray-400 mt-1">{user.email}</p>
              
              {userData.bio && (
                <p className="mt-4 text-gray-300">{userData.bio}</p>
              )}
              
              <div className="mt-4 flex flex-wrap gap-2">
                {userData.region && (
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                    Region: {userData.region}
                  </span>
                )}
                <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
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
                  userData={userData} // Pass userData from hook
                  // Pass the update function directly from the hook
                  onProfileUpdate={updateUserData} 
                  // Pass the upload function directly from the hook
                  onAvatarUpload={uploadAvatar}
                  user={user} // Pass user object if needed by ProfileForm
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