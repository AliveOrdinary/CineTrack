'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";
import useUser from '@/hooks/useUser';
import { UserProfile } from '@cinetrack/shared/types';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { user, userData, isLoading, updateUserData, error: userError } = useUser();
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<Record<string, any>>({
    emailNotifications: false,
    contentLanguage: 'en-US',
    autoplayTrailers: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('Settings page: No user found after loading, redirecting to login');
      router.push('/login?redirect=/settings');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (userData?.preferences) {
      try {
        const userPrefs = typeof userData.preferences === 'string' 
          ? JSON.parse(userData.preferences) 
          : userData.preferences;
          
        setPreferences(prev => ({
          emailNotifications: typeof userPrefs?.emailNotifications === 'boolean' ? userPrefs.emailNotifications : prev.emailNotifications,
          contentLanguage: typeof userPrefs?.contentLanguage === 'string' ? userPrefs.contentLanguage : prev.contentLanguage,
          autoplayTrailers: typeof userPrefs?.autoplayTrailers === 'boolean' ? userPrefs.autoplayTrailers : prev.autoplayTrailers,
        }));
      } catch (error) {
        console.error('Error parsing user preferences:', error);
      }
    }
  }, [userData]);

  const handleOtherSwitchChange = (key: keyof typeof preferences, checked: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: checked }));
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name in preferences) {
       setPreferences(prev => ({ ...prev, [name]: value }));
       setSaveSuccess(false);
       setSaveError(null);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) {
      setSaveError('User not authenticated');
      return;
    }
    
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      const profileUpdate: Partial<UserProfile> = {
        preferences: preferences
      };
      
      const updatedProfile = await updateUserData(profileUpdate);
      
      if (updatedProfile) {
        setSaveSuccess(true);
      } else {
        throw new Error('Failed to save preferences: No updated profile returned.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-4xl mx-auto bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-800">
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-12 bg-gray-800 rounded w-1/4"></div>
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2"></div>
            <div className="h-10 bg-gray-800 rounded mt-6 w-full"></div>
            <div className="h-10 bg-gray-800 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (userError) {
     return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full max-w-4xl mx-auto bg-gray-900 p-8 rounded-lg shadow-lg border border-red-800">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Error Loading Settings</h1>
          <p className="text-gray-300 mb-4">Could not load user data:</p>
          <div className="bg-gray-800 p-4 rounded-md mb-6">
            <p className="text-red-400">{String(userError)}</p>
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

  if (!user || !userData) {
    return null; 
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-6">
          <h2 className="text-xl font-semibold mb-6">Preferences</h2>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="contentLanguage" className="block text-sm font-medium text-gray-300 mb-2">
                Content Language
              </Label>
              <select
                id="contentLanguage"
                name="contentLanguage"
                value={preferences.contentLanguage}
                onChange={handleSelectChange}
                disabled={isSaving}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="en-US">English (US)</option>
                <option value="fr-FR">French</option>
                <option value="es-ES">Spanish</option>
                <option value="de-DE">German</option>
                <option value="ja-JP">Japanese</option>
                <option value="ko-KR">Korean</option>
                <option value="zh-CN">Chinese (Simplified)</option>
              </select>
              <p className="mt-1 text-sm text-gray-400">
                Language for content descriptions and information
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-800 p-4 rounded-md">
                <div>
                  <Label htmlFor="emailNotificationsSwitch" className="font-medium cursor-pointer">
                      Email Notifications
                  </Label>
                  <p className="text-sm text-gray-400">Receive updates about your watchlist and new releases</p>
                </div>
                <Switch
                  id="emailNotificationsSwitch"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => handleOtherSwitchChange('emailNotifications', checked)}
                  disabled={isSaving}
                  aria-label="Toggle email notifications"
                />
              </div>
              
              <div className="flex items-center justify-between bg-gray-800 p-4 rounded-md">
                <div>
                  <Label htmlFor="darkModeSwitch" className="font-medium cursor-pointer">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-gray-400">Use dark theme throughout the app</p>
                </div>
                 <Switch
                  id="darkModeSwitch"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  aria-label="Toggle dark mode"
                />
              </div>
              
              <div className="flex items-center justify-between bg-gray-800 p-4 rounded-md">
                <div>
                   <Label htmlFor="autoplayTrailersSwitch" className="font-medium cursor-pointer">
                    Autoplay Trailers
                  </Label>
                  <p className="text-sm text-gray-400">Automatically play trailers on movie/show pages</p>
                </div>
                <Switch
                  id="autoplayTrailersSwitch"
                  checked={preferences.autoplayTrailers}
                  onCheckedChange={(checked) => handleOtherSwitchChange('autoplayTrailers', checked)}
                  disabled={isSaving}
                  aria-label="Toggle autoplay trailers"
                />
              </div>
            </div>
            
            {saveError && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-sm">
                Error saving: {saveError}
              </div>
            )}
            
            {saveSuccess && (
              <div className="p-3 bg-green-900/50 border border-green-700 rounded-md text-green-300 text-sm">
                Preferences saved successfully.
              </div>
            )}
            
            <div>
              <Button
                onClick={handleSavePreferences}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Danger Zone - Placeholder */}
        {/* <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-red-500">Danger Zone</h2>
          <p className="text-gray-400 mb-4">
            Operations in this section can't be undone. Please proceed with caution.
          </p>
          
          <div className="space-y-4">
            <button
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              onClick={() => alert('Account deletion not implemented yet.')} // Placeholder
            >
              Delete Account
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
} 