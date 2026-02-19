
// Enhanced Unified Notifications Hook - Real-time notifications across the entire platform
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';
import type {
  Notification,
  NotificationType,
  CreateNotificationRequest,
  NotificationPreferences as ServerNotificationPreferences
} from '@/services/notificationService';
import type { NotificationPreferences as UIPreferences } from '@/components/notifications/types';

const DEFAULT_UI_PREFERENCES: UIPreferences = {
  email: {
    enabled: true,
    eventUpdates: true,
    bookingNotifications: true,
    paymentAlerts: true,
    systemMessages: true,
    promotions: false,
    frequency: 'immediate'
  },
  push: {
    enabled: true,
    eventUpdates: true,
    bookingNotifications: true,
    paymentAlerts: true,
    systemMessages: true
  },
  inApp: {
    enabled: true,
    sound: true,
    desktop: true,
    priority: 'all'
  }
};

const EVENT_UPDATE_TYPES: NotificationType[] = [
  'tour_created',
  'tour_updated',
  'tour_cancelled',
  'event_booking',
  'event_cancelled',
  'spot_assigned',
  'spot_confirmation_deadline',
  'spot_reminder'
];

const BOOKING_TYPES: NotificationType[] = [
  'spot_assigned',
  'spot_confirmed',
  'spot_declined',
  'spot_cancelled'
];

const PAYMENT_TYPES: NotificationType[] = ['payment_received', 'payment_due'];
const SYSTEM_TYPES: NotificationType[] = ['system_update', 'general'];

const EMAIL_CATEGORY_MAP: Record<keyof UIPreferences['email'], NotificationType[]> = {
  enabled: [],
  eventUpdates: EVENT_UPDATE_TYPES,
  bookingNotifications: BOOKING_TYPES,
  paymentAlerts: PAYMENT_TYPES,
  systemMessages: SYSTEM_TYPES,
  promotions: []
};

const PUSH_CATEGORY_MAP: Record<keyof UIPreferences['push'], NotificationType[]> = {
  enabled: [],
  eventUpdates: EVENT_UPDATE_TYPES,
  bookingNotifications: BOOKING_TYPES,
  paymentAlerts: PAYMENT_TYPES,
  systemMessages: SYSTEM_TYPES
};

const cloneDefaultPreferences = (): UIPreferences => structuredClone
  ? structuredClone(DEFAULT_UI_PREFERENCES)
  : JSON.parse(JSON.stringify(DEFAULT_UI_PREFERENCES));

const mapServerToUIPreferences = (
  serverPreferences?: ServerNotificationPreferences | null,
  previous?: UIPreferences
): UIPreferences => {
  const base = cloneDefaultPreferences();
  const startingPoint = previous ?? base;

  if (!serverPreferences) {
    return {
      ...base,
      inApp: startingPoint.inApp
    };
  }

  const result = cloneDefaultPreferences();
  result.email.enabled = !!serverPreferences.email_notifications;
  result.push.enabled = !!serverPreferences.push_notifications;

  const typeSettings = serverPreferences.notification_types ?? {};
  const hasChannel = (types: NotificationType[], channel: 'email' | 'push'): boolean =>
    types.some(type => typeSettings[type]?.[channel]);

  result.email.eventUpdates = result.email.enabled && hasChannel(EVENT_UPDATE_TYPES, 'email');
  result.email.bookingNotifications = result.email.enabled && hasChannel(BOOKING_TYPES, 'email');
  result.email.paymentAlerts = result.email.enabled && hasChannel(PAYMENT_TYPES, 'email');
  result.email.systemMessages = result.email.enabled && hasChannel(SYSTEM_TYPES, 'email');
  result.email.promotions = result.email.enabled && hasChannel([], 'email');

  result.push.eventUpdates = result.push.enabled && hasChannel(EVENT_UPDATE_TYPES, 'push');
  result.push.bookingNotifications = result.push.enabled && hasChannel(BOOKING_TYPES, 'push');
  result.push.paymentAlerts = result.push.enabled && hasChannel(PAYMENT_TYPES, 'push');
  result.push.systemMessages = result.push.enabled && hasChannel(SYSTEM_TYPES, 'push');

  // Preserve existing in-app settings
  result.inApp = startingPoint.inApp;

  return result;
};

