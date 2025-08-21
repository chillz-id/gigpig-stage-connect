// Unified Notification Service - Cross-system notifications and real-time updates
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  createSpotAssignmentEmail, 
  createSpotDeadlineEmail, 
  createSpotConfirmationEmail, 
  createSpotDeclinedEmail,
  getEmailTemplateMetadata,
  EmailTemplateData
} from '@/templates/email';

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
      query = query.eq('is_read', false);
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
      variant
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
      .eq('is_read', true)
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

  // =====================================
  // EMAIL NOTIFICATION SENDING
  // =====================================

  private async sendEmailNotification(emailData: EmailTemplateData): Promise<void> {
    try {
      // In a real implementation, this would integrate with an email service
      // like SendGrid, Mailgun, or AWS SES. For now, we'll use Supabase Edge Functions
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        }
      });

      if (error) {
        console.error('Failed to send email:', error);
        throw error;
      }

      console.log('Email sent successfully:', data);
    } catch (error) {
      console.error('Email sending failed:', error);
      // Don't throw here to avoid breaking the notification flow
      // The in-app notification will still be sent
    }
  }

  // =====================================
  // SPOT NOTIFICATION CREATORS
  // =====================================

  async notifySpotAssigned(
    comedianId: string,
    eventId: string,
    eventTitle: string,
    eventDate: string,
    spotType: string,
    venue: string,
    confirmationDeadline: string,
    options?: {
      comedianEmail?: string;
      comedianName?: string;
      address?: string;
      promoterName?: string;
      promoterEmail?: string;
      performanceDuration?: string;
      specialInstructions?: string;
    }
  ): Promise<void> {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = new Date(eventDate).toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const deadlineDate = new Date(confirmationDeadline).toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create in-app notification
    await this.createNotification({
      user_id: comedianId,
      type: 'spot_assigned',
      title: `Spot Assigned: ${eventTitle}`,
      message: `Congratulations! You've been assigned a ${spotType} spot at ${venue} on ${formattedDate} at ${formattedTime}. Please confirm your availability by ${deadlineDate}.`,
      priority: 'high',
      data: {
        event_id: eventId,
        spot_type: spotType,
        venue,
        event_date: eventDate,
        confirmation_deadline: confirmationDeadline
      },
      action_url: `/events/${eventId}/spot-confirmation`,
      action_label: 'Confirm Spot',
      expires_at: confirmationDeadline
    });

    // Send email notification if email details are provided
    if (options?.comedianEmail && options?.comedianName) {
      try {
        const emailData = createSpotAssignmentEmail({
          comedianName: options.comedianName,
          comedianEmail: options.comedianEmail,
          eventTitle,
          eventDate,
          eventTime: eventDate,
          venue,
          address: options.address || venue,
          spotType,
          confirmationDeadline,
          confirmationUrl: `${window.location.origin}/events/${eventId}/spot-confirmation`,
          eventUrl: `${window.location.origin}/events/${eventId}`,
          promoterName: options.promoterName || 'Event Promoter',
          promoterEmail: options.promoterEmail || 'promoter@standupsyney.com',
          performanceDuration: options.performanceDuration,
          specialInstructions: options.specialInstructions
        });

        await this.sendEmailNotification(emailData);
      } catch (error) {
        console.error('Failed to send spot assignment email:', error);
      }
    }
  }

  async notifySpotConfirmationDeadline(
    comedianId: string,
    eventId: string,
    eventTitle: string,
    eventDate: string,
    venue: string,
    hoursRemaining: number,
    options?: {
      comedianEmail?: string;
      comedianName?: string;
      address?: string;
      promoterName?: string;
      promoterEmail?: string;
      spotType?: string;
    }
  ): Promise<void> {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const urgency = hoursRemaining <= 2 ? 'URGENT' : 'Reminder';
    const priority: NotificationPriority = hoursRemaining <= 2 ? 'urgent' : 'high';

    // Create in-app notification
    await this.createNotification({
      user_id: comedianId,
      type: 'spot_confirmation_deadline',
      title: `${urgency}: Spot Confirmation Required`,
      message: `Your spot at ${eventTitle} (${venue}) on ${formattedDate} needs confirmation within ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}.`,
      priority,
      data: {
        event_id: eventId,
        venue,
        event_date: eventDate,
        hours_remaining: hoursRemaining
      },
      action_url: `/events/${eventId}/spot-confirmation`,
      action_label: 'Confirm Now'
    });

    // Send email notification if email details are provided
    if (options?.comedianEmail && options?.comedianName) {
      try {
        const emailData = createSpotDeadlineEmail({
          comedianName: options.comedianName,
          comedianEmail: options.comedianEmail,
          eventTitle,
          eventDate,
          eventTime: eventDate,
          venue,
          address: options.address || venue,
          spotType: options.spotType || 'spot',
          hoursRemaining,
          confirmationUrl: `${window.location.origin}/events/${eventId}/spot-confirmation`,
          eventUrl: `${window.location.origin}/events/${eventId}`,
          promoterName: options.promoterName || 'Event Promoter',
          promoterEmail: options.promoterEmail || 'promoter@standupsyney.com'
        });

        await this.sendEmailNotification(emailData);
      } catch (error) {
        console.error('Failed to send spot deadline email:', error);
      }
    }
  }

  async notifySpotConfirmed(
    promoterId: string,
    comedianId: string,
    comedianName: string,
    eventId: string,
    eventTitle: string,
    eventDate: string,
    spotType: string,
    options?: {
      comedianEmail?: string;
      promoterName?: string;
      promoterEmail?: string;
      venue?: string;
      address?: string;
      performanceDuration?: string;
      arrivalTime?: string;
      soundCheckTime?: string;
      additionalInfo?: string;
    }
  ): Promise<void> {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Notify promoter
    await this.createNotification({
      user_id: promoterId,
      type: 'spot_confirmed',
      title: 'Spot Confirmed',
      message: `${comedianName} has confirmed their ${spotType} spot for ${eventTitle} on ${formattedDate}.`,
      priority: 'medium',
      data: {
        event_id: eventId,
        comedian_id: comedianId,
        comedian_name: comedianName,
        spot_type: spotType,
        event_date: eventDate
      },
      action_url: `/events/${eventId}/lineup`,
      action_label: 'View Lineup'
    });

    // Notify comedian (confirmation)
    await this.createNotification({
      user_id: comedianId,
      type: 'spot_confirmed',
      title: 'Spot Confirmation Received',
      message: `Thank you for confirming your ${spotType} spot for ${eventTitle} on ${formattedDate}. You're all set!`,
      priority: 'medium',
      data: {
        event_id: eventId,
        spot_type: spotType,
        event_date: eventDate
      },
      action_url: `/events/${eventId}`,
      action_label: 'View Event'
    });

    // Send email notifications if email details are provided
    if (options?.promoterEmail && options?.promoterName) {
      try {
        // Email to promoter
        const promoterEmailData = createSpotConfirmationEmail({
          comedianName,
          comedianEmail: options.comedianEmail || 'comedian@standupsyney.com',
          promoterName: options.promoterName,
          promoterEmail: options.promoterEmail,
          eventTitle,
          eventDate,
          eventTime: eventDate,
          venue: options.venue || 'Event Venue',
          address: options.address || options.venue || 'Event Venue',
          spotType,
          eventUrl: `${window.location.origin}/events/${eventId}`,
          lineupUrl: `${window.location.origin}/events/${eventId}/lineup`,
          performanceDuration: options.performanceDuration,
          arrivalTime: options.arrivalTime,
          soundCheckTime: options.soundCheckTime,
          additionalInfo: options.additionalInfo,
          isPromoterEmail: true
        });

        await this.sendEmailNotification(promoterEmailData);
      } catch (error) {
        console.error('Failed to send spot confirmation email to promoter:', error);
      }
    }

    if (options?.comedianEmail) {
      try {
        // Email to comedian
        const comedianEmailData = createSpotConfirmationEmail({
          comedianName,
          comedianEmail: options.comedianEmail,
          promoterName: options.promoterName || 'Event Promoter',
          promoterEmail: options.promoterEmail || 'promoter@standupsyney.com',
          eventTitle,
          eventDate,
          eventTime: eventDate,
          venue: options.venue || 'Event Venue',
          address: options.address || options.venue || 'Event Venue',
          spotType,
          eventUrl: `${window.location.origin}/events/${eventId}`,
          lineupUrl: `${window.location.origin}/events/${eventId}/lineup`,
          performanceDuration: options.performanceDuration,
          arrivalTime: options.arrivalTime,
          soundCheckTime: options.soundCheckTime,
          additionalInfo: options.additionalInfo,
          isPromoterEmail: false
        });

        await this.sendEmailNotification(comedianEmailData);
      } catch (error) {
        console.error('Failed to send spot confirmation email to comedian:', error);
      }
    }
  }

  async notifySpotDeclined(
    promoterId: string,
    comedianId: string,
    comedianName: string,
    eventId: string,
    eventTitle: string,
    eventDate: string,
    spotType: string,
    reason?: string,
    options?: {
      comedianEmail?: string;
      promoterName?: string;
      promoterEmail?: string;
      venue?: string;
      address?: string;
    }
  ): Promise<void> {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const reasonText = reason ? ` Reason: ${reason}` : '';

    // Notify promoter
    await this.createNotification({
      user_id: promoterId,
      type: 'spot_declined',
      title: 'Spot Declined',
      message: `${comedianName} has declined their ${spotType} spot for ${eventTitle} on ${formattedDate}.${reasonText}`,
      priority: 'high',
      data: {
        event_id: eventId,
        comedian_id: comedianId,
        comedian_name: comedianName,
        spot_type: spotType,
        event_date: eventDate,
        reason
      },
      action_url: `/events/${eventId}/applications`,
      action_label: 'Find Replacement'
    });

    // Notify comedian (acknowledgment)
    await this.createNotification({
      user_id: comedianId,
      type: 'spot_declined',
      title: 'Spot Declined',
      message: `You have declined the ${spotType} spot for ${eventTitle} on ${formattedDate}. Thank you for letting us know.`,
      priority: 'low',
      data: {
        event_id: eventId,
        spot_type: spotType,
        event_date: eventDate
      },
      action_url: `/events`,
      action_label: 'Browse Events'
    });

    // Send email notifications if email details are provided
    if (options?.promoterEmail && options?.promoterName) {
      try {
        // Email to promoter
        const promoterEmailData = createSpotDeclinedEmail({
          comedianName,
          comedianEmail: options.comedianEmail || 'comedian@standupsyney.com',
          promoterName: options.promoterName,
          promoterEmail: options.promoterEmail,
          eventTitle,
          eventDate,
          eventTime: eventDate,
          venue: options.venue || 'Event Venue',
          address: options.address || options.venue || 'Event Venue',
          spotType,
          reason,
          eventUrl: `${window.location.origin}/events/${eventId}`,
          applicationsUrl: `${window.location.origin}/events/${eventId}/applications`,
          eventsUrl: `${window.location.origin}/events`,
          isPromoterEmail: true
        });

        await this.sendEmailNotification(promoterEmailData);
      } catch (error) {
        console.error('Failed to send spot declined email to promoter:', error);
      }
    }

    if (options?.comedianEmail) {
      try {
        // Email to comedian
        const comedianEmailData = createSpotDeclinedEmail({
          comedianName,
          comedianEmail: options.comedianEmail,
          promoterName: options.promoterName || 'Event Promoter',
          promoterEmail: options.promoterEmail || 'promoter@standupsyney.com',
          eventTitle,
          eventDate,
          eventTime: eventDate,
          venue: options.venue || 'Event Venue',
          address: options.address || options.venue || 'Event Venue',
          spotType,
          reason,
          eventUrl: `${window.location.origin}/events/${eventId}`,
          applicationsUrl: `${window.location.origin}/events/${eventId}/applications`,
          eventsUrl: `${window.location.origin}/events`,
          isPromoterEmail: false
        });

        await this.sendEmailNotification(comedianEmailData);
      } catch (error) {
        console.error('Failed to send spot declined email to comedian:', error);
      }
    }
  }

  async notifySpotCancelled(
    comedianId: string,
    eventId: string,
    eventTitle: string,
    eventDate: string,
    spotType: string,
    reason?: string
  ): Promise<void> {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const reasonText = reason ? ` Reason: ${reason}` : '';

    await this.createNotification({
      user_id: comedianId,
      type: 'spot_cancelled',
      title: 'Spot Cancelled',
      message: `Your ${spotType} spot for ${eventTitle} on ${formattedDate} has been cancelled.${reasonText}`,
      priority: 'high',
      data: {
        event_id: eventId,
        spot_type: spotType,
        event_date: eventDate,
        reason
      },
      action_url: `/events`,
      action_label: 'Browse Events'
    });
  }

  async notifySpotReminder(
    comedianId: string,
    eventId: string,
    eventTitle: string,
    eventDate: string,
    spotType: string,
    venue: string,
    address: string,
    daysUntil: number
  ): Promise<void> {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = new Date(eventDate).toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const timeText = daysUntil === 0 ? 'today' : 
                    daysUntil === 1 ? 'tomorrow' : 
                    `in ${daysUntil} days`;

    await this.createNotification({
      user_id: comedianId,
      type: 'spot_reminder',
      title: `Upcoming Show: ${eventTitle}`,
      message: `Reminder: You have a ${spotType} spot ${timeText} at ${venue} (${address}) on ${formattedDate} at ${formattedTime}.`,
      priority: daysUntil === 0 ? 'urgent' : daysUntil === 1 ? 'high' : 'medium',
      data: {
        event_id: eventId,
        spot_type: spotType,
        venue,
        address,
        event_date: eventDate,
        days_until: daysUntil
      },
      action_url: `/events/${eventId}`,
      action_label: 'View Event Details'
    });
  }

  // =====================================
  // BULK SPOT NOTIFICATIONS
  // =====================================

  async notifyMultipleSpotAssignments(
    assignments: Array<{
      comedianId: string;
      eventId: string;
      eventTitle: string;
      eventDate: string;
      spotType: string;
      venue: string;
      confirmationDeadline: string;
    }>
  ): Promise<void> {
    const notifications = assignments.map(assignment => {
      const formattedDate = new Date(assignment.eventDate).toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formattedTime = new Date(assignment.eventDate).toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const deadlineDate = new Date(assignment.confirmationDeadline).toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        user_id: assignment.comedianId,
        type: 'spot_assigned' as NotificationType,
        title: `Spot Assigned: ${assignment.eventTitle}`,
        message: `Congratulations! You've been assigned a ${assignment.spotType} spot at ${assignment.venue} on ${formattedDate} at ${formattedTime}. Please confirm your availability by ${deadlineDate}.`,
        priority: 'high' as NotificationPriority,
        data: {
          event_id: assignment.eventId,
          spot_type: assignment.spotType,
          venue: assignment.venue,
          event_date: assignment.eventDate,
          confirmation_deadline: assignment.confirmationDeadline
        },
        action_url: `/events/${assignment.eventId}/spot-confirmation`,
        action_label: 'Confirm Spot',
        expires_at: assignment.confirmationDeadline
      };
    });

    await this.createBulkNotifications(notifications);
  }

  async notifyEventLineupComplete(
    promoterId: string,
    eventId: string,
    eventTitle: string,
    eventDate: string,
    totalSpots: number,
    confirmedSpots: number
  ): Promise<void> {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const isComplete = confirmedSpots === totalSpots;
    const title = isComplete ? 'Event Lineup Complete' : 'Event Lineup Update';
    const message = isComplete 
      ? `All ${totalSpots} spots for ${eventTitle} on ${formattedDate} have been confirmed. Your lineup is complete!`
      : `${confirmedSpots} of ${totalSpots} spots confirmed for ${eventTitle} on ${formattedDate}.`;

    await this.createNotification({
      user_id: promoterId,
      type: isComplete ? 'spot_confirmed' : 'spot_reminder',
      title,
      message,
      priority: isComplete ? 'medium' : 'low',
      data: {
        event_id: eventId,
        event_date: eventDate,
        total_spots: totalSpots,
        confirmed_spots: confirmedSpots,
        lineup_complete: isComplete
      },
      action_url: `/events/${eventId}/lineup`,
      action_label: 'View Lineup'
    });
  }

  // =====================================
  // APPLICATION STATUS NOTIFICATIONS
  // =====================================
  async notifyApplicationSubmitted(
    promoterId: string,
    comedianId: string,
    eventId: string,
    eventTitle: string,
    comedianName: string,
    eventDate: string
  ): Promise<void> {
    await this.createNotification({
      user_id: promoterId,
      type: 'application_submitted',
      title: 'New Application Received',
      message: `${comedianName} has applied to perform at "${eventTitle}".`,
      priority: 'medium',
      data: {
        event_id: eventId,
        comedian_id: comedianId,
        event_title: eventTitle,
        comedian_name: comedianName,
        event_date: eventDate
      },
      action_url: `/events/${eventId}/applications`,
      action_label: 'Review Application'
    });
  }

  async notifyApplicationAccepted(
    comedianId: string,
    eventId: string,
    eventTitle: string,
    eventDate: string,
    spotType: string
  ): Promise<void> {
    await this.createNotification({
      user_id: comedianId,
      type: 'application_accepted',
      title: 'Application Accepted!',
      message: `Your application to perform at "${eventTitle}" has been accepted for a ${spotType} spot.`,
      priority: 'high',
      data: {
        event_id: eventId,
        event_title: eventTitle,
        event_date: eventDate,
        spot_type: spotType
      },
      action_url: `/events/${eventId}`,
      action_label: 'View Event'
    });
  }

  async notifyApplicationRejected(
    comedianId: string,
    eventId: string,
    eventTitle: string,
    eventDate: string
  ): Promise<void> {
    await this.createNotification({
      user_id: comedianId,
      type: 'application_rejected',
      title: 'Application Update',
      message: `Your application for "${eventTitle}" was not selected this time.`,
      priority: 'medium',
      data: {
        event_id: eventId,
        event_title: eventTitle,
        event_date: eventDate
      },
      action_url: `/events`,
      action_label: 'Browse Events'
    });
  }

  async notifyApplicationWithdrawn(
    promoterId: string,
    eventId: string,
    eventTitle: string,
    comedianName: string
  ): Promise<void> {
    await this.createNotification({
      user_id: promoterId,
      type: 'application_withdrawn',
      title: 'Application Withdrawn',
      message: `${comedianName} has withdrawn their application for "${eventTitle}".`,
      priority: 'low',
      data: {
        event_id: eventId,
        event_title: eventTitle,
        comedian_name: comedianName
      },
      action_url: `/events/${eventId}/applications`,
      action_label: 'View Applications'
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