// Notification Manager - Central orchestration and real-time subscriptions
import { supabase } from '@/integrations/supabase/client';

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
  | 'general'
  | 'spot_assigned'
  | 'spot_confirmation_deadline'
  | 'spot_confirmed'
  | 'spot_declined'
  | 'spot_cancelled'
  | 'spot_reminder'
  | 'application_submitted'
  | 'application_accepted'
  | 'application_rejected'
  | 'application_withdrawn';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  data?: Record<string, any>;
  is_read: boolean;
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

type ToastHandler = (notification: Notification) => void;
type PushHandler = (notification: Notification) => Promise<void> | void;

class NotificationManager {
  private subscribers: Map<string, Set<(notification: Notification) => void>> = new Map();
  private realtimeChannel: any = null;
  private toastHandler?: ToastHandler;
  private pushHandler?: PushHandler;

  constructor() {
    this.initializeRealtimeSubscription();
  }

  configureHandlers(handlers: { toast?: ToastHandler; push?: PushHandler }): void {
    this.toastHandler = handlers.toast ?? this.toastHandler;
    this.pushHandler = handlers.push ?? this.pushHandler;
  }

  // =====================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================

  private initializeRealtimeSubscription(): void {
    this.realtimeChannel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        (payload) => this.handleNewNotification(payload.new as Notification)
      )
      .subscribe();
  }

  private handleNewNotification(notification: Notification): void {
    // Notify subscribers
    const userSubscribers = this.subscribers.get(notification.user_id);
    if (userSubscribers) {
      userSubscribers.forEach(callback => callback(notification));
    }

    // Show toast notification
    this.showToastNotification(notification);

    // Handle browser push notifications
    this.handlePushNotification(notification);
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
  // CORE NOTIFICATION MANAGEMENT
  // =====================================

  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    const notificationData = {
      ...request,
      priority: request.priority || 'medium',
      is_read: false
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getNotifications(
    userId: string,
    filters?: {
      type?: NotificationType;
      types?: NotificationType[];
      isRead?: boolean;
      priority?: NotificationPriority;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.types?.length) {
      query = query.in('type', filters.types);
    }

    if (filters?.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return {
      notifications: (data as Notification[]) || [],
      total: count ?? ((data as Notification[])?.length ?? 0)
    };
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId);

    if (error) throw error;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('is_read', false);

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
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  // =====================================
  // BULK OPERATIONS
  // =====================================

  async createBulkNotifications(requests: CreateNotificationRequest[]): Promise<Notification[]> {
    const notificationData = requests.map(request => ({
      ...request,
      priority: request.priority || 'medium',
      is_read: false
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select();

    if (error) throw error;
    return data || [];
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  private showToastNotification(notification: Notification): void {
    if (this.toastHandler) {
      this.toastHandler(notification);
    }
  }

  private handlePushNotification(notification: Notification): void {
    if (this.pushHandler) {
      void this.pushHandler(notification);
    }
  }

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
      .eq('is_read', true)
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;
  }

  // =====================================
  // PREFERENCES
  // =====================================

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      throw error;
    }

    return data as NotificationPreferences;
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
    return data as NotificationPreferences;
  }

  // =====================================
  // CLEANUP
  // =====================================

  destroy(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.subscribers.clear();
  }
}

export const notificationManager = new NotificationManager();
export default NotificationManager;
