// Invoice Email Template - Professional invoice email templates with attachment support
export interface InvoiceEmailData {
  invoiceNumber: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  currency: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
  paymentInstructions?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyABN?: string;
  attachPDF?: boolean;
}

export interface InvoiceReminderData extends InvoiceEmailData {
  daysOverdue: number;
  originalDueDate: string;
  isFirstReminder: boolean;
  isUrgent: boolean;
}

export interface InvoicePaymentReceiptData {
  invoiceNumber: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: string;
  senderName: string;
  recipientName: string;
  recipientEmail: string;
  remainingBalance: number;
  currency: string;
}

export function createInvoiceEmail(data: InvoiceEmailData): EmailTemplateData {
  const formattedIssueDate = new Date(data.issueDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedDueDate = new Date(data.dueDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; color: #333;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #333;">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #333; font-weight: 600;">$${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  const itemsText = data.items.map(item => 
    `${item.description} - Qty: ${item.quantity} - Rate: $${item.unitPrice.toFixed(2)} - Total: $${item.total.toFixed(2)}`
  ).join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Invoice ${data.invoiceNumber}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300;">Invoice ${data.invoiceNumber}</h1>
          <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">${data.companyName || 'Stand Up Sydney'}</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          
          <!-- Greeting -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #667eea; margin: 0 0 16px; font-size: 22px; font-weight: 600;">Hello ${data.recipientName},</h2>
            <p style="color: #666; margin: 0; font-size: 16px;">
              Thank you for your business! Please find your invoice details below.
            </p>
          </div>

          <!-- Invoice Details -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #666; font-weight: 500;">Invoice Number:</span>
              <span style="color: #333; font-weight: 600;">${data.invoiceNumber}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #666; font-weight: 500;">Issue Date:</span>
              <span style="color: #333;">${formattedIssueDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #666; font-weight: 500;">Due Date:</span>
              <span style="color: #333; font-weight: 600;">${formattedDueDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666; font-weight: 500;">Total Amount:</span>
              <span style="color: #667eea; font-weight: 700; font-size: 18px;">${data.currency} $${data.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <!-- Items Table -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Invoice Items</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background-color: #667eea; color: white;">
                  <th style="padding: 16px; text-align: left; font-weight: 600;">Description</th>
                  <th style="padding: 16px; text-align: center; font-weight: 600;">Qty</th>
                  <th style="padding: 16px; text-align: right; font-weight: 600;">Rate</th>
                  <th style="padding: 16px; text-align: right; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
          </div>

          <!-- Notes -->
          ${data.notes ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Notes</h3>
            <p style="color: #666; margin: 0; font-size: 16px; line-height: 1.6; background-color: #f8f9fa; padding: 16px; border-radius: 8px;">
              ${data.notes}
            </p>
          </div>
          ` : ''}

          <!-- Payment Instructions -->
          <div style="margin-bottom: 30px; padding: 20px; background-color: #e8f4f8; border-left: 4px solid #667eea; border-radius: 8px;">
            <h3 style="color: #333; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Payment Instructions</h3>
            <p style="color: #666; margin: 0 0 12px; font-size: 16px;">
              ${data.paymentInstructions || `Please make payment by <strong>${formattedDueDate}</strong> to avoid any late fees.`}
            </p>
            <p style="color: #666; margin: 0; font-size: 16px;">
              For questions about this invoice, please contact us at <a href="mailto:${data.senderEmail}" style="color: #667eea; text-decoration: none;">${data.senderEmail}</a>
            </p>
          </div>

          <!-- Attachment Notice -->
          ${data.attachPDF ? `
          <div style="margin-bottom: 30px; padding: 16px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              📎 <strong>Attachment:</strong> A PDF copy of this invoice has been included for your records.
            </p>
          </div>
          ` : ''}

          <!-- Company Information -->
          ${data.companyAddress || data.companyPhone || data.companyABN ? `
          <div style="margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <h3 style="color: #333; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Company Information</h3>
            ${data.companyAddress ? `<p style="color: #666; margin: 0 0 8px; font-size: 14px;"><strong>Address:</strong> ${data.companyAddress}</p>` : ''}
            ${data.companyPhone ? `<p style="color: #666; margin: 0 0 8px; font-size: 14px;"><strong>Phone:</strong> ${data.companyPhone}</p>` : ''}
            ${data.companyABN ? `<p style="color: #666; margin: 0; font-size: 14px;"><strong>ABN:</strong> ${data.companyABN}</p>` : ''}
          </div>
          ` : ''}

          <!-- Footer -->
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
            <p style="color: #999; margin: 0 0 8px; font-size: 14px;">
              This invoice was generated automatically by Stand Up Sydney
            </p>
            <p style="color: #999; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} Stand Up Sydney. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Invoice ${data.invoiceNumber} from ${data.senderName}

Hello ${data.recipientName},

Thank you for your business! Please find your invoice details below.

INVOICE DETAILS:
- Invoice Number: ${data.invoiceNumber}
- Issue Date: ${formattedIssueDate}
- Due Date: ${formattedDueDate}
- Total Amount: ${data.currency} $${data.totalAmount.toFixed(2)}

ITEMS:
${itemsText}

${data.notes ? `NOTES:\n${data.notes}\n` : ''}

PAYMENT INSTRUCTIONS:
${data.paymentInstructions || `Please make payment by ${formattedDueDate} to avoid any late fees.`}

For questions about this invoice, please contact us at ${data.senderEmail}

${data.attachPDF ? 'A PDF copy of this invoice has been attached for your records.' : ''}

This invoice was generated automatically by Stand Up Sydney.
© ${new Date().getFullYear()} Stand Up Sydney. All rights reserved.
  `.trim();

  return {
    to: data.recipientEmail,
    subject: `Invoice ${data.invoiceNumber} from ${data.senderName}`,
    html,
    text
  };
}

export function createInvoiceReminderEmail(data: InvoiceReminderData): EmailTemplateData {
  const urgencyLevel = data.isUrgent ? 'URGENT' : data.isFirstReminder ? 'REMINDER' : 'FINAL NOTICE';
  const urgencyColor = data.isUrgent ? '#dc3545' : data.isFirstReminder ? '#ffc107' : '#fd7e14';
  
  const formattedDueDate = new Date(data.originalDueDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedIssueDate = new Date(data.issueDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${urgencyLevel}: Invoice ${data.invoiceNumber} Payment Due</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}CC 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">${urgencyLevel}</h1>
          <p style="margin: 8px 0 0; font-size: 18px; opacity: 0.9;">Invoice ${data.invoiceNumber} Payment Due</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          
          <!-- Greeting -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: ${urgencyColor}; margin: 0 0 16px; font-size: 22px; font-weight: 600;">Hello ${data.recipientName},</h2>
            <p style="color: #666; margin: 0; font-size: 16px;">
              This is a ${data.isFirstReminder ? 'friendly reminder' : data.isUrgent ? 'urgent notice' : 'final notice'} that your invoice payment is ${data.daysOverdue > 0 ? `${data.daysOverdue} days overdue` : 'due today'}.
            </p>
          </div>

          <!-- Overdue Alert -->
          <div style="background-color: ${urgencyColor}15; border: 2px solid ${urgencyColor}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: ${urgencyColor}; margin: 0 0 12px; font-size: 18px; font-weight: 600;">
              ${data.daysOverdue > 0 ? `Payment ${data.daysOverdue} Days Overdue` : 'Payment Due Today'}
            </h3>
            <p style="color: #666; margin: 0; font-size: 16px;">
              Original due date: <strong>${formattedDueDate}</strong><br>
              Amount due: <strong>${data.currency} $${data.totalAmount.toFixed(2)}</strong>
            </p>
          </div>

          <!-- Invoice Summary -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Invoice Summary</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #666; font-weight: 500;">Invoice Number:</span>
              <span style="color: #333; font-weight: 600;">${data.invoiceNumber}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #666; font-weight: 500;">Issue Date:</span>
              <span style="color: #333;">${formattedIssueDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #666; font-weight: 500;">Original Due Date:</span>
              <span style="color: #333;">${formattedDueDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666; font-weight: 500;">Amount Due:</span>
              <span style="color: ${urgencyColor}; font-weight: 700; font-size: 18px;">${data.currency} $${data.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <!-- Action Required -->
          <div style="margin-bottom: 30px; padding: 20px; background-color: #e8f4f8; border-left: 4px solid ${urgencyColor}; border-radius: 8px;">
            <h3 style="color: #333; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Action Required</h3>
            <p style="color: #666; margin: 0 0 12px; font-size: 16px;">
              Please make payment immediately to avoid further action. ${data.isUrgent ? 'This is your final notice before we may take collection action.' : ''}
            </p>
            <p style="color: #666; margin: 0; font-size: 16px;">
              For questions about this invoice, please contact us at <a href="mailto:${data.senderEmail}" style="color: ${urgencyColor}; text-decoration: none;">${data.senderEmail}</a>
            </p>
          </div>

          <!-- Contact Information -->
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0 0 8px; font-size: 16px;">
              Need help? Contact us at <a href="mailto:${data.senderEmail}" style="color: ${urgencyColor}; text-decoration: none;">${data.senderEmail}</a>
            </p>
            <p style="color: #999; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} Stand Up Sydney. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${urgencyLevel}: Invoice ${data.invoiceNumber} Payment Due

Hello ${data.recipientName},

This is a ${data.isFirstReminder ? 'friendly reminder' : data.isUrgent ? 'urgent notice' : 'final notice'} that your invoice payment is ${data.daysOverdue > 0 ? `${data.daysOverdue} days overdue` : 'due today'}.

INVOICE DETAILS:
- Invoice Number: ${data.invoiceNumber}
- Issue Date: ${formattedIssueDate}
- Original Due Date: ${formattedDueDate}
- Amount Due: ${data.currency} $${data.totalAmount.toFixed(2)}

Please make payment immediately to avoid further action. ${data.isUrgent ? 'This is your final notice before we may take collection action.' : ''}

For questions about this invoice, please contact us at ${data.senderEmail}

© ${new Date().getFullYear()} Stand Up Sydney. All rights reserved.
  `.trim();

  return {
    to: data.recipientEmail,
    subject: `${urgencyLevel}: Invoice ${data.invoiceNumber} Payment Due`,
    html,
    text
  };
}

export function createPaymentReceiptEmail(data: InvoicePaymentReceiptData): EmailTemplateData {
  const formattedPaymentDate = new Date(data.paymentDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Payment Receipt - Invoice ${data.invoiceNumber}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300;">Payment Received</h1>
          <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">Thank you for your payment!</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          
          <!-- Greeting -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #28a745; margin: 0 0 16px; font-size: 22px; font-weight: 600;">Hello ${data.recipientName},</h2>
            <p style="color: #666; margin: 0; font-size: 16px;">
              We have successfully received your payment. Here are the details:
            </p>
          </div>

          <!-- Payment Details -->
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #155724; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Payment Confirmation</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #155724; font-weight: 500;">Invoice Number:</span>
              <span style="color: #155724; font-weight: 600;">${data.invoiceNumber}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #155724; font-weight: 500;">Payment Date:</span>
              <span style="color: #155724;">${formattedPaymentDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #155724; font-weight: 500;">Payment Method:</span>
              <span style="color: #155724;">${data.paymentMethod}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #155724; font-weight: 500;">Amount Paid:</span>
              <span style="color: #28a745; font-weight: 700; font-size: 18px;">${data.currency} $${data.paymentAmount.toFixed(2)}</span>
            </div>
          </div>

          ${data.remainingBalance > 0 ? `
          <!-- Remaining Balance -->
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #856404; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Remaining Balance</h3>
            <p style="color: #856404; margin: 0; font-size: 16px;">
              Remaining amount due: <strong>${data.currency} $${data.remainingBalance.toFixed(2)}</strong>
            </p>
          </div>
          ` : `
          <!-- Full Payment -->
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #155724; margin: 0 0 16px; font-size: 18px; font-weight: 600;">Invoice Fully Paid</h3>
            <p style="color: #155724; margin: 0; font-size: 16px;">
              ✅ This invoice has been paid in full. Thank you for your business!
            </p>
          </div>
          `}

          <!-- Footer -->
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0 0 8px; font-size: 16px;">
              Thank you for your business! If you have any questions, please contact us.
            </p>
            <p style="color: #999; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} Stand Up Sydney. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Payment Receipt - Invoice ${data.invoiceNumber}

Hello ${data.recipientName},

We have successfully received your payment. Here are the details:

PAYMENT CONFIRMATION:
- Invoice Number: ${data.invoiceNumber}
- Payment Date: ${formattedPaymentDate}
- Payment Method: ${data.paymentMethod}
- Amount Paid: ${data.currency} $${data.paymentAmount.toFixed(2)}

${data.remainingBalance > 0 ? 
  `REMAINING BALANCE: ${data.currency} $${data.remainingBalance.toFixed(2)}` : 
  'This invoice has been paid in full. Thank you for your business!'
}

Thank you for your business! If you have any questions, please contact us.

© ${new Date().getFullYear()} Stand Up Sydney. All rights reserved.
  `.trim();

  return {
    to: data.recipientEmail,
    subject: `Payment Receipt - Invoice ${data.invoiceNumber}`,
    html,
    text
  };
}

export interface EmailTemplateData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export const invoiceEmailMetadata = {
  templates: {
    invoice: {
      name: 'Invoice Email',
      description: 'Professional invoice email with itemized billing',
      priority: 'high',
      category: 'billing'
    },
    reminder: {
      name: 'Invoice Reminder',
      description: 'Payment reminder for overdue invoices',
      priority: 'high',
      category: 'billing'
    },
    receipt: {
      name: 'Payment Receipt',
      description: 'Payment confirmation email',
      priority: 'medium',
      category: 'billing'
    }
  }
};