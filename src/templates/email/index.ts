// React Email templates — re-exports and wrapper functions
// These wrappers preserve the same interface used by EmailNotificationService

import {
  renderHtml as renderSpotAssignmentHtml,
  renderText as renderSpotAssignmentText,
} from './SpotAssignment';
import type { SpotAssignmentEmailData } from './SpotAssignment';

import {
  renderHtml as renderSpotDeadlineHtml,
  renderText as renderSpotDeadlineText,
} from './SpotDeadline';
import type { SpotDeadlineEmailData } from './SpotDeadline';

import {
  renderHtml as renderSpotConfirmationHtml,
  renderText as renderSpotConfirmationText,
} from './SpotConfirmation';
import type { SpotConfirmationEmailData } from './SpotConfirmation';

import {
  renderInvoiceHtml,
  renderInvoiceText,
} from './invoicing/InvoiceEmail';
import {
  renderReminderHtml,
  renderReminderText,
} from './invoicing/InvoiceReminder';
import {
  renderReceiptHtml,
  renderReceiptText,
} from './invoicing/InvoiceReceipt';
import type { InvoiceEmailData } from './invoicing/InvoiceEmail';
import type { InvoiceReminderData } from './invoicing/InvoiceReminder';
import type { InvoicePaymentReceiptData } from './invoicing/InvoiceReceipt';

import {
  renderHtml as renderWelcomeHtml,
  renderText as renderWelcomeText,
} from './Welcome';
import type { WelcomeEmailData } from './Welcome';

import {
  renderHtml as renderSpotDeclinedHtml,
  renderText as renderSpotDeclinedText,
} from './SpotDeclined';
import type { SpotDeclinedEmailData } from './SpotDeclined';

import {
  renderHtml as renderSpotCancelledHtml,
  renderText as renderSpotCancelledText,
} from './SpotCancelled';
import type { SpotCancelledEmailData } from './SpotCancelled';

import {
  renderHtml as renderApplicationAcceptedHtml,
  renderText as renderApplicationAcceptedText,
} from './ApplicationAccepted';
import type { ApplicationAcceptedEmailData } from './ApplicationAccepted';

import {
  renderHtml as renderLineupPublishedHtml,
  renderText as renderLineupPublishedText,
} from './LineupPublished';
import type { LineupPublishedEmailData } from './LineupPublished';

// Re-export data interfaces for consumers
export type { SpotAssignmentEmailData } from './SpotAssignment';
export type { SpotDeadlineEmailData } from './SpotDeadline';
export type { SpotConfirmationEmailData } from './SpotConfirmation';
export type { DeadlineReminderEmailData } from './DeadlineReminder';
export type { InvoiceEmailData } from './invoicing/InvoiceEmail';
export type { InvoiceReminderData } from './invoicing/InvoiceReminder';
export type { InvoicePaymentReceiptData } from './invoicing/InvoiceReceipt';
export type { WelcomeEmailData } from './Welcome';
export type { SpotDeclinedEmailData } from './SpotDeclined';
export type { SpotCancelledEmailData } from './SpotCancelled';
export type { ApplicationAcceptedEmailData } from './ApplicationAccepted';
export type { LineupPublishedEmailData } from './LineupPublished';

// Re-export React components for preview/testing
export { SpotAssignment } from './SpotAssignment';
export { SpotConfirmation } from './SpotConfirmation';
export { SpotDeadline } from './SpotDeadline';
export {
  DeadlineReminder24Hour,
  DeadlineReminder6Hour,
  DeadlineReminder1Hour,
  DeadlineReminderExtended,
} from './DeadlineReminder';
export { InvoiceEmail } from './invoicing/InvoiceEmail';
export { InvoiceReminder } from './invoicing/InvoiceReminder';
export { PaymentReceipt } from './invoicing/InvoiceReceipt';
export { Welcome } from './Welcome';
export { SpotDeclined } from './SpotDeclined';
export { SpotCancelled } from './SpotCancelled';
export { ApplicationAccepted } from './ApplicationAccepted';
export { LineupPublished } from './LineupPublished';

// ---------------------------------------------------------------------------
// EmailTemplateData — the shape sent to the send-email edge function
// ---------------------------------------------------------------------------

