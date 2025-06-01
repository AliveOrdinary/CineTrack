'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  subscribeToNotifications,
  getNotificationStats
} from '@/lib/supabase/notifications';
import { Notification, NotificationStats } from '@/lib/types/notifications';

export function useNotifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (
    limit: number = 20,
    offset: number = 0,
    unreadOnly: boolean = false
  ) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getNotifications(user.id, limit, offset, unreadOnly);
      
      if (offset === 0) {
        setNotifications(data);
      } else {
        setNotifications(prev => [...prev, ...data]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const count = await getUnreadNotificationCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [user?.id]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const statsData = await getNotificationStats(user.id);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch notification stats:', err);
    }
  }, [user?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      await markAllNotificationsAsRead(user.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  }, [user?.id]);

  // Delete notification
  const deleteNotificationById = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      
      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if notification was unread
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, [notifications]);

  // Delete all notifications
  const deleteAllNotificationsForUser = useCallback(async () => {
    if (!user?.id) return;

    try {
      await deleteAllNotifications(user.id);
      
      // Clear local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete all notifications');
    }
  }, [user?.id]);

  // Refresh all data
  const refresh = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
    fetchStats();
  }, [fetchNotifications, fetchUnreadCount, fetchStats]);

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      refresh();
    }
  }, [user?.id, refresh]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToNotifications(user.id, (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case 'INSERT':
          // Add new notification to the beginning of the list
          setNotifications(prev => [newRecord, ...prev]);
          
          // Increment unread count if notification is unread
          if (!newRecord.read) {
            setUnreadCount(prev => prev + 1);
          }
          break;

        case 'UPDATE':
          // Update existing notification
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === newRecord.id ? newRecord : notification
            )
          );
          
          // Update unread count if read status changed
          if (oldRecord.read !== newRecord.read) {
            setUnreadCount(prev => 
              newRecord.read ? Math.max(0, prev - 1) : prev + 1
            );
          }
          break;

        case 'DELETE':
          // Remove notification from list
          setNotifications(prev => prev.filter(n => n.id !== oldRecord.id));
          
          // Update unread count if deleted notification was unread
          if (!oldRecord.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    stats,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotificationById,
    deleteAllNotifications: deleteAllNotificationsForUser,
    refresh
  };
} 