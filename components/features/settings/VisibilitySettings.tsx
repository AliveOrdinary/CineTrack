'use client';

import { PrivacyControls } from './PrivacyControls';
import { UserPreferences } from '@/types/preferences';

interface VisibilitySettingsProps {
  preferences: UserPreferences;
}

export function VisibilitySettings({ preferences }: VisibilitySettingsProps) {
  return <PrivacyControls preferences={preferences} />;
}
