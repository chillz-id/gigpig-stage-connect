/**
 * Invoice Email Service
 * Renders react-email templates client-side and sends via edge function with PDF attachments.
 */

import { supabase } from '@/integrations/supabase/client';
import { pdfService, InvoicePDFData } from './pdfService';
import {
  createInvoiceEmail,
  createInvoiceReminderEmail,
} from '@/templates/email';
import type { InvoiceEmailData, InvoiceReminderData } from '@/templates/email';
import { renderInvoiceHtml } from '@/templates/email/invoicing/InvoiceEmail';

export interface SendInvoiceEmailOptions {
  invoiceId: string;
  subject?: string;
  message?: string;
  attachPdf?: boolean;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

export interface SendInvoiceEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipients?: string[];
  cc?: string[];
  bcc?: string[];
}

/**
 * Transform InvoicePDFData (DB shape) → InvoiceEmailData (template shape)
 */
/**
 * Fetch event name for an invoice if event_id is present.
 */
async function fetchEventName(eventId?: string): Promise<string | undefined> {
  if (!eventId) return undefined;
  const { data } = await supabase
    .from('events')
    .select('name')
    .eq('id', eventId)
    .single();
  return data?.name || undefined;
}

function mapInvoiceToEmailData(inv: InvoicePDFData, eventName?: string): InvoiceEmailData {
  const recipient = inv.invoice_recipients?.[0];
  const taxRate = inv.tax_rate || 10;

  return {
    invoiceNumber: inv.invoice_number,
    senderName: inv.sender_name,
    senderEmail: inv.sender_email,
    recipientName: recipient?.recipient_name || 'Valued Customer',
    recipientEmail: recipient?.recipient_email || '',
    issueDate: inv.issue_date,
    dueDate: inv.due_date,
    createdAt: inv.created_at,
    eventName,
    eventDate: inv.event_date,
    totalAmount: inv.total_amount,
    subtotal: inv.subtotal,
    taxAmount: inv.tax_amount,
    taxRate,
    currency: inv.currency,
    items: inv.invoice_items.map((item) => {
      const isDeduction = item.total < 0 || item.unit_price < 0;
      const itemSubtotal = item.quantity * item.unit_price;
      const itemTax = isDeduction ? 0 : itemSubtotal * (taxRate / 100);
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total,
        taxAmount: itemTax,
        isDeduction,
      };
    }),
    notes: inv.notes,
    senderBankName: inv.sender_bank_name,
    senderBankBsb: inv.sender_bank_bsb,
    senderBankAccount: inv.sender_bank_account,
    companyName: inv.sender_name,
    companyAddress: inv.sender_address,
    companyABN: inv.sender_abn,
  };
}

/**
 * Transform InvoicePDFData → InvoiceReminderData
 */
function mapInvoiceToReminderData(inv: InvoicePDFData, daysOverdue: number, isFirstReminder: boolean): InvoiceReminderData {
  const recipient = inv.invoice_recipients?.[0];

  return {
    invoiceNumber: inv.invoice_number,
    senderName: inv.sender_name,
    senderEmail: inv.sender_email,
    recipientName: recipient?.recipient_name || 'Valued Customer',
    recipientEmail: recipient?.recipient_email || '',
    issueDate: inv.issue_date,
    dueDate: inv.due_date,
    totalAmount: inv.total_amount,
    currency: inv.currency,
    items: inv.invoice_items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: item.total,
    })),
    notes: inv.notes,
    senderBankName: inv.sender_bank_name,
    senderBankBsb: inv.sender_bank_bsb,
    senderBankAccount: inv.sender_bank_account,
    companyName: inv.sender_name,
    companyABN: inv.sender_abn,
    daysOverdue,
    originalDueDate: inv.due_date,
    isFirstReminder,
    isUrgent: daysOverdue > 7,
  };
}

