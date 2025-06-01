'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPreferences, VISIBILITY_LABELS, VisibilityLevel } from '@/types/preferences';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface VisibilitySettingsProps {
  preferences: UserPreferences;
}

export function VisibilitySettings({ preferences }: VisibilitySettingsProps) {
  const { updateVisibility } = useUserPreferences();

  const handleVisibilityChange = async (key: keyof UserPreferences, value: VisibilityLevel) => {
    try {
      await updateVisibility({ [key]: value });
    } catch (error) {
      console.error('Failed to update visibility setting:', error);
    }
  };

  const visibilitySettings = [
    {
      key: 'default_review_visibility' as keyof UserPreferences,
      label: 'Review Visibility',
      description: 'Who can see your reviews by default',
    },
    {
      key: 'default_list_visibility' as keyof UserPreferences,
      label: 'List Visibility',
      description: 'Who can see your lists by default',
    },
    {
      key: 'default_watchlist_visibility' as keyof UserPreferences,
      label: 'Watchlist Visibility',
      description: 'Who can see your watchlist by default',
    },
    {
      key: 'default_activity_visibility' as keyof UserPreferences,
      label: 'Activity Visibility',
      description: 'Who can see your activity feed by default',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Default Visibility</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Set the default visibility for your content. You can always change this for individual
          items.
        </p>
        <div className="space-y-6">
          {visibilitySettings.map(setting => (
            <div key={setting.key} className="space-y-2">
              <Label className="text-base">{setting.label}</Label>
              <p className="text-sm text-muted-foreground">{setting.description}</p>
              <Select
                value={preferences[setting.key] as string}
                onValueChange={(value: VisibilityLevel) =>
                  handleVisibilityChange(setting.key, value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
