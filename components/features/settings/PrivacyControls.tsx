'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Globe, 
  Users, 
  Lock, 
  Settings,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { UserPreferences, VISIBILITY_LABELS, VisibilityLevel } from '@/types/preferences';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface PrivacyControlsProps {
  preferences: UserPreferences;
}

interface BulkUpdateOptions {
  reviews: VisibilityLevel;
  lists: VisibilityLevel;
  watchlist: VisibilityLevel;
  activity: VisibilityLevel;
}

interface PrivacyStats {
  totalReviews: number;
  totalLists: number;
  publicReviews: number;
  publicLists: number;
  followersOnlyReviews: number;
  followersOnlyLists: number;
  privateReviews: number;
  privateLists: number;
}

export function PrivacyControls({ preferences }: PrivacyControlsProps) {
  const { updateVisibility } = useUserPreferences();
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [privacyStats, setPrivacyStats] = useState<PrivacyStats | null>(null);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [bulkOptions, setBulkOptions] = useState<BulkUpdateOptions>({
    reviews: 'public',
    lists: 'public', 
    watchlist: 'public',
    activity: 'public',
  });
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const handleVisibilityChange = async (key: keyof UserPreferences, value: VisibilityLevel) => {
    try {
      await updateVisibility({ [key]: value });
      toast.success('Privacy setting updated');
    } catch (error) {
      console.error('Failed to update visibility setting:', error);
      toast.error('Failed to update privacy setting');
    }
  };

  const loadPrivacyStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch('/api/privacy/stats');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch privacy stats');
      }

      setPrivacyStats(data.stats);
    } catch (error) {
      console.error('Error loading privacy stats:', error);
      toast.error('Failed to load privacy statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleBulkUpdate = async () => {
    setIsBulkUpdating(true);
    try {
      const response = await fetch('/api/privacy/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviews: bulkOptions.reviews,
          lists: bulkOptions.lists,
          watchlist: bulkOptions.watchlist,
          activity: bulkOptions.activity,
          updateDefaults: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update privacy settings');
      }

      toast.success(data.message || 'Bulk privacy update completed');
      setIsBulkUpdateOpen(false);
      loadPrivacyStats(); // Refresh stats
    } catch (error) {
      console.error('Error during bulk update:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const getVisibilityIcon = (level: VisibilityLevel) => {
    switch (level) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-500" />;
      case 'followers':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'private':
        return <Lock className="h-4 w-4 text-red-500" />;
    }
  };

  const getVisibilityColor = (level: VisibilityLevel) => {
    switch (level) {
      case 'public':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'followers':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'private':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
  };

  const visibilitySettings = [
    {
      key: 'default_review_visibility' as keyof UserPreferences,
      label: 'Review Visibility',
      description: 'Who can see your reviews by default',
      icon: <Eye className="h-4 w-4" />,
    },
    {
      key: 'default_list_visibility' as keyof UserPreferences,
      label: 'List Visibility',
      description: 'Who can see your lists by default',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      key: 'default_watchlist_visibility' as keyof UserPreferences,
      label: 'Watchlist Visibility',
      description: 'Who can see your watchlist by default',
      icon: <EyeOff className="h-4 w-4" />,
    },
    {
      key: 'default_activity_visibility' as keyof UserPreferences,
      label: 'Activity Visibility',
      description: 'Who can see your activity feed by default',
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Default Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Default Privacy Settings
          </CardTitle>
          <CardDescription>
            Set the default visibility for your content. You can always change this for individual items.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {visibilitySettings.map(setting => (
            <div key={setting.key} className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                {setting.icon}
                <div>
                  <Label className="text-base font-medium">{setting.label}</Label>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={getVisibilityColor(preferences[setting.key] as VisibilityLevel)}
                >
                  {getVisibilityIcon(preferences[setting.key] as VisibilityLevel)}
                  <span className="ml-1">{VISIBILITY_LABELS[preferences[setting.key] as VisibilityLevel]}</span>
                </Badge>
                <Select
                  value={preferences[setting.key] as string}
                  onValueChange={(value: VisibilityLevel) =>
                    handleVisibilityChange(setting.key, value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          {getVisibilityIcon(value as VisibilityLevel)}
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Privacy Overview
          </CardTitle>
          <CardDescription>
            See how your content is currently distributed across privacy levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!privacyStats ? (
            <div className="text-center py-6">
              <Button onClick={loadPrivacyStats} disabled={isLoadingStats}>
                {isLoadingStats ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Load Privacy Statistics
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Reviews ({privacyStats.totalReviews} total)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Globe className="h-3 w-3 text-green-500" />
                        Public
                      </span>
                      <span>{privacyStats.publicReviews}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-blue-500" />
                        Followers Only
                      </span>
                      <span>{privacyStats.followersOnlyReviews}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Lock className="h-3 w-3 text-red-500" />
                        Private
                      </span>
                      <span>{privacyStats.privateReviews}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Lists ({privacyStats.totalLists} total)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Globe className="h-3 w-3 text-green-500" />
                        Public
                      </span>
                      <span>{privacyStats.publicLists}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Lock className="h-3 w-3 text-red-500" />
                        Private
                      </span>
                      <span>{privacyStats.privateLists}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadPrivacyStats}
                disabled={isLoadingStats}
              >
                {isLoadingStats ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Privacy Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Bulk Privacy Update
          </CardTitle>
          <CardDescription>
            Update the privacy settings for all your existing content at once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Update All Content Privacy</p>
              <p className="text-sm text-muted-foreground">
                This will change the privacy settings for all your existing reviews, lists, and activity.
              </p>
            </div>
            <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Bulk Update
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Bulk Privacy Update
                  </DialogTitle>
                  <DialogDescription>
                    This will update the privacy settings for all your existing content. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Update Reviews to:</Label>
                    <Select
                      value={bulkOptions.reviews}
                      onValueChange={(value: VisibilityLevel) =>
                        setBulkOptions(prev => ({ ...prev, reviews: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              {getVisibilityIcon(value as VisibilityLevel)}
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Update Lists to:</Label>
                    <Select
                      value={bulkOptions.lists}
                      onValueChange={(value: VisibilityLevel) =>
                        setBulkOptions(prev => ({ ...prev, lists: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-green-500" />
                            Public
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-red-500" />
                            Private
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBulkUpdateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkUpdate} disabled={isBulkUpdating}>
                    {isBulkUpdating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Settings className="h-4 w-4 mr-2" />
                    )}
                    Update All
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Public</p>
                <p className="text-sm text-muted-foreground">
                  Anyone can see this content, including search engines.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Followers Only</p>
                <p className="text-sm text-muted-foreground">
                  Only users who follow you can see this content.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium">Private</p>
                <p className="text-sm text-muted-foreground">
                  Only you can see this content.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}