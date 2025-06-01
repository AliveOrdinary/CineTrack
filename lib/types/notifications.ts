export type NotificationType = 
  | 'follow'
  | 'review_like'
  | 'review_comment'
  | 'list_like'
  | 'list_comment'
  | 'recommendation'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  follow: boolean;
  review_like: boolean;
  review_comment: boolean;
  list_like: boolean;
  list_comment: boolean;
  recommendation: boolean;
  system: boolean;
  email_notifications: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
} 