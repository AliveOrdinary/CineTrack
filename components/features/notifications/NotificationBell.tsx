'use client';

import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationItem } from './NotificationItem';
import Link from 'next/link';

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    deleteNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  // Show only the 5 most recent notifications in the dropdown
  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 p-0"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center min-w-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <div key={notification.id} className="p-0">
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Link href="/notifications" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" className="w-full text-sm">
                View All Notifications
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 