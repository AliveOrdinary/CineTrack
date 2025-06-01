'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserPreferences, THEME_LABELS } from '@/types/preferences';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeSettingsProps {
  preferences: UserPreferences;
}

export function ThemeSettings({ preferences }: ThemeSettingsProps) {
  const { updateThemePreference } = useUserPreferences();

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    try {
      await updateThemePreference(theme);
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Theme</Label>
        <p className="text-sm text-muted-foreground mb-4">Choose how CineTrack looks to you</p>
        <RadioGroup
          value={preferences.theme}
          onValueChange={handleThemeChange}
          className="grid grid-cols-1 gap-4"
        >
          {Object.entries(THEME_LABELS).map(([value, label]) => (
            <div key={value} className="flex items-center space-x-3">
              <RadioGroupItem value={value} id={`theme-${value}`} />
              <Label htmlFor={`theme-${value}`} className="flex items-center gap-2 cursor-pointer">
                {getThemeIcon(value)}
                {label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
