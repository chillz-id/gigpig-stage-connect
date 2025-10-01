// Push Notification Service - Browser push notifications and mobile push
import { notificationManager } from './NotificationManager';
import type { NotificationType, Notification } from './NotificationManager';
import { toast } from '@/hooks/use-toast';

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.initializePushNotifications();
  }

  // =====================================
  // INITIALIZATION AND PERMISSIONS
  // =====================================

  private async initializePushNotifications(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      this.permission = Notification.permission;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    this.permission = await Notification.requestPermission();
    return this.permission;
  }

  async isSupported(): Promise<boolean> {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  // =====================================
  // BROWSER PUSH NOTIFICATIONS
  // =====================================

  async showBrowserNotification(payload: PushNotificationPayload): Promise<void> {
    if (this.permission !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    if (!this.registration) {
      await this.initializePushNotifications();
      if (!this.registration) {
        throw new Error('Service worker not available');
      }
    }

    try {
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-72x72.png',
        image: payload.image,
        data: payload.data,
        actions: payload.actions,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false
      });
    } catch (error) {
      console.error('Failed to show browser notification:', error);
      throw error;
    }
  }

  // =====================================
  // TOAST NOTIFICATIONS (FALLBACK)
  // =====================================

  showToastNotification(notification: Notification): void {
    const variant = this.getToastVariant(notification.priority);
    
    toast({
      title: notification.title,
      description: notification.message,
      variant,
      action: notification.action_url ? {
        altText: notification.action_label || 'View',
        onClick: () => {
          if (notification.action_url) {
            window.open(notification.action_url, '_blank');
          }
        }
      } : undefined
    });
  }

  private getToastVariant(priority: string): 'default' | 'destructive' {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'destructive';
      default:
        return 'default';
    }
  }

  async sendGenericNotification(notification: Notification): Promise<void> {
    if (!(await this.isSupported())) {
      return;
    }

    const payload: PushNotificationPayload = {
      title: notification.title,
      body: notification.message,
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent' || notification.priority === 'high',
      data: {
        ...notification.data,
        actionUrl: notification.action_url,
        notificationId: notification.id
      },
      actions: notification.action_url
        ? [{
            action: 'view',
            title: notification.action_label || 'View'
          }]
        : undefined
    };

    try {
      await this.showBrowserNotification(payload);
    } catch (error) {
      console.error('Failed to send generic push notification:', error);
    }
  }

  // =====================================
  // NOTIFICATION TYPE HANDLERS
  // =====================================

  async handleSpotAssignmentNotification(
    comedianName: string,
    eventName: string,
    eventDate: string,
    confirmationUrl: string
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title: 'New Spot Assignment',
      body: `${comedianName}, you've been assigned a spot for ${eventName} on ${eventDate}`,
      icon: '/icon-192x192.png',
      tag: 'spot-assignment',
      requireInteraction: true,
      actions: [
        {
          action: 'confirm',
          title: 'Confirm Spot'
        },
        {
          action: 'view',
          title: 'View Details'
        }
      ],
      data: {
        type: 'spot_assigned',
        confirmationUrl,
        eventName,
        eventDate
      }
    };

    await this.showBrowserNotification(payload);
  }

  async handleSpotDeadlineNotification(
    comedianName: string,
    eventName: string,
    hoursRemaining: number,
    confirmationUrl: string
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title: 'Spot Confirmation Deadline',
      body: `${comedianName}, you have ${hoursRemaining} hours left to confirm your spot for ${eventName}`,
      icon: '/icon-192x192.png',
      tag: 'spot-deadline',
      requireInteraction: true,
      actions: [
        {
          action: 'confirm',
          title: 'Confirm Now'
        }
      ],
      data: {
        type: 'spot_confirmation_deadline',
        confirmationUrl,
        eventName,
        hoursRemaining
      }
    };

    await this.showBrowserNotification(payload);
  }

  async handleTaskAssignmentNotification(
    assigneeName: string,
    taskTitle: string,
    dueDate: string,
    taskUrl: string
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title: 'New Task Assigned',
      body: `${assigneeName}, you've been assigned: ${taskTitle}. Due: ${dueDate}`,
      icon: '/icon-192x192.png',
      tag: 'task-assignment',
      actions: [
        {
          action: 'view',
          title: 'View Task'
        }
      ],
      data: {
        type: 'task_assigned',
        taskUrl,
        taskTitle,
        dueDate
      }
    };

    await this.showBrowserNotification(payload);
  }

  async handleFlightDelayNotification(
    passengerName: string,
    flightNumber: string,
    delayDuration: string,
    newTime: string
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title: 'Flight Delayed',
      body: `${passengerName}, your flight ${flightNumber} is delayed by ${delayDuration}. New time: ${newTime}`,
      icon: '/icon-192x192.png',
      tag: 'flight-delay',
      requireInteraction: true,
      data: {
        type: 'flight_delayed',
        flightNumber,
        delayDuration,
        newTime
      }
    };

    await this.showBrowserNotification(payload);
  }

  async handleCollaborationInviteNotification(
    collaboratorName: string,
    requesterName: string,
    tourName: string,
    acceptUrl: string,
    declineUrl: string
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title: 'Tour Collaboration Invite',
      body: `${collaboratorName}, ${requesterName} has invited you to collaborate on ${tourName}`,
      icon: '/icon-192x192.png',
      tag: 'collaboration-invite',
      requireInteraction: true,
      actions: [
        {
          action: 'accept',
          title: 'Accept'
        },
        {
          action: 'decline',
          title: 'Decline'
        }
      ],
      data: {
        type: 'collaboration_invite',
        acceptUrl,
        declineUrl,
        tourName,
        requesterName
      }
    };

    await this.showBrowserNotification(payload);
  }

  // =====================================
  // GENERIC NOTIFICATION HANDLER
  // =====================================

  async handleNotification(notification: Notification): Promise<void> {
    // Try browser push notification first
    if (this.permission === 'granted') {
      try {
        const payload: PushNotificationPayload = {
          title: notification.title,
          body: notification.message,
          icon: '/icon-192x192.png',
          tag: notification.type,
          requireInteraction: notification.priority === 'urgent' || notification.priority === 'high',
          data: {
            type: notification.type,
            notificationId: notification.id,
            actionUrl: notification.action_url,
            ...notification.data
          }
        };

        if (notification.action_url && notification.action_label) {
          payload.actions = [
            {
              action: 'view',
              title: notification.action_label
            }
          ];
        }

        await this.showBrowserNotification(payload);
        return;
      } catch (error) {
        console.error('Browser push notification failed, falling back to toast:', error);
      }
    }

    // Fallback to toast notification
    this.showToastNotification(notification);
  }

  // =====================================
  // BATCH NOTIFICATIONS
  // =====================================

  async handleBatchNotifications(notifications: Notification[]): Promise<void> {
    // Group notifications by type and importance
    const urgentNotifications = notifications.filter(n => n.priority === 'urgent');
    const otherNotifications = notifications.filter(n => n.priority !== 'urgent');

    // Show urgent notifications immediately
    for (const notification of urgentNotifications) {
      await this.handleNotification(notification);
      // Small delay between urgent notifications
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // For non-urgent notifications, show a summary if there are many
    if (otherNotifications.length > 3) {
      const summaryPayload: PushNotificationPayload = {
        title: `${otherNotifications.length} New Notifications`,
        body: 'You have multiple new notifications. Click to view all.',
        icon: '/icon-192x192.png',
        tag: 'notification-summary',
        actions: [
          {
            action: 'view-all',
            title: 'View All'
          }
        ],
        data: {
          type: 'notification_summary',
          count: otherNotifications.length
        }
      };

      await this.showBrowserNotification(summaryPayload);
    } else {
      // Show individual notifications
      for (const notification of otherNotifications) {
        await this.handleNotification(notification);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  async clearNotificationsByTag(tag: string): Promise<void> {
    if (!this.registration) return;

    try {
      const notifications = await this.registration.getNotifications({ tag });
      notifications.forEach(notification => notification.close());
    } catch (error) {
      console.error('Failed to clear notifications by tag:', error);
    }
  }

  async clearAllNotifications(): Promise<void> {
    if (!this.registration) return;

    try {
      const notifications = await this.registration.getNotifications();
      notifications.forEach(notification => notification.close());
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const pushNotificationService = new PushNotificationService();
export default PushNotificationService;
