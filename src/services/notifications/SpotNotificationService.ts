// Spot Notification Service - Spot assignment and confirmation notifications
import { notificationManager } from './NotificationManager';
import { emailNotificationService } from './EmailNotificationService';
import { pushNotificationService } from './PushNotificationService';
import type { NotificationType, CreateNotificationRequest } from './NotificationManager';

interface SpotData {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventAddress: string;
  comedianId: string;
  comedianName: string;
  comedianEmail: string;
  spotDetails: string;
  confirmationDeadline: string;
  eventManagerName: string;
  eventManagerEmail: string;
  specialInstructions?: string;
  backlineInfo?: string;
  arrivalTime?: string;
}

class SpotNotificationService {
  // =====================================
  // SPOT ASSIGNMENT NOTIFICATIONS
  // =====================================

  async notifySpotAssigned(spotData: SpotData): Promise<void> {
    const confirmationUrl = `${window.location.origin}/spots/confirm/${spotData.id}`;

    // Create database notification
    const notificationRequest: CreateNotificationRequest = {
      user_id: spotData.comedianId,
      type: 'spot_assigned',
      title: 'New Spot Assignment',
      message: `You've been assigned a spot for ${spotData.eventName} on ${spotData.eventDate}`,
      priority: 'high',
      data: {
        eventId: spotData.eventId,
        eventName: spotData.eventName,
        eventDate: spotData.eventDate,
        eventVenue: spotData.eventVenue,
        spotDetails: spotData.spotDetails,
        confirmationDeadline: spotData.confirmationDeadline
      },
      action_url: confirmationUrl,
      action_label: 'Confirm Spot',
      expires_at: spotData.confirmationDeadline
    };

    await notificationManager.createNotification(notificationRequest);

    // Send email notification
    await emailNotificationService.sendSpotAssignmentEmail({
      eventName: spotData.eventName,
      eventDate: spotData.eventDate,
      eventTime: spotData.eventTime,
      eventVenue: spotData.eventVenue,
      eventAddress: spotData.eventAddress,
      spotDetails: spotData.spotDetails,
      comedianName: spotData.comedianName,
      comedianEmail: spotData.comedianEmail,
      confirmationDeadline: spotData.confirmationDeadline,
      confirmationUrl,
      eventManagerName: spotData.eventManagerName,
      eventManagerEmail: spotData.eventManagerEmail,
      specialInstructions: spotData.specialInstructions
    });

    // Send push notification
    await pushNotificationService.handleSpotAssignmentNotification(
      spotData.comedianName,
      spotData.eventName,
      spotData.eventDate,
      confirmationUrl
    );
  }

  // =====================================
  // SPOT CONFIRMATION DEADLINE NOTIFICATIONS
  // =====================================

  async notifySpotConfirmationDeadline(
    spotData: SpotData,
    hoursRemaining: number
  ): Promise<void> {
    const confirmationUrl = `${window.location.origin}/spots/confirm/${spotData.id}`;

    // Create database notification
    const notificationRequest: CreateNotificationRequest = {
      user_id: spotData.comedianId,
      type: 'spot_confirmation_deadline',
      title: 'Spot Confirmation Deadline Approaching',
      message: `You have ${hoursRemaining} hours left to confirm your spot for ${spotData.eventName}`,
      priority: 'urgent',
      data: {
        eventId: spotData.eventId,
        eventName: spotData.eventName,
        eventDate: spotData.eventDate,
        hoursRemaining,
        confirmationDeadline: spotData.confirmationDeadline
      },
      action_url: confirmationUrl,
      action_label: 'Confirm Now',
      expires_at: spotData.confirmationDeadline
    };

    await notificationManager.createNotification(notificationRequest);

    // Send email reminder
    await emailNotificationService.sendSpotDeadlineEmail({
      eventName: spotData.eventName,
      eventDate: spotData.eventDate,
      eventTime: spotData.eventTime,
      comedianName: spotData.comedianName,
      comedianEmail: spotData.comedianEmail,
      confirmationDeadline: spotData.confirmationDeadline,
      confirmationUrl,
      hoursRemaining
    });

    // Send push notification
    await pushNotificationService.handleSpotDeadlineNotification(
      spotData.comedianName,
      spotData.eventName,
      hoursRemaining,
      confirmationUrl
    );
  }

  // =====================================
  // SPOT CONFIRMATION NOTIFICATIONS
  // =====================================

