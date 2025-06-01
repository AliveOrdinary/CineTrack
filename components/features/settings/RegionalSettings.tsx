'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPreferences, LANGUAGE_LABELS, REGION_LABELS, DATE_FORMAT_LABELS, Language, Region, DateFormat } from '@/types/preferences';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface RegionalSettingsProps {
  preferences: UserPreferences;
}

export function RegionalSettings({ preferences }: RegionalSettingsProps) {
  const { updateRegional } = useUserPreferences();

  const handleLanguageChange = async (language: Language) => {
    try {
      await updateRegional({ language });
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const handleRegionChange = async (region: Region) => {
    try {
      await updateRegional({ region });
    } catch (error) {
      console.error('Failed to update region:', error);
    }
  };

  const handleDateFormatChange = async (date_format: DateFormat) => {
    try {
      await updateRegional({ date_format });
    } catch (error) {
      console.error('Failed to update date format:', error);
    }
  };

  const handleTimezoneChange = async (timezone: string) => {
    try {
      await updateRegional({ timezone });
    } catch (error) {
      console.error('Failed to update timezone:', error);
    }
  };

  // Common timezones
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Australia/Melbourne'
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-base">Language</Label>
          <p className="text-sm text-muted-foreground">
            Choose your preferred language for the interface
          </p>
          <Select
            value={preferences.language}
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-base">Region</Label>
          <p className="text-sm text-muted-foreground">
            Your region affects content recommendations and regional settings
          </p>
          <Select
            value={preferences.region}
            onValueChange={handleRegionChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REGION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-base">Timezone</Label>
          <p className="text-sm text-muted-foreground">
            Used for displaying dates and times in your local timezone
          </p>
          <Select
            value={preferences.timezone}
            onValueChange={handleTimezoneChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((timezone) => (
                <SelectItem key={timezone} value={timezone}>
                  {timezone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-base">Date Format</Label>
          <p className="text-sm text-muted-foreground">
            How dates are displayed throughout the application
          </p>
          <Select
            value={preferences.date_format}
            onValueChange={handleDateFormatChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_FORMAT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
} 