class InvoiceEmailService {
  /**
   * Send an invoice email with optional PDF attachment.
   * Renders the react-email template client-side and passes HTML to the edge function.
   */
  async sendInvoiceEmail(options: SendInvoiceEmailOptions): Promise<SendInvoiceEmailResult> {
    const {
      invoiceId,
      subject,
      attachPdf = true,
      cc = [],
      bcc = [],
      replyTo,
    } = options;

    try {
      // Fetch invoice data (reuse pdfService's fetcher)
      const invoiceData = await pdfService.fetchInvoiceData(invoiceId);

      // Fetch event name if linked
      const eventName = await fetchEventName(invoiceData.event_id);

      // Render react-email template client-side
      const emailData = mapInvoiceToEmailData(invoiceData, eventName);
      const rendered = await createInvoiceEmail(emailData);

      // Generate PDF if requested
      let pdfBase64: string | undefined;
      if (attachPdf) {
        try {
          const result = await pdfService.generateInvoicePDF(invoiceData);
          if (typeof result === 'string') {
            pdfBase64 = result;
          }
        } catch (pdfError) {
          console.error('Failed to generate PDF:', pdfError);
        }
      }

      // Call the edge function with pre-rendered HTML
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId,
          subject: subject || rendered.subject,
          html: rendered.html,
          text: rendered.text,
          attachPdf,
          pdfBase64,
          cc,
          bcc,
          replyTo,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        let errorDetails = error.message || 'Failed to send email';
        const funcError = error as any;
        if (funcError.context?.json) {
          try {
            const body = await funcError.context.json();
            errorDetails = body.error || errorDetails;
          } catch {
            // ignore parse error
          }
        }
        return { success: false, error: errorDetails };
      }

      if (data && !data.success) {
        return { success: false, error: data.error || 'Failed to send email' };
      }

      return {
        success: true,
        messageId: data?.messageId,
        recipients: data?.recipients,
        cc: data?.cc,
        bcc: data?.bcc,
      };
    } catch (error) {
      console.error('Invoice email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Send invoice email and update status to 'sent'.
   */
  async sendAndUpdateStatus(options: SendInvoiceEmailOptions): Promise<SendInvoiceEmailResult> {
    const result = await this.sendInvoiceEmail(options);

    if (result.success) {
      try {
        const { error } = await supabase
          .from('invoices')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', options.invoiceId)
          .eq('status', 'draft');

        if (error) {
          console.error('Failed to update invoice status:', error);
        }
      } catch (updateError) {
        console.error('Failed to update invoice status:', updateError);
      }
    }

    return result;
  }

  /**
   * Resend an invoice email (for already sent invoices).
   */
  async resendInvoice(
    invoiceId: string,
    options: Omit<SendInvoiceEmailOptions, 'invoiceId'> = {}
  ): Promise<SendInvoiceEmailResult> {
    return this.sendInvoiceEmail({ invoiceId, ...options });
  }

  /**
   * Send invoice reminder email using the react-email InvoiceReminder template.
   */
  async sendReminder(
    invoiceId: string,
    customMessage?: string
  ): Promise<SendInvoiceEmailResult> {
    try {
      const invoiceData = await pdfService.fetchInvoiceData(invoiceId);

      const dueDate = new Date(invoiceData.due_date);
      const now = new Date();
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      // Render reminder template
      const reminderData = mapInvoiceToReminderData(invoiceData, daysOverdue, daysOverdue <= 3);
      const rendered = await createInvoiceReminderEmail(reminderData);

      // Generate PDF
      let pdfBase64: string | undefined;
      try {
        const result = await pdfService.generateInvoicePDF(invoiceData);
        if (typeof result === 'string') {
          pdfBase64 = result;
        }
      } catch (pdfError) {
        console.error('Failed to generate PDF for reminder:', pdfError);
      }

      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          attachPdf: true,
          pdfBase64,
        },
      });

      if (error) {
        return { success: false, error: error.message || 'Failed to send reminder' };
      }

      if (data && !data.success) {
        return { success: false, error: data.error || 'Failed to send reminder' };
      }

      return {
        success: true,
        messageId: data?.messageId,
        recipients: data?.recipients,
      };
    } catch (error) {
      console.error('Reminder email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Preview email content without sending.
   * Returns the react-email rendered HTML.
   */
  async previewEmail(invoiceId: string): Promise<string | null> {
    try {
      const invoiceData = await pdfService.fetchInvoiceData(invoiceId);
      const eventName = await fetchEventName(invoiceData.event_id);
      const emailData = mapInvoiceToEmailData(invoiceData, eventName);
      return await renderInvoiceHtml(emailData);
    } catch (error) {
      console.error('Preview email error:', error);
      return null;
    }
  }
}

export const invoiceEmailService = new InvoiceEmailService();
