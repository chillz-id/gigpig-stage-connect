import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Notification,
  NotificationPreferences,
  NotificationFilterPriority,
  NotificationFilterType,
  NotificationFiltersState,
  NotificationType,
  NotificationPriority,
} from '@/components/notifications/types';
import type { Notification as DBNotification } from '@/services/notifications/NotificationManager';

const defaultFilters: NotificationFiltersState = {
  searchTerm: '',
  type: 'all',
  priority: 'all',
  unreadOnly: false,
};

const defaultPreferences: NotificationPreferences = {
  email: {
    enabled: true,
    eventUpdates: true,
    bookingNotifications: true,
    paymentAlerts: true,
    systemMessages: true,
    promotions: false,
    frequency: 'immediate',
  },
  push: {
    enabled: true,
    eventUpdates: true,
    bookingNotifications: true,
    paymentAlerts: true,
    systemMessages: false,
  },
  inApp: {
    enabled: true,
    sound: true,
    desktop: true,
    priority: 'all',
  },
};

// Map database notification types to UI notification types
const mapDBTypeToUIType = (dbType: string): NotificationType => {
  // Event types
  if (dbType.startsWith('tour_') || dbType.startsWith('event_') ||
      dbType.includes('collaboration_')) {
    return 'event';
  }
  // Booking types (spots, applications)
  if (dbType.startsWith('spot_') || dbType.startsWith('application_')) {
    return 'booking';
  }
  // Payment types
  if (dbType.startsWith('payment_')) {
    return 'payment';
  }
  // System types
  if (dbType === 'system_update' || dbType === 'general') {
    return 'system';
  }
  // Task/reminder types
  if (dbType.startsWith('task_') || dbType.startsWith('flight_')) {
    return 'reminder';
  }
  // Default fallback
  return 'system';
};

// Map database priority to UI priority (they should match but ensure safety)
const mapDBPriorityToUIPriority = (dbPriority: string): NotificationPriority => {
  const validPriorities: NotificationPriority[] = ['low', 'medium', 'high', 'urgent'];
  if (validPriorities.includes(dbPriority as NotificationPriority)) {
    return dbPriority as NotificationPriority;
  }
  return 'medium';
};

// Transform database notification to UI notification
const transformDBNotification = (dbNotification: DBNotification): Notification => ({
  id: dbNotification.id,
  type: mapDBTypeToUIType(dbNotification.type),
  title: dbNotification.title,
  message: dbNotification.message,
  timestamp: dbNotification.created_at,
  is_read: dbNotification.is_read,
  priority: mapDBPriorityToUIPriority(dbNotification.priority),
  actionUrl: dbNotification.action_url,
  actionText: dbNotification.action_label,
  metadata: dbNotification.data,
});

export const useNotificationCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<NotificationFiltersState>(defaultFilters);

  // Fetch notifications from database
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notification-center', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to fetch notifications:', error);
        throw error;
      }

      return (data || []).map(transformDBNotification);
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Fetch notification preferences
  const {
    data: preferencesData,
    isLoading: preferencesLoading,
  } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return defaultPreferences;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch preferences:', error);
        throw error;
      }

      // Map database preferences to UI preferences format
      if (!data) return defaultPreferences;

      return {
        email: {
          enabled: data.email_notifications ?? true,
          eventUpdates: true,
          bookingNotifications: true,
          paymentAlerts: true,
          systemMessages: true,
          promotions: false,
          frequency: 'immediate' as const,
        },
        push: {
          enabled: data.push_notifications ?? true,
          eventUpdates: true,
          bookingNotifications: true,
          paymentAlerts: true,
          systemMessages: false,
        },
        inApp: {
          enabled: true,
          sound: true,
          desktop: true,
          priority: 'all' as const,
        },
      };
    },
    enabled: !!user?.id,
    staleTime: 300000,
  });

  const notifications = notificationsData || [];
  const preferences = preferencesData || defaultPreferences;
  const loading = notificationsLoading || preferencesLoading;

  // Filtered notifications based on current filters
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesType = filters.type === 'all' || notification.type === filters.type;
      const matchesPriority = filters.priority === 'all' || notification.priority === filters.priority;
      const matchesRead = !filters.unreadOnly || !notification.is_read;

      return matchesSearch && matchesType && matchesPriority && matchesRead;
    });
  }, [notifications, filters]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

  // Filter setters
  const setSearchTerm = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
  }, []);

  const setTypeFilter = useCallback((value: NotificationFilterType) => {
    setFilters((prev) => ({ ...prev, type: value }));
  }, []);

  const setPriorityFilter = useCallback((value: NotificationFilterPriority) => {
    setFilters((prev) => ({ ...prev, priority: value }));
  }, []);

  const toggleUnreadOnly = useCallback(() => {
    setFilters((prev) => ({ ...prev, unreadOnly: !prev.unreadOnly }));
  }, []);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-center'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-center'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-center'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      toast({
        title: 'Notification Deleted',
        description: 'Notification has been removed',
      });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (nextPreferences: NotificationPreferences) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          email_notifications: nextPreferences.email.enabled,
          push_notifications: nextPreferences.push.enabled,
          sms_notifications: false,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return nextPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved',
      });
    },
  });

  // Action wrappers
  const markAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate(notificationId);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback(
    (notificationId: string) => {
      deleteNotificationMutation.mutate(notificationId);
    },
    [deleteNotificationMutation]
  );

  const sendTestNotification = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to send test notifications',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'general',
        title: 'Test Notification',
        message: 'This is a test notification to verify your settings are working correctly.',
        priority: 'medium',
        is_read: false,
      });

      if (error) throw error;

      await refetchNotifications();
      toast({
        title: 'Test Notification Sent',
        description: 'Check your notification list',
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test notification',
        variant: 'destructive',
      });
    }
  }, [user?.id, refetchNotifications, toast]);

  const updatePreferences = useCallback(
    (nextPreferences: NotificationPreferences) => {
      updatePreferencesMutation.mutate(nextPreferences);
    },
    [updatePreferencesMutation]
  );

  return {
    loading,
    notifications,
    preferences,
    filteredNotifications,
    unreadCount,
    filters,
    setSearchTerm,
    setTypeFilter,
    setPriorityFilter,
    toggleUnreadOnly,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendTestNotification,
    updatePreferences,
  };
};

export type UseNotificationCenterReturn = ReturnType<typeof useNotificationCenter>;
