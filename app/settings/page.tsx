import { Metadata } from 'next';
import { SettingsPage } from '@/components/features/settings/SettingsPage';

export const metadata: Metadata = {
  title: 'Settings - CineTrack',
  description: 'Customize your CineTrack experience with personalized settings and preferences.',
};

export default function Settings() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your CineTrack experience</p>
      </div>

      <SettingsPage />
    </div>
  );
}
