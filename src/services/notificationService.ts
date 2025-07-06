// Unified Notification Service - Cross-system notifications and real-time updates
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type NotificationType = 
  | 'tour_created' 
  | 'tour_updated' 
  | 'tour_cancelled'
  | 'collaboration_invite' 
  | 'collaboration_accepted' 
  | 'collaboration_declined'
  | 'task_assigned' 
  | 'task_due_soon' 
  | 'task_overdue'
  | 'task_completed'
  | 'flight_delayed' 
  | 'flight_cancelled' 
  | 'flight_boarding'
  | 'event_booking' 
  | 'event_cancelled'
  | 'payment_received' 
  | 'payment_due'
  | 'system_update'
  | 'general';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  data?: Record<string, any>;
  read: boolean;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
  created_at: string;
  read_at?: string;
}

export interface CreateNotificationRequest {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: Record<string, any>;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  notification_types: {
    [K in NotificationType]?: {
      enabled: boolean;
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

class NotificationService {
  private subscribers: Map<string, Set<(notification: Notification) => void>> = new Map();
  private realtimeChannel: any = null;

  constructor() {
    this.initializeRealtimeSubscription();
  }

  // =====================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================

  private initializeRealtimeSubscription() {
    this.realtimeChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          this.handleRealtimeNotification(payload.new as Notification);
        }
      )
      .subscribe();
  }

  private handleRealtimeNotification(notification: Notification) {
    // Notify subscribers
    const userSubscribers = this.subscribers.get(notification.user_id);
    if (userSubscribers) {
      userSubscribers.forEach(callback => callback(notification));
    }

    // Show toast notification
    this.showToastNotification(notification);

    // Handle browser push notifications
    this.sendPushNotification(notification);
  }

  subscribe(userId: string, callback: (notification: Notification) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const userSubscribers = this.subscribers.get(userId);
      if (userSubscribers) {
        userSubscribers.delete(callback);
        if (userSubscribers.size === 0) {
          this.subscribers.delete(userId);
        }
      }
    };
  }

  // =====================================
  // NOTIFICATION MANAGEMENT
  // =====================================

  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...request,
        priority: request.priority || 'medium',
        read: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getNotifications(
    userId: string, 
    options: {
      unread_only?: boolean;
      types?: NotificationType[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (options.unread_only) {
      query = query.eq('read', false);
    }

    if (options.types?.length) {
      query = query.in('type', options.types);
    }

    query = query.order('created_at', { ascending: false });

    if (options.limit) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      notifications: data || [],
      total: count || 0
    };
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  }

  // =====================================
  // BULK NOTIFICATION CREATION
  // =====================================

  async createBulkNotifications(requests: CreateNotificationRequest[]): Promise<Notification[]> {
    const notifications = requests.map(request => ({
      ...request,
      priority: request.priority || 'medium',
      read: false
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;
    return data || [];
  }

  async notifyTourCollaborators(
    tourId: string, 
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // Get tour collaborators
      const { data: collaborators, error } = await supabase
        .from('tour_collaborations')
        .select('collaborator_id')
        .eq('tour_id', tourId)
        .eq('status', 'active');

      if (error) throw error;

      if (collaborators?.length) {
        const notifications = collaborators.map(c => ({
          user_id: c.collaborator_id,
          type,
          title,
          message,
          priority: 'medium' as NotificationPriority,
          data: { tour_id: tourId, ...data }
        }));

        await this.createBulkNotifications(notifications);
      }
    } catch (error) {
      console.error('Failed to notify tour collaborators:', error);
    }
  }

  async notifyTaskAssignees(
    taskIds: string[],
    type: NotificationType,
    title: string,
    message: string
  ): Promise<void> {
    try {
      // Get task assignees
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, assignee_id')
        .in('id', taskIds)
        .not('assignee_id', 'is', null);

      if (error) throw error;

      if (tasks?.length) {
        const notifications = tasks.map(task => ({
          user_id: task.assignee_id!,
          type,
          title,
          message,
          priority: 'high' as NotificationPriority,
          data: { task_id: task.id }
        }));

        await this.createBulkNotifications(notifications);
      }
    } catch (error) {
      console.error('Failed to notify task assignees:', error);
    }
  }

  // =====================================
  // TOAST NOTIFICATIONS
  // =====================================

  private showToastNotification(notification: Notification) {
    const variant = this.getToastVariant(notification.priority);
    
    toast({
      title: notification.title,
      description: notification.message,
      variant,
      action: notification.action_url ? {
        label: notification.action_label || 'View',
        onClick: () => window.location.href = notification.action_url!
      } : undefined
    });
  }

  private getToastVariant(priority: NotificationPriority): 'default' | 'destructive' {
    return priority === 'urgent' ? 'destructive' : 'default';
  }

  // =====================================
  // PUSH NOTIFICATIONS
  // =====================================

  private async sendPushNotification(notification: Notification) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: notification.id,
        data: {
          url: notification.action_url,
          notificationId: notification.id
        },
        actions: notification.action_url ? [{
          action: 'view',
          title: notification.action_label || 'View'
        }] : undefined
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // =====================================
  // NOTIFICATION PREFERENCES
  // =====================================

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================
  // CLEANUP AND MAINTENANCE
  // =====================================

  async cleanupExpiredNotifications(): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;
  }

  async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('read', true)
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;
  }

  // =====================================
  // PREDEFINED NOTIFICATION CREATORS
  // =====================================

  async notifyTourCreated(tourId: string, tourName: string, managerId: string): Promise<void> {
    await this.createNotification({
      user_id: managerId,
      type: 'tour_created',
      title: 'Tour Created Successfully',
      message: `Your tour "${tourName}" has been created and is ready for planning.`,
      priority: 'medium',
      data: { tour_id: tourId },
      action_url: `/tours/${tourId}`,
      action_label: 'View Tour'
    });
  }

  async notifyCollaborationInvite(
    collaboratorId: string, 
    tourId: string, 
    tourName: string, 
    role: string
  ): Promise<void> {
    await this.createNotification({
      user_id: collaboratorId,
      type: 'collaboration_invite',
      title: 'Tour Collaboration Invitation',
      message: `You've been invited to collaborate on "${tourName}" as a ${role}.`,
      priority: 'high',
      data: { tour_id: tourId, role },
      action_url: `/tours/${tourId}/collaborations`,
      action_label: 'View Invitation'
    });
  }

  async notifyTaskDueSoon(userId: string, taskId: string, taskTitle: string, dueDate: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'task_due_soon',
      title: 'Task Due Soon',
      message: `"${taskTitle}" is due on ${new Date(dueDate).toLocaleDateString()}.`,
      priority: 'medium',
      data: { task_id: taskId },
      action_url: `/tasks/${taskId}`,
      action_label: 'View Task'
    });
  }

  async notifyFlightDelay(
    userId: string, 
    flightNumber: string, 
    newDepartureTime: string,
    delay: number
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'flight_delayed',
      title: 'Flight Delayed',
      message: `Flight ${flightNumber} is delayed by ${delay} minutes. New departure: ${new Date(newDepartureTime).toLocaleString()}.`,
      priority: 'urgent',
      data: { flight_number: flightNumber, delay },
      action_url: '/flights',
      action_label: 'View Flights'
    });
  }

  // Cleanup on service destruction
  destroy() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }
    this.subscribers.clear();
  }
}

export const notificationService = new NotificationService();