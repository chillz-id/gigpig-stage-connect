import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SESClient, SendRawEmailCommand } from 'npm:@aws-sdk/client-ses@3.525.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  invoiceId: string;
  subject?: string;
  message?: string;
  attachPdf?: boolean;
  pdfBase64?: string; // Pre-generated PDF from client
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

// SES client will be initialized per request after credential check

/**
 * Build a multipart MIME message with optional PDF attachment
 */
function buildRawEmail({
  from,
  to,
  cc,
  bcc,
  replyTo,
  subject,
  htmlBody,
  textBody,
  pdfBase64,
  pdfFilename,
}: {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  pdfBase64?: string;
  pdfFilename?: string;
}): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const mixedBoundary = `----=_Mixed_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  let rawEmail = '';

  // Headers
  rawEmail += `From: ${from}\r\n`;
  rawEmail += `To: ${to.join(', ')}\r\n`;
  if (cc && cc.length > 0) {
    rawEmail += `Cc: ${cc.join(', ')}\r\n`;
  }
  if (replyTo) {
    rawEmail += `Reply-To: ${replyTo}\r\n`;
  }
  rawEmail += `Subject: ${subject}\r\n`;
  rawEmail += 'MIME-Version: 1.0\r\n';

  if (pdfBase64) {
    // Multipart mixed for attachments
    rawEmail += `Content-Type: multipart/mixed; boundary="${mixedBoundary}"\r\n\r\n`;

    // Body part
    rawEmail += `--${mixedBoundary}\r\n`;
    rawEmail += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;

    // Plain text part
    rawEmail += `--${boundary}\r\n`;
    rawEmail += 'Content-Type: text/plain; charset=UTF-8\r\n';
    rawEmail += 'Content-Transfer-Encoding: quoted-printable\r\n\r\n';
    rawEmail += textBody + '\r\n\r\n';

    // HTML part
    rawEmail += `--${boundary}\r\n`;
    rawEmail += 'Content-Type: text/html; charset=UTF-8\r\n';
    rawEmail += 'Content-Transfer-Encoding: quoted-printable\r\n\r\n';
    rawEmail += htmlBody + '\r\n\r\n';

    rawEmail += `--${boundary}--\r\n\r\n`;

    // PDF attachment
    rawEmail += `--${mixedBoundary}\r\n`;
    rawEmail += `Content-Type: application/pdf; name="${pdfFilename || 'invoice.pdf'}"\r\n`;
    rawEmail += 'Content-Transfer-Encoding: base64\r\n';
    rawEmail += `Content-Disposition: attachment; filename="${pdfFilename || 'invoice.pdf'}"\r\n\r\n`;
    rawEmail += pdfBase64 + '\r\n\r\n';

    rawEmail += `--${mixedBoundary}--\r\n`;
  } else {
    // No attachment - multipart alternative only
    rawEmail += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;

    // Plain text part
    rawEmail += `--${boundary}\r\n`;
    rawEmail += 'Content-Type: text/plain; charset=UTF-8\r\n';
    rawEmail += 'Content-Transfer-Encoding: quoted-printable\r\n\r\n';
    rawEmail += textBody + '\r\n\r\n';

    // HTML part
    rawEmail += `--${boundary}\r\n`;
    rawEmail += 'Content-Type: text/html; charset=UTF-8\r\n';
    rawEmail += 'Content-Transfer-Encoding: quoted-printable\r\n\r\n';
    rawEmail += htmlBody + '\r\n\r\n';

    rawEmail += `--${boundary}--\r\n`;
  }

  return rawEmail;
}

/**
 * Generate email HTML content
 */
function generateEmailHtml(invoice: any, customMessage?: string): string {
  const recipient = invoice.invoice_recipients?.[0];
  const recipientName = recipient?.recipient_name || 'Valued Customer';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .invoice-details { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .detail-label { font-weight: 600; color: #4a5568; }
          .detail-value { color: #1a202c; }
          .total-row { font-size: 18px; font-weight: bold; color: #667eea; border-top: 2px solid #e2e8f0; padding-top: 12px; margin-top: 12px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; background: #f9fafb; }
          .message { background: #eef2ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${invoice.sender_name || 'Invoice'}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Invoice #${invoice.invoice_number}</p>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>

            ${customMessage ? `<div class="message">${customMessage}</div>` : ''}

            <p>Please find attached your invoice. Here's a summary:</p>

            <div class="invoice-details">
              <div class="detail-row">
                <span class="detail-label">Invoice Number:</span>
                <span class="detail-value">${invoice.invoice_number}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Issue Date:</span>
                <span class="detail-value">${new Date(invoice.issue_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Due Date:</span>
                <span class="detail-value">${new Date(invoice.due_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              ${invoice.subtotal ? `
              <div class="detail-row">
                <span class="detail-label">Subtotal:</span>
                <span class="detail-value">${invoice.currency} $${invoice.subtotal.toFixed(2)}</span>
              </div>
              ` : ''}
              ${invoice.tax_amount ? `
              <div class="detail-row">
                <span class="detail-label">GST (${invoice.tax_rate || 10}%):</span>
                <span class="detail-value">${invoice.currency} $${invoice.tax_amount.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="detail-row total-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value">${invoice.currency} $${invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <p>If you have any questions about this invoice, please don't hesitate to reach out.</p>

            <p>Thank you for your business!</p>

            <p>
              Best regards,<br>
              <strong>${invoice.sender_name}</strong>
              ${invoice.sender_email ? `<br><a href="mailto:${invoice.sender_email}">${invoice.sender_email}</a>` : ''}
            </p>
          </div>
          <div class="footer">
            <p>This invoice was sent via <a href="https://gigpigs.app">GigPigs</a></p>
            <p>&copy; ${new Date().getFullYear()} GigPigs. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate plain text version of email
 */
function generateEmailText(invoice: any, customMessage?: string): string {
  const recipient = invoice.invoice_recipients?.[0];
  const recipientName = recipient?.recipient_name || 'Valued Customer';

  let text = `Hi ${recipientName},\n\n`;

  if (customMessage) {
    text += `${customMessage}\n\n`;
  }

  text += `Please find attached your invoice. Here's a summary:\n\n`;
  text += `Invoice Number: ${invoice.invoice_number}\n`;
  text += `Issue Date: ${new Date(invoice.issue_date).toLocaleDateString('en-AU')}\n`;
  text += `Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-AU')}\n`;
  text += `Total Amount: ${invoice.currency} $${invoice.total_amount.toFixed(2)}\n\n`;
  text += `If you have any questions about this invoice, please don't hesitate to reach out.\n\n`;
  text += `Thank you for your business!\n\n`;
  text += `Best regards,\n${invoice.sender_name}\n`;
  if (invoice.sender_email) {
    text += `${invoice.sender_email}\n`;
  }

  return text;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for required AWS credentials
    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    if (!awsAccessKeyId || !awsSecretAccessKey) {
      console.error('Missing AWS credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service not configured. AWS credentials are missing.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize SES client with validated credentials
    const sesClient = new SESClient({
      region: Deno.env.get('AWS_REGION') || 'ap-southeast-2',
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });

    // Check for required Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Supabase configuration missing. SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const {
      invoiceId,
      subject,
      message,
      attachPdf = true,
      pdfBase64,
      cc = [],
      bcc = [],
      replyTo
    } = await req.json() as EmailRequest;

    console.log('Request body:', { invoiceId, attachPdf, hasMessage: !!message, hasPdf: !!pdfBase64 });

    if (!invoiceId) {
      console.error('Missing invoiceId in request');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing invoiceId in request body',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Initializing Supabase client...', { url: supabaseUrl?.substring(0, 30) });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching invoice:', invoiceId);
    // Get invoice details with items and recipients
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*),
        invoice_recipients (
          recipient_name,
          recipient_email
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError);
      throw new Error(`Invoice not found: ${invoiceError?.message || 'No data returned'}`);
    }
    console.log('Invoice found:', invoice.invoice_number);

    // Get email recipients
    const recipients = invoice.invoice_recipients
      .map((r: any) => r.recipient_email)
      .filter(Boolean);

    if (recipients.length === 0) {
      throw new Error('No recipients found for invoice');
    }

    // Use CC/BCC from request (database columns for cc_emails/bcc_emails don't exist)
    const allCc = [...cc].filter(Boolean);
    const allBcc = [...bcc].filter(Boolean);

    // Build email content
    const emailSubject = subject || `Invoice ${invoice.invoice_number} from ${invoice.sender_name}`;
    const htmlBody = generateEmailHtml(invoice, message);
    const textBody = generateEmailText(invoice, message);

    // From address
    const fromAddress = Deno.env.get('SES_FROM_EMAIL') || 'invoices@gigpigs.app';
    const replyToAddress = replyTo || invoice.sender_email || Deno.env.get('SES_REPLY_TO_EMAIL') || 'team@gigpigs.app';

    // Build raw email with optional PDF attachment
    const rawEmail = buildRawEmail({
      from: `"${invoice.sender_name}" <${fromAddress}>`,
      to: recipients,
      cc: allCc.length > 0 ? allCc : undefined,
      replyTo: replyToAddress,
      subject: emailSubject,
      htmlBody,
      textBody,
      pdfBase64: attachPdf ? pdfBase64 : undefined,
      pdfFilename: `invoice-${invoice.invoice_number}.pdf`,
    });

    console.log('Sending email via SES...', { to: recipients, cc: allCc.length, hasAttachment: !!pdfBase64 });
    // Send email via SES
    const command = new SendRawEmailCommand({
      RawMessage: {
        Data: new TextEncoder().encode(rawEmail),
      },
      Destinations: [...recipients, ...allCc, ...allBcc],
    });

    const response = await sesClient.send(command);

    console.log('Invoice email sent successfully:', {
      messageId: response.MessageId,
      invoiceNumber: invoice.invoice_number,
      recipients,
      cc: allCc,
      bcc: allBcc,
      hasAttachment: attachPdf && !!pdfBase64,
    });

    // Update invoice status if it was a draft
    if (invoice.status === 'draft') {
      await supabase
        .from('invoices')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', invoiceId);
    }

    // Log email activity (one row per recipient)
    const emailLogs = recipients.map((email: string) => ({
      invoice_id: invoiceId,
      recipient_email: email,
      email_subject: emailSubject,
      sent_at: new Date().toISOString(),
      status: 'sent',
      email_service_id: response.MessageId,
    }));

    await supabase
      .from('invoice_email_logs')
      .insert(emailLogs);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: response.MessageId,
        message: `Invoice email sent to ${recipients.length} recipient(s)`,
        recipients,
        cc: allCc,
        bcc: allBcc,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending invoice email:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: errorStack
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
