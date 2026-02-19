/**
 * Invoice Email Service
 * Handles sending invoice emails with PDF attachments via Supabase Edge Function
 */

import { supabase } from '@/integrations/supabase/client';
import { pdfService, InvoicePDFData } from './pdfService';

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

class InvoiceEmailService {
  /**
   * Send an invoice email with optional PDF attachment
   */
  async sendInvoiceEmail(options: SendInvoiceEmailOptions): Promise<SendInvoiceEmailResult> {
    const {
      invoiceId,
      subject,
      message,
      attachPdf = true,
      cc = [],
      bcc = [],
      replyTo,
    } = options;

    try {
      let pdfBase64: string | undefined;

      // Generate PDF if requested
      if (attachPdf) {
        try {
          const invoiceData = await pdfService.fetchInvoiceData(invoiceId);
          pdfBase64 = await pdfService.generateInvoicePDF(invoiceData);
        } catch (pdfError) {
          console.error('Failed to generate PDF:', pdfError);
          // Continue without attachment if PDF generation fails
        }
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId,
          subject,
          message,
          attachPdf,
          pdfBase64,
          cc,
          bcc,
          replyTo,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        console.error('Error properties:', Object.keys(error));
        console.error('Error JSON:', JSON.stringify(error, null, 2));

        // Try to extract the response body for more details
        let errorDetails = error.message || 'Failed to send email';

        // Check for FunctionsHttpError context
        const funcError = error as any;
        if (funcError.context) {
          console.error('Error context:', funcError.context);
          try {
            // The context might be a Response object
            if (funcError.context.json) {
              const body = await funcError.context.json();
              console.error('Error response body:', body);
              errorDetails = body.error || errorDetails;
            }
          } catch (parseErr) {
            console.error('Could not parse error context:', parseErr);
          }
        }

        return {
          success: false,
          error: errorDetails,
        };
      }

      if (data && !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to send email',
        };
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
   * Send invoice email and update status
   * Use this when sending an invoice for the first time
   */
  async sendAndUpdateStatus(options: SendInvoiceEmailOptions): Promise<SendInvoiceEmailResult> {
    const result = await this.sendInvoiceEmail(options);

    if (result.success) {
      // Update invoice status to 'sent' and record sent_at timestamp
      try {
        const { error } = await supabase
          .from('invoices')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', options.invoiceId)
          .eq('status', 'draft'); // Only update if currently draft

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
   * Resend an invoice email (for already sent invoices)
   */
  async resendInvoice(
    invoiceId: string,
    options: Omit<SendInvoiceEmailOptions, 'invoiceId'> = {}
  ): Promise<SendInvoiceEmailResult> {
    return this.sendInvoiceEmail({
      invoiceId,
      ...options,
    });
  }

  /**
   * Send invoice reminder email
   */
  async sendReminder(
    invoiceId: string,
    customMessage?: string
  ): Promise<SendInvoiceEmailResult> {
    // Fetch invoice to get the number for the subject
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('invoice_number, due_date, total_amount, currency')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      };
    }

    const dueDate = new Date(invoice.due_date);
    const isOverdue = dueDate < new Date();

    const defaultMessage = isOverdue
      ? `This is a friendly reminder that Invoice #${invoice.invoice_number} for ${invoice.currency} $${invoice.total_amount.toFixed(2)} was due on ${dueDate.toLocaleDateString('en-AU')} and is now overdue. Please arrange payment at your earliest convenience.`
      : `This is a friendly reminder that Invoice #${invoice.invoice_number} for ${invoice.currency} $${invoice.total_amount.toFixed(2)} is due on ${dueDate.toLocaleDateString('en-AU')}. Please ensure payment is made by the due date.`;

    return this.sendInvoiceEmail({
      invoiceId,
      subject: isOverdue
        ? `OVERDUE: Invoice ${invoice.invoice_number} Reminder`
        : `Payment Reminder: Invoice ${invoice.invoice_number}`,
      message: customMessage || defaultMessage,
      attachPdf: true,
    });
  }

  /**
   * Preview email content without sending
   * Returns the HTML that would be sent
   */
  async previewEmail(invoiceId: string, customMessage?: string): Promise<string | null> {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_recipients (
            recipient_name,
            recipient_email
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error || !invoice) {
        return null;
      }

      // Generate preview HTML (simplified version)
      const recipient = invoice.invoice_recipients?.[0];
      const recipientName = recipient?.recipient_name || 'Valued Customer';

      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1>${invoice.sender_name || 'Invoice'}</h1>
            <p>Invoice #${invoice.invoice_number}</p>
          </div>
          <div style="padding: 30px; border: 1px solid #e0e0e0;">
            <p>Hi ${recipientName},</p>
            ${customMessage ? `<div style="background: #eef2ff; padding: 15px; margin: 20px 0;">${customMessage}</div>` : ''}
            <p>Please find attached your invoice.</p>
            <div style="background: #f9fafb; padding: 20px; margin: 20px 0;">
              <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
              <p><strong>Issue Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString('en-AU')}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-AU')}</p>
              <p style="font-size: 18px; color: #667eea;"><strong>Total:</strong> ${invoice.currency} $${invoice.total_amount.toFixed(2)}</p>
            </div>
            <p>Thank you for your business!</p>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Preview email error:', error);
      return null;
    }
  }
}

export const invoiceEmailService = new InvoiceEmailService();
