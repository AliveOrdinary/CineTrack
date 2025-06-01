'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Heart, MessageCircle, UserPlus, Star, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Notification, NotificationType } from '@/lib/types/notifications';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  follow: UserPlus,
  review_like: Heart,
  review_comment: MessageCircle,
  list_like: Heart,
  list_comment: MessageCircle,
  recommendation: Star,
  system: Bell,
};

const notificationColors: Record<NotificationType, string> = {
  follow: 'text-blue-500',
  review_like: 'text-red-500',
  review_comment: 'text-green-500',
  list_like: 'text-purple-500',
  list_comment: 'text-orange-500',
  recommendation: 'text-yellow-500',
  system: 'text-gray-500',
};

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const Icon = notificationIcons[notification.type];
  const iconColor = notificationColors[notification.type];

  const handleMarkAsRead = async () => {
    if (notification.read) return;
    
    setIsMarkingRead(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(notification.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const getNotificationLink = () => {
    const { type, data } = notification;
    
    switch (type) {
      case 'follow':
        return `/profile/${data.follower_id}`;
      case 'review_like':
      case 'review_comment':
        return `/movie/${data.movie_id || data.tv_id}#reviews`;
      case 'list_like':
      case 'list_comment':
        return `/lists/${data.list_id}`;
      case 'recommendation':
        return `/movie/${data.movie_id}`;
      default:
        return null;
    }
  };

  const link = getNotificationLink();

  const NotificationContent = () => (
    <div className={cn(
      "flex items-start gap-3 p-4 transition-colors",
      !notification.read && "bg-blue-50 dark:bg-blue-950/20"
    )}>
      <div className={cn("flex-shrink-0 mt-1", iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm text-foreground">
              {notification.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {notification.message}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <time className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </time>
              {!notification.read && (
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                disabled={isMarkingRead}
                className="h-8 w-8 p-0"
                aria-label="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              aria-label="Delete notification"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <a 
          href={link}
          className="block hover:bg-muted/50 transition-colors"
          onClick={!notification.read ? handleMarkAsRead : undefined}
        >
          <NotificationContent />
        </a>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <NotificationContent />
    </Card>
  );
} 