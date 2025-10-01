// Email Notification Service - Email-specific logic and templates
import { supabase } from '@/integrations/supabase/client';
import { 
  createSpotAssignmentEmail, 
  createSpotDeadlineEmail, 
  createSpotConfirmationEmail, 
  createSpotDeclinedEmail,
  getEmailTemplateMetadata,
  EmailTemplateData
} from '@/templates/email';
import { notificationManager } from './NotificationManager';
import type { NotificationType } from './NotificationManager';

class EmailNotificationService {
  // =====================================
  // EMAIL TEMPLATE MANAGEMENT
  // =====================================

  private async sendEmailNotification(emailData: EmailTemplateData): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) {
        console.error('Failed to send email:', error);
        throw new Error(`Email sending failed: ${error.message}`);
      }

      console.log('Email sent successfully:', data);
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  // =====================================
  // SPOT ASSIGNMENT EMAIL NOTIFICATIONS
  // =====================================

  async sendSpotAssignmentEmail(
    spotData: {
      eventName: string;
      eventDate: string;
      eventTime: string;
      eventVenue: string;
      eventAddress: string;
      spotDetails: string;
      comedianName: string;
      comedianEmail: string;
      confirmationDeadline: string;
      confirmationUrl: string;
      eventManagerName: string;
      eventManagerEmail: string;
      specialInstructions?: string;
    }
  ): Promise<void> {
    const emailTemplate = createSpotAssignmentEmail(spotData);
    await this.sendEmailNotification(emailTemplate);
  }

  async sendSpotDeadlineEmail(
    spotData: {
      eventName: string;
      eventDate: string;
      eventTime: string;
      comedianName: string;
      comedianEmail: string;
      confirmationDeadline: string;
      confirmationUrl: string;
      hoursRemaining: number;
    }
  ): Promise<void> {
    const emailTemplate = createSpotDeadlineEmail(spotData);
    await this.sendEmailNotification(emailTemplate);
  }

  async sendSpotConfirmationEmail(
    spotData: {
      eventName: string;
      eventDate: string;
      eventTime: string;
      eventVenue: string;
      eventAddress: string;
      comedianName: string;
      comedianEmail: string;
      eventManagerName: string;
      eventManagerEmail: string;
      specialInstructions?: string;
      backlineInfo?: string;
      arrivalTime?: string;
    }
  ): Promise<void> {
    const emailTemplate = createSpotConfirmationEmail(spotData);
    await this.sendEmailNotification(emailTemplate);
  }

  async sendSpotDeclinedEmail(
    spotData: {
      eventName: string;
      eventDate: string;
      comedianName: string;
      comedianEmail: string;
      eventManagerName: string;
      eventManagerEmail: string;
      reason?: string;
    }
  ): Promise<void> {
    const emailTemplate = createSpotDeclinedEmail(spotData);
    await this.sendEmailNotification(emailTemplate);
  }

  // =====================================
  // TOUR EMAIL NOTIFICATIONS
  // =====================================

  async sendTourCreatedEmail(
    tourData: {
      tourName: string;
      tourDescription: string;
      startDate: string;
      endDate: string;
      managerName: string;
      managerEmail: string;
      recipientName: string;
      recipientEmail: string;
      tourUrl: string;
    }
  ): Promise<void> {
    const emailTemplate: EmailTemplateData = {
      templateName: 'tour-created',
      recipientEmail: tourData.recipientEmail,
      recipientName: tourData.recipientName,
      subject: `New Tour Created: ${tourData.tourName}`,
      data: {
        tourName: tourData.tourName,
        tourDescription: tourData.tourDescription,
        startDate: tourData.startDate,
        endDate: tourData.endDate,
        managerName: tourData.managerName,
        tourUrl: tourData.tourUrl
      }
    };

    await this.sendEmailNotification(emailTemplate);
  }

  async sendCollaborationInviteEmail(
    inviteData: {
      tourName: string;
      requesterName: string;
      requesterEmail: string;
      collaboratorName: string;
      collaboratorEmail: string;
      inviteMessage: string;
      acceptUrl: string;
      declineUrl: string;
    }
  ): Promise<void> {
    const emailTemplate: EmailTemplateData = {
      templateName: 'collaboration-invite',
      recipientEmail: inviteData.collaboratorEmail,
      recipientName: inviteData.collaboratorName,
      subject: `Tour Collaboration Invite: ${inviteData.tourName}`,
      data: {
        tourName: inviteData.tourName,
        requesterName: inviteData.requesterName,
        inviteMessage: inviteData.inviteMessage,
        acceptUrl: inviteData.acceptUrl,
        declineUrl: inviteData.declineUrl
      }
    };

    await this.sendEmailNotification(emailTemplate);
  }

  // =====================================
  // TASK EMAIL NOTIFICATIONS
  // =====================================

  async sendTaskAssignedEmail(
    taskData: {
      taskTitle: string;
      taskDescription: string;
      dueDate: string;
      assignerName: string;
      assigneeName: string;
      assigneeEmail: string;
      taskUrl: string;
      priority: string;
    }
  ): Promise<void> {
    const emailTemplate: EmailTemplateData = {
      templateName: 'task-assigned',
      recipientEmail: taskData.assigneeEmail,
      recipientName: taskData.assigneeName,
      subject: `New Task Assigned: ${taskData.taskTitle}`,
      data: {
        taskTitle: taskData.taskTitle,
        taskDescription: taskData.taskDescription,
        dueDate: taskData.dueDate,
        assignerName: taskData.assignerName,
        taskUrl: taskData.taskUrl,
        priority: taskData.priority
      }
    };

    await this.sendEmailNotification(emailTemplate);
  }

  async sendTaskDueSoonEmail(
    taskData: {
      taskTitle: string;
      dueDate: string;
      assigneeName: string;
      assigneeEmail: string;
      taskUrl: string;
      hoursRemaining: number;
    }
  ): Promise<void> {
    const emailTemplate: EmailTemplateData = {
      templateName: 'task-due-soon',
      recipientEmail: taskData.assigneeEmail,
      recipientName: taskData.assigneeName,
      subject: `Task Due Soon: ${taskData.taskTitle}`,
      data: {
        taskTitle: taskData.taskTitle,
        dueDate: taskData.dueDate,
        taskUrl: taskData.taskUrl,
        hoursRemaining: taskData.hoursRemaining
      }
    };

    await this.sendEmailNotification(emailTemplate);
  }

  // =====================================
  // FLIGHT EMAIL NOTIFICATIONS
  // =====================================

  async sendFlightDelayEmail(
    flightData: {
      passengerName: string;
      passengerEmail: string;
      flightNumber: string;
      route: string;
      originalTime: string;
      newTime: string;
      delayDuration: string;
      reason?: string;
    }
  ): Promise<void> {
    const emailTemplate: EmailTemplateData = {
      templateName: 'flight-delay',
      recipientEmail: flightData.passengerEmail,
      recipientName: flightData.passengerName,
      subject: `Flight Delay Notice: ${flightData.flightNumber}`,
      data: {
        flightNumber: flightData.flightNumber,
        route: flightData.route,
        originalTime: flightData.originalTime,
        newTime: flightData.newTime,
        delayDuration: flightData.delayDuration,
        reason: flightData.reason
      }
    };

    await this.sendEmailNotification(emailTemplate);
  }

  // =====================================
  // APPLICATION EMAIL NOTIFICATIONS
  // =====================================

  async sendApplicationSubmittedEmail(
    applicationData: {
      applicantName: string;
      applicantEmail: string;
      eventName: string;
      submissionDate: string;
      applicationUrl: string;
    }
  ): Promise<void> {
    const emailTemplate: EmailTemplateData = {
      templateName: 'application-submitted',
      recipientEmail: applicationData.applicantEmail,
      recipientName: applicationData.applicantName,
      subject: `Application Submitted: ${applicationData.eventName}`,
      data: {
        eventName: applicationData.eventName,
        submissionDate: applicationData.submissionDate,
        applicationUrl: applicationData.applicationUrl
      }
    };

    await this.sendEmailNotification(emailTemplate);
  }

  async sendApplicationAcceptedEmail(
    applicationData: {
      applicantName: string;
      applicantEmail: string;
      eventName: string;
      eventDate: string;
      eventVenue: string;
      nextStepsUrl: string;
    }
  ): Promise<void> {
    const emailTemplate: EmailTemplateData = {
      templateName: 'application-accepted',
      recipientEmail: applicationData.applicantEmail,
      recipientName: applicationData.applicantName,
      subject: `Application Accepted: ${applicationData.eventName}`,
      data: {
        eventName: applicationData.eventName,
        eventDate: applicationData.eventDate,
        eventVenue: applicationData.eventVenue,
        nextStepsUrl: applicationData.nextStepsUrl
      }
    };

    await this.sendEmailNotification(emailTemplate);
  }

  async sendApplicationRejectedEmail(
    applicationData: {
      applicantName: string;
      applicantEmail: string;
      eventName: string;
      feedback?: string;
      futureOpportunitiesUrl?: string;
    }
  ): Promise<void> {
    const emailTemplate: EmailTemplateData = {
      templateName: 'application-rejected',
      recipientEmail: applicationData.applicantEmail,
      recipientName: applicationData.applicantName,
      subject: `Application Update: ${applicationData.eventName}`,
      data: {
        eventName: applicationData.eventName,
        feedback: applicationData.feedback,
        futureOpportunitiesUrl: applicationData.futureOpportunitiesUrl
      }
    };

    await this.sendEmailNotification(emailTemplate);
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  async getEmailTemplate(templateName: string): Promise<any> {
    return getEmailTemplateMetadata(templateName);
  }

  async validateEmailTemplate(templateData: EmailTemplateData): Promise<boolean> {
    try {
      const metadata = await this.getEmailTemplate(templateData.templateName);
      return metadata !== null;
    } catch (error) {
      console.error('Email template validation failed:', error);
      return false;
    }
  }

  async sendCustomEmail(
    templateName: string,
    recipientEmail: string,
    recipientName: string,
    subject: string,
    data: Record<string, any>
  ): Promise<void> {
    const emailTemplate: EmailTemplateData = {
      templateName,
      recipientEmail,
      recipientName,
      subject,
      data
    };

    if (await this.validateEmailTemplate(emailTemplate)) {
      await this.sendEmailNotification(emailTemplate);
    } else {
      throw new Error(`Invalid email template: ${templateName}`);
    }
  }
}

export const emailNotificationService = new EmailNotificationService();
export default EmailNotificationService;