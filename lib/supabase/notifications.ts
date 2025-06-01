import { createClient } from '@/lib/supabase/client';
import { Notification, CreateNotificationData, NotificationStats } from '@/lib/types/notifications';

const supabase = createClient();

export async function getNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data || [];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_notification_count', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }

  return data || 0;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

export async function deleteAllNotifications(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('user_id', userId);

  if (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
}

export async function createNotification(data: CreateNotificationData): Promise<Notification> {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return notification;
}

export async function getNotificationStats(userId: string): Promise<NotificationStats> {
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('type, read')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }

  const stats: NotificationStats = {
    total: notifications?.length || 0,
    unread: notifications?.filter(n => !n.read).length || 0,
    by_type: {
      follow: 0,
      review_like: 0,
      review_comment: 0,
      list_like: 0,
      list_comment: 0,
      recommendation: 0,
      system: 0,
    },
  };

  notifications?.forEach(notification => {
    stats.by_type[notification.type as keyof typeof stats.by_type]++;
  });

  return stats;
}

// Real-time subscription for notifications
export function subscribeToNotifications(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

// Helper functions for creating specific notification types
export async function createFollowNotification(
  targetUserId: string,
  followerName: string,
  followerId: string
): Promise<Notification> {
  return createNotification({
    user_id: targetUserId,
    type: 'follow',
    title: 'New Follower',
    message: `${followerName} started following you`,
    data: { follower_id: followerId, follower_name: followerName },
  });
}

export async function createReviewLikeNotification(
  reviewAuthorId: string,
  likerName: string,
  likerId: string,
  reviewId: string,
  movieTitle: string
): Promise<Notification> {
  return createNotification({
    user_id: reviewAuthorId,
    type: 'review_like',
    title: 'Review Liked',
    message: `${likerName} liked your review of "${movieTitle}"`,
    data: {
      liker_id: likerId,
      liker_name: likerName,
      review_id: reviewId,
      movie_title: movieTitle,
    },
  });
}

export async function createReviewCommentNotification(
  reviewAuthorId: string,
  commenterName: string,
  commenterId: string,
  reviewId: string,
  movieTitle: string
): Promise<Notification> {
  return createNotification({
    user_id: reviewAuthorId,
    type: 'review_comment',
    title: 'New Comment',
    message: `${commenterName} commented on your review of "${movieTitle}"`,
    data: {
      commenter_id: commenterId,
      commenter_name: commenterName,
      review_id: reviewId,
      movie_title: movieTitle,
    },
  });
}

export async function createListLikeNotification(
  listOwnerId: string,
  likerName: string,
  likerId: string,
  listId: string,
  listTitle: string
): Promise<Notification> {
  return createNotification({
    user_id: listOwnerId,
    type: 'list_like',
    title: 'List Liked',
    message: `${likerName} liked your list "${listTitle}"`,
    data: {
      liker_id: likerId,
      liker_name: likerName,
      list_id: listId,
      list_title: listTitle,
    },
  });
}

export async function createRecommendationNotification(
  targetUserId: string,
  recommenderName: string,
  recommenderId: string,
  movieTitle: string,
  movieId: string
): Promise<Notification> {
  return createNotification({
    user_id: targetUserId,
    type: 'recommendation',
    title: 'New Recommendation',
    message: `${recommenderName} recommended "${movieTitle}" to you`,
    data: {
      recommender_id: recommenderId,
      recommender_name: recommenderName,
      movie_id: movieId,
      movie_title: movieTitle,
    },
  });
}

export async function createSystemNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: 'system',
    title,
    message,
    data: data || {},
  });
}
