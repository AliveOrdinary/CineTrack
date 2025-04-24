'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@cinetrack/shared/types';
import { User } from '@supabase/supabase-js';
import AvatarUpload from './avatar-upload';

// Import Shadcn Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileFormProps {
  user: User;
  userData: UserProfile;
  onProfileUpdate: (updatedProfile: Partial<UserProfile>) => Promise<UserProfile | null>; 
  onAvatarUpload: (file: File) => Promise<string>; 
}

type ProfileFormData = {
  display_name: string;
  bio: string | null;
  region: string;
  avatar_url: string | null;
};

export default function ProfileForm({
  user,
  userData,
  onProfileUpdate,
  onAvatarUpload,
}: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: userData?.display_name || '',
    bio: userData?.bio || null,
    region: userData?.region || 'US',
    avatar_url: userData?.avatar_url || null,
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        display_name: userData.display_name || '',
        bio: userData.bio || null,
        region: userData.region || 'US',
        avatar_url: userData.avatar_url || null,
      });
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name in formData) {
      setFormData(prev => ({
        ...prev,
        [name]: (name === 'bio' || name === 'avatar_url') && value === '' ? null : value 
      }));
    }
    setSuccess(false);
    setError(null);
  };
  
  // Specific handler for Select component
  const handleRegionChange = (value: string) => {
      setFormData(prev => ({
        ...prev,
        region: value
      }));
      setSuccess(false);
      setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData: Partial<UserProfile> = {
        display_name: formData.display_name,
        bio: formData.bio === null ? undefined : formData.bio, 
        region: formData.region,
      };
      const updatedProfile = await onProfileUpdate(updateData);
      if (updatedProfile) {
        setSuccess(true);
      } else {
        throw new Error('Profile update failed: No data returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File): Promise<string> => {
    return await onAvatarUpload(file);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <div className="flex flex-col items-center">
          <AvatarUpload 
            url={formData.avatar_url}
            name={formData.display_name}
            email={user.email}
            onUpload={handleAvatarUpload} 
          />
        </div>
      </div>
      <div className="md:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name || ''} 
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Your public display name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio || ''} 
              onChange={handleChange}
              rows={4}
              disabled={isLoading}
              placeholder="Tell us a little about yourself"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="region">Region</Label>
            <Select 
              value={formData.region || 'US'} 
              onValueChange={handleRegionChange}
              disabled={isLoading}
              name="region"
            >
              <SelectTrigger id="region">
                <SelectValue placeholder="Select your region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                <SelectItem value="FR">France</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="JP">Japan</SelectItem>
                <SelectItem value="IN">India</SelectItem>
                <SelectItem value="BR">Brazil</SelectItem>
                <SelectItem value="KR">South Korea</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-900/50 border border-green-700 rounded-md text-green-300 text-sm">
              Profile updated successfully!
            </div>
          )}
          <div>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 