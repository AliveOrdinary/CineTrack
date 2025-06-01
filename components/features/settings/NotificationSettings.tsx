'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UserPreferences } from '@/types/preferences';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Separator } from '@/components/ui/separator';

interface NotificationSettingsProps {
  preferences: UserPreferences;
}

export function NotificationSettings({ preferences }: NotificationSettingsProps) {
  const { updateNotifications } = useUserPreferences();

  const handleNotificationChange = async (key: keyof UserPreferences, value: boolean) => {
    try {
      await updateNotifications({ [key]: value });
    } catch (error) {
      console.error('Failed to update notification setting:', error);
    }
  };

  const notificationSettings = [
    {
      key: 'email_notifications' as keyof UserPreferences,
      label: 'Email Notifications',
      description: 'Receive notifications via email',
    },
    {
      key: 'push_notifications' as keyof UserPreferences,
      label: 'Push Notifications',
      description: 'Receive push notifications in your browser',
    },
  ];

  const socialNotifications = [
    {
      key: 'notify_on_follow' as keyof UserPreferences,
      label: 'New Followers',
      description: 'When someone follows you',
    },
    {
      key: 'notify_on_review_like' as keyof UserPreferences,
      label: 'Review Likes',
      description: 'When someone likes your review',
    },
    {
      key: 'notify_on_review_comment' as keyof UserPreferences,
      label: 'Review Comments',
      description: 'When someone comments on your review',
    },
    {
      key: 'notify_on_list_like' as keyof UserPreferences,
      label: 'List Likes',
      description: 'When someone likes your list',
    },
    {
      key: 'notify_on_list_comment' as keyof UserPreferences,
      label: 'List Comments',
      description: 'When someone comments on your list',
    },
  ];

  const systemNotifications = [
    {
      key: 'notify_on_recommendation' as keyof UserPreferences,
      label: 'Recommendations',
      description: 'Personalized content recommendations',
    },
    {
      key: 'notify_on_system_updates' as keyof UserPreferences,
      label: 'System Updates',
      description: 'Important updates and announcements',
    },
  ];

  return (
    <div className="space-y-6">
      {/* General Notifications */}
      <div>
        <h3 className="text-lg font-medium mb-4">General</h3>
        <div className="space-y-4">
          {notificationSettings.map(setting => (
            <div key={setting.key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">{setting.label}</Label>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch
                checked={preferences[setting.key] as boolean}
                onCheckedChange={(checked: boolean) =>
                  handleNotificationChange(setting.key, checked)
                }
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Social Notifications */}
      <div>
        <h3 className="text-lg font-medium mb-4">Social Activity</h3>
        <div className="space-y-4">
          {socialNotifications.map(setting => (
            <div key={setting.key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">{setting.label}</Label>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch
                checked={preferences[setting.key] as boolean}
                onCheckedChange={(checked: boolean) =>
                  handleNotificationChange(setting.key, checked)
                }
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* System Notifications */}
      <div>
        <h3 className="text-lg font-medium mb-4">System</h3>
        <div className="space-y-4">
          {systemNotifications.map(setting => (
            <div key={setting.key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">{setting.label}</Label>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <Switch
                checked={preferences[setting.key] as boolean}
                onCheckedChange={(checked: boolean) =>
                  handleNotificationChange(setting.key, checked)
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
