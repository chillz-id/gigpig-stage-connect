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

// Re-export data interfaces for consumers
export type { SpotAssignmentEmailData } from './SpotAssignment';
export type { SpotDeadlineEmailData } from './SpotDeadline';
export type { SpotConfirmationEmailData } from './SpotConfirmation';
export type { DeadlineReminderEmailData } from './DeadlineReminder';
export type { InvoiceEmailData } from './invoicing/InvoiceEmail';
export type { InvoiceReminderData } from './invoicing/InvoiceReminder';
export type { InvoicePaymentReceiptData } from './invoicing/InvoiceReceipt';

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
