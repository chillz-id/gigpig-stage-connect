import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  invoiceId: string;
  subject?: string;
  message?: string;
  attachPdf?: boolean;
  cc?: string[];
  bcc?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, subject, message, attachPdf = true, cc = [], bcc = [] } = await req.json() as EmailRequest;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
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

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Get email recipients
    const recipients = invoice.invoice_recipients.map((r: any) => r.recipient_email);
    
    if (recipients.length === 0) {
      throw new Error('No recipients found for invoice');
    }

    // Generate email content
    const emailSubject = subject || `Invoice ${invoice.invoice_number} from ${invoice.sender_name}`;
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Invoice ${invoice.invoice_number}</h2>
          ${message ? `<p>${message}</p>` : ''}
          <p>Please find your invoice details below:</p>
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Invoice Number:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${invoice.invoice_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Issue Date:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${new Date(invoice.issue_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Due Date:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${new Date(invoice.due_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Amount:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${invoice.currency} ${invoice.total_amount.toFixed(2)}</td>
            </tr>
          </table>
          <p>Thank you for your business!</p>
        </body>
      </html>
    `;

    // TODO: Integrate with actual email service (SendGrid, Resend, etc.)
    // For now, we'll simulate sending the email
    console.log('Sending email to:', recipients);
    console.log('CC:', cc);
    console.log('BCC:', bcc);
    console.log('Subject:', emailSubject);
    console.log('Attach PDF:', attachPdf);

    // Update invoice status if it was a draft
    if (invoice.status === 'draft') {
      await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId);
    }

    // Log email activity
    await supabase
      .from('invoice_email_logs')
      .insert({
        invoice_id: invoiceId,
        recipients: recipients,
        cc: cc,
        bcc: bcc,
        subject: emailSubject,
        sent_at: new Date().toISOString(),
        status: 'sent'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email sent to ${recipients.length} recipient(s)` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending invoice email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});