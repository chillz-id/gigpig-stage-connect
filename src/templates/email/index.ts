// Email templates for spot notifications
export * from './spotAssignmentTemplate';
export * from './spotDeadlineTemplate';
export * from './spotConfirmationTemplate';
export * from './spotDeclinedTemplate';

// Email templates for invoice notifications
export * from './invoiceEmailTemplate';

// Email template utility functions
export interface EmailTemplateData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function createSpotAssignmentEmail(data: any): EmailTemplateData {
  const { generateSpotAssignmentEmailHtml, generateSpotAssignmentEmailText } = require('./spotAssignmentTemplate');
  
  return {
    to: data.comedianEmail,
    subject: `Spot Assignment: ${data.eventTitle}`,
    html: generateSpotAssignmentEmailHtml(data),
    text: generateSpotAssignmentEmailText(data)
  };
}

export function createSpotDeadlineEmail(data: any): EmailTemplateData {
  const { generateSpotDeadlineEmailHtml, generateSpotDeadlineEmailText } = require('./spotDeadlineTemplate');
  
  const urgency = data.hoursRemaining <= 2 ? 'URGENT' : 'REMINDER';
  
  return {
    to: data.comedianEmail,
    subject: `${urgency}: Spot Confirmation Required - ${data.eventTitle}`,
    html: generateSpotDeadlineEmailHtml(data),
    text: generateSpotDeadlineEmailText(data)
  };
}

export function createSpotConfirmationEmail(data: any): EmailTemplateData {
  const { generateSpotConfirmationEmailHtml, generateSpotConfirmationEmailText } = require('./spotConfirmationTemplate');
  
  const isPromoter = data.isPromoterEmail;
  const subject = isPromoter 
    ? `Spot Confirmed: ${data.comedianName} - ${data.eventTitle}`
    : `Spot Confirmation Received - ${data.eventTitle}`;
  
  return {
    to: isPromoter ? data.promoterEmail : data.comedianEmail,
    subject,
    html: generateSpotConfirmationEmailHtml(data),
    text: generateSpotConfirmationEmailText(data)
  };
}

export function createSpotDeclinedEmail(data: any): EmailTemplateData {
  const { generateSpotDeclinedEmailHtml, generateSpotDeclinedEmailText } = require('./spotDeclinedTemplate');
  
  const isPromoter = data.isPromoterEmail;
  const subject = isPromoter 
    ? `Spot Declined: ${data.comedianName} - ${data.eventTitle}`
    : `Spot Declined - ${data.eventTitle}`;
  
  return {
    to: isPromoter ? data.promoterEmail : data.comedianEmail,
    subject,
    html: generateSpotDeclinedEmailHtml(data),
    text: generateSpotDeclinedEmailText(data)
  };
}

// Email sending priority levels
export enum EmailPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Email template metadata
export interface EmailTemplateMetadata {
  type: 'spot_assigned' | 'spot_deadline' | 'spot_confirmed' | 'spot_declined' | 'invoice' | 'invoice_reminder' | 'payment_receipt';
  priority: EmailPriority;
  category: 'notification' | 'reminder' | 'confirmation' | 'status_update' | 'billing';
  requiresAction: boolean;
  expiresAt?: string;
}

export function getEmailTemplateMetadata(type: string, data: any): EmailTemplateMetadata {
  switch (type) {
    case 'spot_assigned':
      return {
        type: 'spot_assigned',
        priority: EmailPriority.HIGH,
        category: 'notification',
        requiresAction: true,
        expiresAt: data.confirmationDeadline
      };
    
    case 'spot_deadline':
      return {
        type: 'spot_deadline',
        priority: data.hoursRemaining <= 2 ? EmailPriority.URGENT : EmailPriority.HIGH,
        category: 'reminder',
        requiresAction: true
      };
    
    case 'spot_confirmed':
      return {
        type: 'spot_confirmed',
        priority: EmailPriority.MEDIUM,
        category: 'confirmation',
        requiresAction: false
      };
    
    case 'spot_declined':
      return {
        type: 'spot_declined',
        priority: data.isPromoterEmail ? EmailPriority.HIGH : EmailPriority.LOW,
        category: 'status_update',
        requiresAction: data.isPromoterEmail
      };
    
    case 'invoice':
      return {
        type: 'invoice',
        priority: EmailPriority.HIGH,
        category: 'billing',
        requiresAction: true,
        expiresAt: data.dueDate
      };
    
    case 'invoice_reminder':
      return {
        type: 'invoice_reminder',
        priority: data.isUrgent ? EmailPriority.URGENT : EmailPriority.HIGH,
        category: 'billing',
        requiresAction: true
      };
    
    case 'payment_receipt':
      return {
        type: 'payment_receipt',
        priority: EmailPriority.MEDIUM,
        category: 'billing',
        requiresAction: false
      };
    
    default:
      return {
        type: type as any,
        priority: EmailPriority.MEDIUM,
        category: 'notification',
        requiresAction: false
      };
  }
}