  async notifySpotConfirmed(spotData: SpotData): Promise<void> {
    const eventUrl = `${window.location.origin}/events/${spotData.eventId}`;

    // Notify comedian
    const comedianNotification: CreateNotificationRequest = {
      user_id: spotData.comedianId,
      type: 'spot_confirmed',
      title: 'Spot Confirmed Successfully',
      message: `Your spot for ${spotData.eventName} has been confirmed`,
      priority: 'medium',
      data: {
        eventId: spotData.eventId,
        eventName: spotData.eventName,
        eventDate: spotData.eventDate,
        eventVenue: spotData.eventVenue
      },
      action_url: eventUrl,
      action_label: 'View Event Details'
    };

    await notificationManager.createNotification(comedianNotification);

    // Send confirmation email to comedian
    await emailNotificationService.sendSpotConfirmationEmail({
      eventName: spotData.eventName,
      eventDate: spotData.eventDate,
      eventTime: spotData.eventTime,
      eventVenue: spotData.eventVenue,
      eventAddress: spotData.eventAddress,
      comedianName: spotData.comedianName,
      comedianEmail: spotData.comedianEmail,
      eventManagerName: spotData.eventManagerName,
      eventManagerEmail: spotData.eventManagerEmail,
      specialInstructions: spotData.specialInstructions,
      backlineInfo: spotData.backlineInfo,
      arrivalTime: spotData.arrivalTime
    });

    // TODO: Notify event manager about confirmation
    // This would require getting the event manager's user ID
  }

  // =====================================
  // SPOT DECLINED NOTIFICATIONS
  // =====================================

  async notifySpotDeclined(
    spotData: SpotData,
    reason?: string
  ): Promise<void> {
    const eventUrl = `${window.location.origin}/events/${spotData.eventId}`;

    // Notify comedian
    const comedianNotification: CreateNotificationRequest = {
      user_id: spotData.comedianId,
      type: 'spot_declined',
      title: 'Spot Declined',
      message: `You have declined the spot for ${spotData.eventName}`,
      priority: 'low',
      data: {
        eventId: spotData.eventId,
        eventName: spotData.eventName,
        eventDate: spotData.eventDate,
        reason
      },
      action_url: eventUrl,
      action_label: 'View Other Events'
    };

    await notificationManager.createNotification(comedianNotification);

    // TODO: Notify event manager about declined spot
    // This would require getting the event manager's user ID
  }

  // =====================================
  // SPOT CANCELLATION NOTIFICATIONS
  // =====================================

  async notifySpotCancelled(
    spotData: SpotData,
    cancellationReason?: string
  ): Promise<void> {
    const eventsUrl = `${window.location.origin}/events`;

    // Notify comedian
    const notificationRequest: CreateNotificationRequest = {
      user_id: spotData.comedianId,
      type: 'spot_cancelled',
      title: 'Spot Cancelled',
      message: `Your spot for ${spotData.eventName} on ${spotData.eventDate} has been cancelled`,
      priority: 'high',
      data: {
        eventId: spotData.eventId,
        eventName: spotData.eventName,
        eventDate: spotData.eventDate,
        cancellationReason
      },
      action_url: eventsUrl,
      action_label: 'Browse Other Events'
    };

    await notificationManager.createNotification(notificationRequest);

    // Send email notification
    const emailTemplate = {
      templateName: 'spot-cancelled',
      recipientEmail: spotData.comedianEmail,
      recipientName: spotData.comedianName,
      subject: `Spot Cancelled: ${spotData.eventName}`,
      data: {
        eventName: spotData.eventName,
        eventDate: spotData.eventDate,
        eventVenue: spotData.eventVenue,
        cancellationReason,
        eventManagerName: spotData.eventManagerName,
        alternativeEventsUrl: eventsUrl
      }
    };

    await emailNotificationService.sendCustomEmail(
      emailTemplate.templateName,
      emailTemplate.recipientEmail,
      emailTemplate.recipientName,
      emailTemplate.subject,
      emailTemplate.data
    );
  }

  // =====================================
  // SPOT REMINDER NOTIFICATIONS
  // =====================================