export interface EmailTemplateData {
  to: string;
  subject: string;
  html: string;
  text: string;
  // Extended fields used by EmailNotificationService (passed through but not used by edge fn)
  templateName?: string;
  recipientEmail?: string;
  recipientName?: string;
  data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Wrapper functions — same names as before, now async
// ---------------------------------------------------------------------------

export async function createSpotAssignmentEmail(
  data: SpotAssignmentEmailData,
): Promise<EmailTemplateData> {
  const [html, text] = await Promise.all([
    renderSpotAssignmentHtml(data),
    renderSpotAssignmentText(data),
  ]);

  return {
    to: data.comedianEmail,
    subject: `Spot Assignment: ${data.eventTitle}`,
    html,
    text,
  };
}

export async function createSpotDeadlineEmail(
  data: SpotDeadlineEmailData,
): Promise<EmailTemplateData> {
  const urgency = data.hoursRemaining <= 2 ? 'URGENT' : 'REMINDER';

  const [html, text] = await Promise.all([
    renderSpotDeadlineHtml(data),
    renderSpotDeadlineText(data),
  ]);

  return {
    to: data.comedianEmail,
    subject: `${urgency}: Spot Confirmation Required - ${data.eventTitle}`,
    html,
    text,
  };
}

export async function createSpotConfirmationEmail(
  data: SpotConfirmationEmailData,
): Promise<EmailTemplateData> {
  const isPromoter = data.isPromoterEmail;
  const subject = isPromoter
    ? `Spot Confirmed: ${data.comedianName} - ${data.eventTitle}`
    : `Spot Confirmation Received - ${data.eventTitle}`;

  const [html, text] = await Promise.all([
    renderSpotConfirmationHtml(data),
    renderSpotConfirmationText(data),
  ]);

  return {
    to: isPromoter ? data.promoterEmail : data.comedianEmail,
    subject,
    html,
    text,
  };
}

export async function createInvoiceEmail(
  data: InvoiceEmailData,
): Promise<EmailTemplateData> {
  const [html, text] = await Promise.all([
    renderInvoiceHtml(data),
    renderInvoiceText(data),
  ]);

  return {
    to: data.recipientEmail,
    subject: `Invoice ${data.invoiceNumber} from ${data.senderName}`,
    html,
    text,
  };
}

export async function createInvoiceReminderEmail(
  data: InvoiceReminderData,
): Promise<EmailTemplateData> {
  const urgencyLevel = data.isUrgent
    ? 'URGENT'
    : data.isFirstReminder
      ? 'REMINDER'
      : 'FINAL NOTICE';

  const [html, text] = await Promise.all([
    renderReminderHtml(data),
    renderReminderText(data),
  ]);

  return {
    to: data.recipientEmail,
    subject: `${urgencyLevel}: Invoice ${data.invoiceNumber} Payment Due`,
    html,
    text,
  };
}

export async function createPaymentReceiptEmail(
  data: InvoicePaymentReceiptData,
): Promise<EmailTemplateData> {
  const [html, text] = await Promise.all([
    renderReceiptHtml(data),
    renderReceiptText(data),
  ]);

  return {
    to: data.recipientEmail,
    subject: `Payment Receipt - Invoice ${data.invoiceNumber}`,
    html,
    text,
  };
}

export async function createWelcomeEmail(
  data: WelcomeEmailData,
): Promise<EmailTemplateData> {
  const [html, text] = await Promise.all([
    renderWelcomeHtml(data),
    renderWelcomeText(data),
  ]);

  return {
    to: data.userEmail,
    subject: `Welcome to GigPigs, ${data.userName}!`,
    html,
    text,
  };
}

export async function createSpotDeclinedEmail(
  data: SpotDeclinedEmailData,
): Promise<EmailTemplateData> {
  const [html, text] = await Promise.all([
    renderSpotDeclinedHtml(data),
    renderSpotDeclinedText(data),
  ]);

  return {
    to: data.promoterEmail,
    subject: `Spot Declined: ${data.comedianName} - ${data.eventTitle}`,
    html,
    text,
  };
}

export async function createSpotCancelledEmail(
  data: SpotCancelledEmailData,
): Promise<EmailTemplateData> {
  const [html, text] = await Promise.all([
    renderSpotCancelledHtml(data),
    renderSpotCancelledText(data),
  ]);

  return {
    to: data.comedianEmail,
    subject: `Spot Cancelled: ${data.eventTitle}`,
    html,
    text,
  };
}

export async function createApplicationAcceptedEmail(
  data: ApplicationAcceptedEmailData,
): Promise<EmailTemplateData> {
  const [html, text] = await Promise.all([
    renderApplicationAcceptedHtml(data),
    renderApplicationAcceptedText(data),
  ]);

  return {
    to: data.comedianEmail,
    subject: `Application Accepted: ${data.eventTitle}`,
    html,
    text,
  };
}

export async function createLineupPublishedEmail(
  data: LineupPublishedEmailData,
): Promise<EmailTemplateData> {
  const [html, text] = await Promise.all([
    renderLineupPublishedHtml(data),
    renderLineupPublishedText(data),
  ]);

  return {
    to: data.comedianEmail,
    subject: `Lineup Published: ${data.eventTitle}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------------
// Email priority & metadata (unchanged)
// ---------------------------------------------------------------------------

export enum EmailPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface EmailTemplateMetadata {
  type:
    | 'spot_assigned'
    | 'spot_deadline'
    | 'spot_confirmed'
    | 'spot_declined'
    | 'spot_cancelled'
    | 'welcome'
    | 'application_accepted'
    | 'lineup_published'
    | 'invoice'
    | 'invoice_reminder'
    | 'payment_receipt';
  priority: EmailPriority;
  category:
    | 'notification'
    | 'reminder'
    | 'confirmation'
    | 'status_update'
    | 'billing';
  requiresAction: boolean;
  expiresAt?: string;
}

export function getEmailTemplateMetadata(
  type: string,
  data?: Record<string, unknown>,
): EmailTemplateMetadata {
  switch (type) {
    case 'spot_assigned':
      return {
        type: 'spot_assigned',
        priority: EmailPriority.HIGH,
        category: 'notification',
        requiresAction: true,
        expiresAt: data?.confirmationDeadline as string | undefined,
      };

    case 'spot_deadline':
      return {
        type: 'spot_deadline',
        priority:
          (data?.hoursRemaining as number) <= 2
            ? EmailPriority.URGENT
            : EmailPriority.HIGH,
        category: 'reminder',
        requiresAction: true,
      };

    case 'spot_confirmed':
      return {
        type: 'spot_confirmed',
        priority: EmailPriority.MEDIUM,
        category: 'confirmation',
        requiresAction: false,
      };

    case 'spot_declined':
      return {
        type: 'spot_declined',
        priority: EmailPriority.HIGH,
        category: 'notification',
        requiresAction: true,
      };

    case 'spot_cancelled':
      return {
        type: 'spot_cancelled',
        priority: EmailPriority.HIGH,
        category: 'notification',
        requiresAction: false,
      };

    case 'welcome':
      return {
        type: 'welcome',
        priority: EmailPriority.MEDIUM,
        category: 'notification',
        requiresAction: false,
      };

    case 'application_accepted':
      return {
        type: 'application_accepted',
        priority: EmailPriority.HIGH,
        category: 'notification',
        requiresAction: true,
      };

    case 'lineup_published':
      return {
        type: 'lineup_published',
        priority: EmailPriority.MEDIUM,
        category: 'notification',
        requiresAction: false,
      };

    case 'invoice':
      return {
        type: 'invoice',
        priority: EmailPriority.HIGH,
        category: 'billing',
        requiresAction: true,
        expiresAt: data?.dueDate as string | undefined,
      };

    case 'invoice_reminder':
      return {
        type: 'invoice_reminder',
        priority: data?.isUrgent
          ? EmailPriority.URGENT
          : EmailPriority.HIGH,
        category: 'billing',
        requiresAction: true,
      };

    case 'payment_receipt':
      return {
        type: 'payment_receipt',
        priority: EmailPriority.MEDIUM,
        category: 'billing',
        requiresAction: false,
      };

    default:
      return {
        type: type as EmailTemplateMetadata['type'],
        priority: EmailPriority.MEDIUM,
        category: 'notification',
        requiresAction: false,
      };
  }
}
