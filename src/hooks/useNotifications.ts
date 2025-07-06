
// Enhanced Unified Notifications Hook - Real-time notifications across the entire platform
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';
import type { 
  Notification, 
  NotificationType, 
  CreateNotificationRequest,
  NotificationPreferences 
} from '@/services/notificationService';

export interface UseNotificationsOptions {
  autoMarkAsRead?: boolean;
  enableRealtime?: boolean;
  types?: NotificationType[];
  unreadOnly?: boolean;
  limit?: number;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [realtimeError, setRealtimeError] = useState<Error | null>(null);

  const {
    autoMarkAsRead = false,
    enableRealtime = true,
    types,
    unreadOnly = false,
    limit = 50
  } = options;

  // Enhanced query with more features
  const { 
    data: notificationsData, 
    isLoading: notificationsLoading, 
    error: notificationsError,
    refetch: refetchNotifications 
  } = useQuery({
    queryKey: ['notifications', user?.id, { types, unreadOnly, limit }],
    queryFn: async () => {
      if (!user?.id) return { notifications: [], total: 0 };
      
      // Use enhanced notification service if available, otherwise fallback to basic query
      if (typeof notificationService !== 'undefined' && notificationService.getNotifications) {
        return notificationService.getNotifications(user.id, {
          types,
          unread_only: unreadOnly,
          limit
        });
      } else {
        // Fallback to basic notification query
        let query = supabase
          .from('notifications')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);

        if (unreadOnly) {
          query = query.eq('read', false);
        }

        if (types?.length) {
          query = query.in('type', types);
        }

        query = query.order('created_at', { ascending: false });

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return {
          notifications: data || [],
          total: count || 0
        };
      }
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: enableRealtime ? undefined : 60000
  });

  // Unread count query
  const { 
    data: unreadCount, 
    isLoading: countLoading 
  } = useQuery({
    queryKey: ['notifications-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      if (typeof notificationService !== 'undefined' && notificationService.getUnreadCount) {
        return notificationService.getUnreadCount(user.id);
      } else {
        // Fallback count query
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);

        if (error) throw error;
        return count || 0;
      }
    },
    enabled: !!user?.id,
    staleTime: 10000,
    refetchInterval: 30000
  });

  // Notification preferences query
  const { 
    data: preferences, 
    isLoading: preferencesLoading 
  } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      if (typeof notificationService !== 'undefined' && notificationService.getNotificationPreferences) {
        return notificationService.getNotificationPreferences(user.id);
      }
      return null;
    },
    enabled: !!user?.id,
    staleTime: 300000
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (typeof notificationService !== 'undefined' && notificationService.markAsRead) {
        return notificationService.markAsRead(notificationId);
      } else {
        // Fallback mark as read
        const { error } = await supabase
          .from('notifications')
          .update({
            read: true,
            read_at: new Date().toISOString()
          })
          .eq('id', notificationId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      if (typeof notificationService !== 'undefined' && notificationService.markAllAsRead) {
        return notificationService.markAllAsRead(user.id);
      } else {
        // Fallback mark all as read
        const { error } = await supabase
          .from('notifications')
          .update({
            read: true,
            read_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('read', false);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    }
  });

  // Real-time subscription
  const subscribe = useCallback(() => {
    if (!user?.id || !enableRealtime) {
      return () => {};
    }

    setIsSubscribed(true);
    setRealtimeError(null);

    // Try to use enhanced notification service subscription
    if (typeof notificationService !== 'undefined' && notificationService.subscribe) {
      const unsubscribe = notificationService.subscribe(user.id, (notification) => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-count'] });

        if (autoMarkAsRead && (!types || types.includes(notification.type))) {
          markAsReadMutation.mutate(notification.id);
        }
      });

      return () => {
        unsubscribe();
        setIsSubscribed(false);
      };
    } else {
      // Fallback real-time subscription using Supabase directly
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        setIsSubscribed(false);
      };
    }
  }, [user?.id, enableRealtime, autoMarkAsRead, types, queryClient, markAsReadMutation]);

  // Auto-subscribe when hook is used
  useEffect(() => {
    if (enableRealtime && user?.id) {
      const unsubscribe = subscribe();
      return unsubscribe;
    }
  }, [subscribe, enableRealtime, user?.id]);

  // Action wrappers
  const markAsRead = useCallback(async (notificationId: string) => {
    await markAsReadMutation.mutateAsync(notificationId);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    await markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation]);

  // Derived state
  const isLoading = notificationsLoading || countLoading || preferencesLoading;
  const isError = !!(notificationsError || realtimeError);
  const error = notificationsError || realtimeError;
  const notifications = notificationsData?.notifications || [];

  return {
    // Data
    notifications,
    unreadCount: unreadCount || 0,
    preferences,
    isLoading,
    isError,
    error,
    
    // Actions
    markAsRead,
    markAllAsRead,
    refetch: refetchNotifications,
    
    // Real-time
    subscribe,
    isSubscribed,
    
    // Legacy compatibility
    data: notifications
  };
};

// Specialized hooks for different notification types
export const useTourNotifications = () => {
  return useNotifications({
    types: ['tour_created', 'tour_updated', 'tour_cancelled', 'collaboration_invite', 'collaboration_accepted', 'collaboration_declined'],
    enableRealtime: true
  });
};

export const useTaskNotifications = () => {
  return useNotifications({
    types: ['task_assigned', 'task_due_soon', 'task_overdue', 'task_completed'],
    enableRealtime: true
  });
};

export const useFlightNotifications = () => {
  return useNotifications({
    types: ['flight_delayed', 'flight_cancelled', 'flight_boarding'],
    enableRealtime: true,
    autoMarkAsRead: false // Flight notifications should require manual acknowledgment
  });
};

export const useEventNotifications = () => {
  return useNotifications({
    types: ['event_booking', 'event_cancelled'],
    enableRealtime: true
  });
};

export const usePaymentNotifications = () => {
  return useNotifications({
    types: ['payment_received', 'payment_due'],
    enableRealtime: true
  });
};

// Hook for unread notifications only
export const useUnreadNotifications = () => {
  return useNotifications({
    unreadOnly: true,
    enableRealtime: true,
    limit: 20
  });
};