const mapUIToServerPreferences = (
  uiPreferences: UIPreferences,
  existing?: ServerNotificationPreferences | null
): Partial<ServerNotificationPreferences> => {
  const notificationTypes: ServerNotificationPreferences['notification_types'] = {
    ...(existing?.notification_types ?? {})
  };

  const applyChannel = (
    types: NotificationType[],
    channel: 'email' | 'push',
    enabled: boolean,
    channelEnabled: boolean
  ) => {
    types.forEach(type => {
      const entry = notificationTypes[type] ?? { enabled: false, email: false, push: false, sms: false };
      entry[channel] = channelEnabled && enabled;
      entry.enabled = entry.email || entry.push || entry.sms;
      notificationTypes[type] = entry;
    });
  };

  applyChannel(EVENT_UPDATE_TYPES, 'email', uiPreferences.email.eventUpdates, uiPreferences.email.enabled);
  applyChannel(BOOKING_TYPES, 'email', uiPreferences.email.bookingNotifications, uiPreferences.email.enabled);
  applyChannel(PAYMENT_TYPES, 'email', uiPreferences.email.paymentAlerts, uiPreferences.email.enabled);
  applyChannel(SYSTEM_TYPES, 'email', uiPreferences.email.systemMessages, uiPreferences.email.enabled);

  applyChannel(EVENT_UPDATE_TYPES, 'push', uiPreferences.push.eventUpdates, uiPreferences.push.enabled);
  applyChannel(BOOKING_TYPES, 'push', uiPreferences.push.bookingNotifications, uiPreferences.push.enabled);
  applyChannel(PAYMENT_TYPES, 'push', uiPreferences.push.paymentAlerts, uiPreferences.push.enabled);
  applyChannel(SYSTEM_TYPES, 'push', uiPreferences.push.systemMessages, uiPreferences.push.enabled);

  return {
    email_notifications: uiPreferences.email.enabled,
    push_notifications: uiPreferences.push.enabled,
    sms_notifications: existing?.sms_notifications ?? false,
    notification_types: notificationTypes
  };
};

const mergeUIPreferences = (
  current: UIPreferences,
  updates: Partial<UIPreferences>
): UIPreferences => ({
  email: { ...current.email, ...(updates.email ?? {}) },
  push: { ...current.push, ...(updates.push ?? {}) },
  inApp: { ...current.inApp, ...(updates.inApp ?? {}) }
});

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
          query = query.eq('is_read', false);
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
          .eq('is_read', false);

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
            is_read: true,
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
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('is_read', false);

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

export const useInvoiceNotifications = () => {
  return useNotifications({
    types: ['payment_received', 'payment_due', 'invoice_overdue'],
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

// Hook for notification preferences
export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uiPreferences, setUiPreferences] = useState<UIPreferences>(cloneDefaultPreferences());
  const uiPreferencesRef = useRef(uiPreferences);

  useEffect(() => {
    uiPreferencesRef.current = uiPreferences;
  }, [uiPreferences]);

  // Get notification preferences
  const {
    data: serverPreferences,
    isLoading: isLoadingPreferences
  } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      if (typeof notificationService !== 'undefined' && notificationService.getNotificationPreferences) {
        return notificationService.getNotificationPreferences(user.id);
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as ServerNotificationPreferences | null;
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (user?.id !== undefined) {
      setUiPreferences(prev => mapServerToUIPreferences(serverPreferences, prev));
    }
  }, [serverPreferences, user?.id]);

  // Update notification preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (nextPreferences: UIPreferences) => {
      if (!user?.id) throw new Error('User not authenticated');

      const existingServer = queryClient.getQueryData<ServerNotificationPreferences | null>([
        'notification-preferences',
        user.id
      ]) ?? serverPreferences;

      if (typeof notificationService !== 'undefined' && notificationService.updateNotificationPreferences) {
        const updatedServer = await notificationService.updateNotificationPreferences(
          user.id,
          mapUIToServerPreferences(nextPreferences, existingServer)
        );
        return { ui: nextPreferences, server: updatedServer };
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...mapUIToServerPreferences(nextPreferences, existingServer),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { ui: nextPreferences, server: data as ServerNotificationPreferences };
    },
    onMutate: async (nextPreferences) => {
      await queryClient.cancelQueries({ queryKey: ['notification-preferences', user?.id] });
      const previous = uiPreferencesRef.current;
      setUiPreferences(nextPreferences);
      return { previous };
    },
    onError: (_error, _nextPreferences, context) => {
      if (context?.previous) {
        setUiPreferences(context.previous);
      }
    },
    onSuccess: ({ ui, server }) => {
      setUiPreferences(mapServerToUIPreferences(server, ui));
      queryClient.setQueryData([
        'notification-preferences',
        user?.id
      ], server);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
    }
  });

  const savePreferences = useCallback(async (
    next: UIPreferences | ((current: UIPreferences) => UIPreferences)
  ) => {
    const resolved = typeof next === 'function' ? next(uiPreferencesRef.current) : next;
    await updatePreferencesMutation.mutateAsync(resolved);
  }, [updatePreferencesMutation]);

  const updatePreferences = useCallback(async (updates: Partial<UIPreferences>) => {
    await savePreferences(current => mergeUIPreferences(current, updates));
  }, [savePreferences]);

  return {
    preferences: uiPreferences,
    updatePreferences,
    savePreferences,
    isLoading: isLoadingPreferences,
    isUpdating: updatePreferencesMutation.isPending
  };
};