  async notifySpotReminder(
    spotData: SpotData,
    reminderType: 'day_before' | 'hour_before' | 'custom',
    customMessage?: string
  ): Promise<void> {
    const eventUrl = `${window.location.origin}/events/${spotData.eventId}`;
    
    let title = '';
    let message = '';

    switch (reminderType) {
      case 'day_before':
        title = 'Event Tomorrow';
        message = `Reminder: You have a spot at ${spotData.eventName} tomorrow at ${spotData.eventTime}`;
        break;
      case 'hour_before':
        title = 'Event Starting Soon';
        message = `Reminder: Your spot at ${spotData.eventName} starts in 1 hour`;
        break;
      case 'custom':
        title = 'Event Reminder';
        message = customMessage || `Reminder: ${spotData.eventName} on ${spotData.eventDate}`;
        break;
    }

    // Create database notification
    const notificationRequest: CreateNotificationRequest = {
      user_id: spotData.comedianId,
      type: 'spot_reminder',
      title,
      message,
      priority: reminderType === 'hour_before' ? 'high' : 'medium',
      data: {
        eventId: spotData.eventId,
        eventName: spotData.eventName,
        eventDate: spotData.eventDate,
        eventTime: spotData.eventTime,
        eventVenue: spotData.eventVenue,
        reminderType
      },
      action_url: eventUrl,
      action_label: 'View Event Details'
    };

    await notificationManager.createNotification(notificationRequest);

    // Send email reminder if it's day before or custom
    if (reminderType !== 'hour_before') {
      const emailTemplate = {
        templateName: 'spot-reminder',
        recipientEmail: spotData.comedianEmail,
        recipientName: spotData.comedianName,
        subject: `${title}: ${spotData.eventName}`,
        data: {
          eventName: spotData.eventName,
          eventDate: spotData.eventDate,
          eventTime: spotData.eventTime,
          eventVenue: spotData.eventVenue,
          eventAddress: spotData.eventAddress,
          reminderType,
          customMessage,
          eventUrl
        }
      };

      await emailNotificationService.sendCustomEmail(
        emailTemplate.templateName,
        emailTemplate.recipientEmail,
        emailTemplate.recipientName,
        emailTemplate.subject,
        emailTemplate.data
      );
    }
  }

  // =====================================
  // BATCH SPOT NOTIFICATIONS
  // =====================================

  async notifyMultipleSpotAssignments(
    spotAssignments: Array<{
      spotData: SpotData;
      customMessage?: string;
    }>
  ): Promise<void> {
    // Process assignments in parallel but with rate limiting
    const batchSize = 3;
    for (let i = 0; i < spotAssignments.length; i += batchSize) {
      const batch = spotAssignments.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async ({ spotData, customMessage }) => {
          try {
            await this.notifySpotAssigned(spotData);
          } catch (error) {
            console.error(`Failed to notify spot assignment for ${spotData.comedianName}:`, error);
          }
        })
      );

      // Small delay between batches to avoid overwhelming the email service
      if (i + batchSize < spotAssignments.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async notifyEventLineupComplete(
    eventId: string,
    eventName: string,
    eventDate: string,
    comedianIds: string[],
    lineupDetails: string
  ): Promise<void> {
    const eventUrl = `${window.location.origin}/events/${eventId}`;

    // Create notifications for all comedians in the lineup
    const notifications: CreateNotificationRequest[] = comedianIds.map(comedianId => ({
      user_id: comedianId,
      type: 'general',
      title: 'Event Lineup Complete',
      message: `The lineup for ${eventName} on ${eventDate} is now complete`,
      priority: 'medium',
      data: {
        eventId,
        eventName,
        eventDate,
        lineupDetails
      },
      action_url: eventUrl,
      action_label: 'View Full Lineup'
    }));

    await notificationManager.createBulkNotifications(notifications);
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  async getSpotNotificationHistory(
    comedianId: string,
    eventId?: string
  ): Promise<any[]> {
    const filters: any = {
      isRead: false,
      limit: 50
    };

    const spotNotificationTypes: NotificationType[] = [
      'spot_assigned',
      'spot_confirmation_deadline',
      'spot_confirmed',
      'spot_declined',
      'spot_cancelled',
      'spot_reminder'
    ];

    const allNotifications = [];
    
    for (const type of spotNotificationTypes) {
      const { notifications } = await notificationManager.getNotifications(comedianId, {
        ...filters,
        type
      });

      if (eventId) {
        // Filter by event if specified
        const eventNotifications = notifications.filter(
          n => n.data?.eventId === eventId
        );
        allNotifications.push(...eventNotifications);
      } else {
        allNotifications.push(...notifications);
      }
    }

    // Sort by creation date, most recent first
    return allNotifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async markSpotNotificationsAsRead(
    comedianId: string,
    eventId: string
  ): Promise<void> {
    const notifications = await this.getSpotNotificationHistory(comedianId, eventId);
    
    for (const notification of notifications) {
      if (!notification.is_read) {
        await notificationManager.markAsRead(notification.id);
      }
    }
  }
}

export const spotNotificationService = new SpotNotificationService();
export default SpotNotificationService;
