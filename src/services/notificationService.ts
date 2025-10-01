// Refactored Notification Service - Orchestrates specialized notification services
import { supabase } from '@/integrations/supabase/client';
import { notificationManager } from './notifications/NotificationManager';
import { emailNotificationService } from './notifications/EmailNotificationService';
import { pushNotificationService } from './notifications/PushNotificationService';
import { spotNotificationService } from './notifications/SpotNotificationService';
import type { NotificationType } from './notifications/NotificationManager';

// Re-export types for backwards compatibility
export type {
  NotificationType,
  NotificationPriority,
  Notification,
  CreateNotificationRequest,
  NotificationPreferences
} from './notifications/NotificationManager';

/**
 * Refactored Notification Service - Orchestrates specialized notification services
 * 
 * This service maintains the original API while delegating to specialized services:
 * - NotificationManager: Core notification CRUD and real-time subscriptions
 * - EmailNotificationService: Email templates and sending
 * - PushNotificationService: Browser and mobile push notifications
 * - SpotNotificationService: Spot assignment and confirmation workflows
 */
class RefactoredNotificationService {
  constructor() {
    notificationManager.configureHandlers({
      toast: pushNotificationService.showToastNotification.bind(pushNotificationService),
      push: pushNotificationService.sendGenericNotification.bind(pushNotificationService)
    });
  }

  // =====================================
  // CORE NOTIFICATION MANAGEMENT (delegated to NotificationManager)
  // =====================================

  subscribe = notificationManager.subscribe.bind(notificationManager);
  createNotification = notificationManager.createNotification.bind(notificationManager);
  getNotifications = notificationManager.getNotifications.bind(notificationManager);
  markAsRead = notificationManager.markAsRead.bind(notificationManager);
  markAllAsRead = notificationManager.markAllAsRead.bind(notificationManager);
  deleteNotification = notificationManager.deleteNotification.bind(notificationManager);
  getUnreadCount = notificationManager.getUnreadCount.bind(notificationManager);
  createBulkNotifications = notificationManager.createBulkNotifications.bind(notificationManager);
  getNotificationPreferences = notificationManager.getNotificationPreferences.bind(notificationManager);
  updateNotificationPreferences = notificationManager.updateNotificationPreferences.bind(notificationManager);

  // =====================================
  // TOAST NOTIFICATIONS (delegated to PushNotificationService)
  // =====================================

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    // Convert to notification format for consistency
    const notification = {
      id: '',
      user_id: '',
      type: 'general' as const,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message,
      priority: 'medium' as const,
      is_read: false,
      created_at: new Date().toISOString()
    };

