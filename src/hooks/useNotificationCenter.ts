import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Notification,
  NotificationPreferences,
  NotificationFilterPriority,
  NotificationFilterType,
  NotificationFiltersState,
} from '@/components/notifications/types';
import { useToast } from '@/hooks/use-toast';

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'booking',
    title: 'New Event Application',
    message: 'Sarah Mitchell has applied to perform at "Comedy Night" on Jan 15th',
    timestamp: '2025-01-02T14:30:00Z',
    is_read: false,
    priority: 'high',
    actionUrl: '/admin/events/123/applications',
    actionText: 'Review Application',
    fromUser: 'Sarah Mitchell',
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment Received',
    message: 'Invoice INV-2025-001 has been paid by The Comedy Store ($2,500.00)',
    timestamp: '2025-01-02T12:15:00Z',
    is_read: false,
    priority: 'medium',
    actionUrl: '/admin/invoices/inv-001',
    actionText: 'View Invoice',
  },
  {
    id: '3',
    type: 'event',
    title: 'Event Published',
    message: 'Your event "New Year Comedy Gala" is now live and accepting bookings',
    timestamp: '2025-01-02T10:00:00Z',
    is_read: true,
    priority: 'low',
    actionUrl: '/events/nye-gala',
    actionText: 'View Event',
  },
  {
    id: '4',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2-4 AM AEDT',
    timestamp: '2025-01-01T18:00:00Z',
    is_read: true,
    priority: 'urgent',
    actionUrl: '/admin/system',
    actionText: 'Learn More',
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Event Reminder',
    message: 'Comedy Night at The Basement starts in 2 hours',
    timestamp: '2025-01-01T16:00:00Z',
    is_read: false,
    priority: 'medium',
    actionUrl: '/events/comedy-basement',
    actionText: 'View Event',
  },
];

const mockPreferences: NotificationPreferences = {
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
    priority: 'high',
  },
};

const defaultFilters: NotificationFiltersState = {
  searchTerm: '',
  type: 'all',
  priority: 'all',
  unreadOnly: false,
};

export const useNotificationCenter = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<NotificationFiltersState>(defaultFilters);

  const loadNotifications = useCallback(async () => {
    try {
      setNotifications(mockNotifications);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const loadPreferences = useCallback(async () => {
    try {
      setPreferences(mockPreferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await Promise.all([loadNotifications(), loadPreferences()]);
      setLoading(false);
    };

    bootstrap();
  }, [loadNotifications, loadPreferences]);

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

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.is_read).length, [notifications]);

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

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, is_read: true } : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })));
    toast({
      title: 'Success',
      description: 'All notifications marked as read',
    });
  }, [toast]);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
    toast({
      title: 'Notification Deleted',
      description: 'Notification has been removed',
    });
  }, [toast]);

  const sendTestNotification = useCallback(() => {
    const testNotification: Notification = {
      id: Date.now().toString(),
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification to verify your settings are working correctly.',
      timestamp: new Date().toISOString(),
      is_read: false,
      priority: 'medium',
    };

    setNotifications((prev) => [testNotification, ...prev]);
    toast({
      title: 'Test Notification Sent',
      description: 'Check your notification preferences',
    });
  }, [toast]);

  const updatePreferences = useCallback((nextPreferences: NotificationPreferences) => {
    setPreferences(nextPreferences);
    toast({
      title: 'Preferences Updated',
      description: 'Your notification preferences have been saved',
    });
  }, [toast]);

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
