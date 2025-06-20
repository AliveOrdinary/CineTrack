'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { User, Save, Loader2 } from 'lucide-react';

interface ProfileData {
  display_name: string;
  bio: string;
  avatar_url: string | null;
}

export function ProfileSettings() {
  const { user } = useUser();
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: user?.user_metadata?.display_name || '',
    bio: user?.user_metadata?.bio || '',
    avatar_url: user?.user_metadata?.avatar_url || null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarChange = (newAvatarUrl: string | null) => {
    setProfileData(prev => ({ ...prev, avatar_url: newAvatarUrl }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      const supabase = createClient();

      // Update user profile in database
      const { error: dbError } = await supabase
        .from('users')
        .update({
          display_name: profileData.display_name.trim(),
          bio: profileData.bio.trim() || null,
          avatar_url: profileData.avatar_url,
        })
        .eq('id', user.id);

      if (dbError) {
        throw new Error(`Failed to update profile: ${dbError.message}`);
      }

      // Update user metadata in auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: profileData.display_name.trim(),
          bio: profileData.bio.trim() || null,
          avatar_url: profileData.avatar_url,
        },
      });

      if (authError) {
        console.error('Failed to update auth metadata:', authError);
        // Don't throw here as the database update succeeded
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormChanged = () => {
    const original = {
      display_name: user?.user_metadata?.display_name || '',
      bio: user?.user_metadata?.bio || '',
      avatar_url: user?.user_metadata?.avatar_url || null,
    };

    return (
      profileData.display_name.trim() !== original.display_name ||
      profileData.bio.trim() !== (original.bio || '') ||
      profileData.avatar_url !== original.avatar_url
    );
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Authentication required</h3>
          <p className="text-muted-foreground">Please sign in to manage your profile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a profile picture to personalize your account. Images are automatically cropped to a square.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <AvatarUpload
              currentAvatarUrl={profileData.avatar_url}
              fallbackText={profileData.display_name?.charAt(0)?.toUpperCase() || 'U'}
              onAvatarChange={handleAvatarChange}
              userId={user.id}
              size="lg"
            />
            <div className="space-y-2">
              <h4 className="font-medium">Avatar Guidelines</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• JPEG, PNG, or WebP format</li>
                <li>• Maximum file size: 2MB</li>
                <li>• Square images work best</li>
                <li>• Avoid copyrighted content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Update your display name and bio. This information will be visible to other users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={profileData.display_name}
              onChange={(e) =>
                setProfileData(prev => ({ ...prev, display_name: e.target.value }))
              }
              placeholder="Your display name"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              This is how your name will appear to other users on the platform.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) =>
                setProfileData(prev => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Tell others about yourself..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {profileData.bio.length}/500 characters. Optional short bio visible on your profile.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Profile Changes</h4>
              <p className="text-sm text-muted-foreground">
                Save your changes to update your profile information.
              </p>
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={!isFormChanged() || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and settings. Some information cannot be changed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={user.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_id">User ID</Label>
              <Input
                id="user_id"
                value={user.id}
                disabled
                className="bg-muted font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Your unique user identifier.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Account Created</Label>
            <p className="text-sm text-muted-foreground">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}