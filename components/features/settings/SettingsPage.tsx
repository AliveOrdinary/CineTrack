'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings, 
  Palette, 
  Bell, 
  Eye, 
  Globe, 
  Shield,
  Monitor,
  LogIn
} from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useUser } from '@/hooks/use-user';
import { ThemeSettings } from './ThemeSettings';
import { NotificationSettings } from './NotificationSettings';
import { VisibilitySettings } from './VisibilitySettings';
import { RegionalSettings } from './RegionalSettings';
import { ContentSettings } from './ContentSettings';
import { DisplaySettings } from './DisplaySettings';
import Link from 'next/link';

export function SettingsPage() {
  const { user } = useUser();
  const { preferences, isLoading, error } = useUserPreferences();
  const [activeTab, setActiveTab] = useState('theme');

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <LogIn className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sign in required</h3>
          <p className="text-muted-foreground mb-4">
            You need to be signed in to access your settings
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Sign In
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Error loading settings</h3>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No preferences found</h3>
          <p className="text-muted-foreground">
            Unable to load your preferences
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
        <TabsTrigger value="theme" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Theme</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="visibility" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Privacy</span>
        </TabsTrigger>
        <TabsTrigger value="regional" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Regional</span>
        </TabsTrigger>
        <TabsTrigger value="content" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Content</span>
        </TabsTrigger>
        <TabsTrigger value="display" className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          <span className="hidden sm:inline">Display</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & Appearance
              </CardTitle>
              <CardDescription>
                Customize how CineTrack looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSettings preferences={preferences} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Control when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings preferences={preferences} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visibility" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Privacy & Visibility
              </CardTitle>
              <CardDescription>
                Control who can see your content and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VisibilitySettings preferences={preferences} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>
                Set your language, region, and timezone preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegionalSettings preferences={preferences} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Content Preferences
              </CardTitle>
              <CardDescription>
                Control content filtering and safety features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentSettings preferences={preferences} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Display Settings
              </CardTitle>
              <CardDescription>
                Customize how content is displayed and formatted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DisplaySettings preferences={preferences} />
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  );
} 