    pushNotificationService.showToastNotification(notification);
  }

  showSuccess(message: string): void {
    this.showToast(message, 'success');
  }

  showError(message: string): void {
    this.showToast(message, 'error');
  }

  showWarning(message: string): void {
    this.showToast(message, 'warning');
  }

  showInfo(message: string): void {
    this.showToast(message, 'info');
  }

  // =====================================
  // PUSH NOTIFICATIONS (delegated to PushNotificationService)
  // =====================================

  requestPushPermission = pushNotificationService.requestPermission.bind(pushNotificationService);
  isPushSupported = pushNotificationService.isSupported.bind(pushNotificationService);
  getPushPermissionStatus = pushNotificationService.getPermissionStatus.bind(pushNotificationService);

  // =====================================
  // CLEANUP OPERATIONS (delegated to NotificationManager)
  // =====================================

  cleanupExpiredNotifications = notificationManager.cleanupExpiredNotifications.bind(notificationManager);
  cleanupOldNotifications = notificationManager.cleanupOldNotifications.bind(notificationManager);

  // =====================================
  // DOMAIN-SPECIFIC NOTIFICATIONS
  // =====================================

  // Tour Notifications
  async notifyTourCreated(tourId: string, tourName: string, managerId: string): Promise<void> {
    await this.createNotification({
      user_id: managerId,
      type: 'tour_created',
      title: 'Tour Created Successfully',
      message: `Your tour "${tourName}" has been created`,
      priority: 'medium',
      data: { tourId, tourName },
      action_url: `/tours/${tourId}`,
      action_label: 'View Tour'
    });
  }

  async notifyCollaborationInvite(
    tourId: string,
    tourName: string,
    requesterId: string,
    collaboratorId: string,
    message: string
  ): Promise<void> {
    await this.createNotification({
      user_id: collaboratorId,
      type: 'collaboration_invite',
      title: 'Tour Collaboration Invite',
      message: `You've been invited to collaborate on "${tourName}": ${message}`,
      priority: 'high',
      data: { tourId, tourName, requesterId },
      action_url: `/tours/${tourId}/collaboration`,
      action_label: 'View Invite'
    });
  }

  // Task Notifications
  async notifyTaskDueSoon(userId: string, taskId: string, taskTitle: string, dueDate: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'task_due_soon',
      title: 'Task Due Soon',
      message: `"${taskTitle}" is due on ${dueDate}`,
      priority: 'high',
      data: { taskId, taskTitle, dueDate },
      action_url: `/tasks/${taskId}`,
      action_label: 'View Task'
    });
  }

  // Flight Notifications
  async notifyFlightDelay(
    userId: string,
    flightNumber: string,
    route: string,
    delayDuration: string,
    newTime: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'flight_delayed',
      title: 'Flight Delayed',
      message: `Flight ${flightNumber} (${route}) is delayed by ${delayDuration}. New time: ${newTime}`,
      priority: 'urgent',
      data: { flightNumber, route, delayDuration, newTime },
      action_url: '/flights',
      action_label: 'View Flight Details'
    });
  }

  // =====================================
  // SPOT NOTIFICATIONS (delegated to SpotNotificationService)
  // =====================================

  notifySpotAssigned = spotNotificationService.notifySpotAssigned.bind(spotNotificationService);
  notifySpotConfirmationDeadline = spotNotificationService.notifySpotConfirmationDeadline.bind(spotNotificationService);
  notifySpotConfirmed = spotNotificationService.notifySpotConfirmed.bind(spotNotificationService);
  notifySpotDeclined = spotNotificationService.notifySpotDeclined.bind(spotNotificationService);
  notifySpotCancelled = spotNotificationService.notifySpotCancelled.bind(spotNotificationService);
  notifySpotReminder = spotNotificationService.notifySpotReminder.bind(spotNotificationService);
  notifyMultipleSpotAssignments = spotNotificationService.notifyMultipleSpotAssignments.bind(spotNotificationService);
  notifyEventLineupComplete = spotNotificationService.notifyEventLineupComplete.bind(spotNotificationService);

  // =====================================
  // APPLICATION NOTIFICATIONS
  // =====================================

  async notifyApplicationSubmitted(
    userId: string,
    eventId: string,
    eventName: string,
    applicationId: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'application_submitted',
      title: 'Application Submitted',
      message: `Your application for "${eventName}" has been submitted`,
      priority: 'medium',
      data: { eventId, eventName, applicationId },
      action_url: `/applications/${applicationId}`,
      action_label: 'View Application'
    });
  }

  async notifyApplicationAccepted(
    userId: string,
    eventId: string,
    eventName: string,
    applicationId: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'application_accepted',
      title: 'Application Accepted!',
      message: `Congratulations! Your application for "${eventName}" has been accepted`,
      priority: 'high',
      data: { eventId, eventName, applicationId },
      action_url: `/events/${eventId}`,
      action_label: 'View Event Details'
    });
  }

  async notifyApplicationRejected(
    userId: string,
    eventId: string,
    eventName: string,
    applicationId: string,
    feedback?: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'application_rejected',
      title: 'Application Update',
      message: `Your application for "${eventName}" was not selected${feedback ? ': ' + feedback : ''}`,
      priority: 'medium',
      data: { eventId, eventName, applicationId, feedback },
      action_url: '/events',
      action_label: 'Browse Other Events'
    });
  }

  async notifyApplicationWithdrawn(
    userId: string,
    eventId: string,
    eventName: string,
    applicationId: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'application_withdrawn',
      title: 'Application Withdrawn',
      message: `Your application for "${eventName}" has been withdrawn`,
      priority: 'low',
      data: { eventId, eventName, applicationId },
      action_url: '/events',
      action_label: 'Browse Events'
    });
  }

  // =====================================
  // BULK NOTIFICATION OPERATIONS
  // =====================================

  async notifyTourCollaborators(
    tourId: string,
    tourName: string,
    message: string,
    excludeUserId?: string,
    notificationType: NotificationType = 'tour_updated'
  ): Promise<void> {
    const { data: collaborators, error } = await supabase
      .from('tour_collaborations')
      .select('collaborator_id')
      .eq('tour_id', tourId)
      .eq('status', 'active');

    if (error) {
      console.error('Failed to fetch tour collaborators:', error);
      throw error;
    }

    const notifications = (collaborators || [])
      .map(({ collaborator_id }) => collaborator_id)
      .filter((collaboratorId): collaboratorId is string => Boolean(collaboratorId) && collaboratorId !== excludeUserId)
      .map(userId => ({
        user_id: userId,
        type: notificationType,
        title: `Update for ${tourName}`,
        message,
        priority: 'medium' as const,
        data: {
          tourId,
          tourName
        },
        action_url: `/tours/${tourId}`,
        action_label: 'View Tour'
      }));

    if (!notifications.length) {
      return;
    }

    await this.createBulkNotifications(notifications);
  }

  async notifyTaskAssignees(
    taskId: string,
    taskTitle: string,
    assignerName: string,
    dueDate: string
  ): Promise<void> {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('assignee_id')
      .eq('id', taskId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch task assignee:', error);
      throw error;
    }

    const assigneeId = task?.assignee_id;
    if (!assigneeId) {
      return;
    }

    await this.createNotification({
      user_id: assigneeId,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `${assignerName} assigned you "${taskTitle}" due ${dueDate}`,
      priority: 'high',
      data: { taskId, taskTitle, dueDate },
      action_url: `/tasks/${taskId}`,
      action_label: 'View Task'
    });
  }

  // =====================================
  // EMAIL NOTIFICATIONS (delegated to EmailNotificationService)
  // =====================================

  // Direct access to email service methods
  get email() {
    return emailNotificationService;
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  async getNotificationsByType(userId: string, type: string): Promise<any[]> {
    const { notifications } = await this.getNotifications(userId, { type: type as any });
    return notifications;
  }

  async getUnreadNotificationsByPriority(userId: string, priority: string): Promise<any[]> {
    const { notifications } = await this.getNotifications(userId, {
      isRead: false,
      priority: priority as any
    });
    return notifications;
  }

  // =====================================
  // CLEANUP
  // =====================================

  destroy(): void {
    notificationManager.destroy();
  }
}

// Export the refactored service with the same interface
export const notificationService = new RefactoredNotificationService();
export default RefactoredNotificationService;
