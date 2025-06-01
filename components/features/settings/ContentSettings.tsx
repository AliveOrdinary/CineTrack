'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UserPreferences } from '@/types/preferences';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Separator } from '@/components/ui/separator';

interface ContentSettingsProps {
  preferences: UserPreferences;
}

export function ContentSettings({ preferences }: ContentSettingsProps) {
  const { updateContent } = useUserPreferences();

  const handleContentChange = async (key: keyof UserPreferences, value: boolean) => {
    try {
      await updateContent({ [key]: value });
    } catch (error) {
      console.error('Failed to update content setting:', error);
    }
  };

  const contentSettings = [
    {
      key: 'adult_content' as keyof UserPreferences,
      label: 'Adult Content',
      description: 'Show adult/mature content in search results and recommendations',
      warning: true,
    },
    {
      key: 'spoiler_protection' as keyof UserPreferences,
      label: 'Spoiler Protection',
      description: 'Hide potential spoilers in reviews and discussions',
    },
    {
      key: 'auto_mark_watched' as keyof UserPreferences,
      label: 'Auto-mark as Watched',
      description: 'Automatically mark content as watched when you rate or review it',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Content Filtering</h3>
        <div className="space-y-4">
          {contentSettings.map(setting => (
            <div key={setting.key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">{setting.label}</Label>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
                {setting.warning && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    ⚠️ This setting affects content visibility across the platform
                  </p>
                )}
              </div>
              <Switch
                checked={preferences[setting.key] as boolean}
                onCheckedChange={(checked: boolean) => handleContentChange(setting.key, checked)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
