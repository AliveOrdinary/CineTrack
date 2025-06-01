import { Metadata } from 'next';
import { NotificationCenter } from '@/components/features/notifications/NotificationCenter';

export const metadata: Metadata = {
  title: 'Notifications | CineTrack',
  description: 'View and manage your notifications',
};

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Stay up to date with activity on your content and from people you follow.
        </p>
      </div>
      
      <NotificationCenter />
    </div>
  );
} 