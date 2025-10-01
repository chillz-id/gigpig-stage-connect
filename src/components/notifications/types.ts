export type NotificationType =
  | 'event'
  | 'booking'
  | 'payment'
  | 'system'
  | 'reminder'
  | 'promotion';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
  actionText?: string;
  fromUser?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    eventUpdates: boolean;
    bookingNotifications: boolean;
    paymentAlerts: boolean;
    systemMessages: boolean;
    promotions: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  push: {
    enabled: boolean;
    eventUpdates: boolean;
    bookingNotifications: boolean;
    paymentAlerts: boolean;
    systemMessages: boolean;
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    priority: 'all' | 'high' | 'urgent';
  };
}

export type NotificationFilterType = NotificationType | 'all';
export type NotificationFilterPriority = NotificationPriority | 'all';

export interface NotificationFiltersState {
  searchTerm: string;
  type: NotificationFilterType;
  priority: NotificationFilterPriority;
  unreadOnly: boolean;
}
