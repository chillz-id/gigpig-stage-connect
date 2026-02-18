import * as React from 'react';
import { Text, Link, Section, render } from '@react-email/components';
import {
  EmailLayout,
  BrandHeader,
  BrandFooter,
  DetailRow,
  ContentCard,
  AlertBox,
} from '../components';
import { colors } from '../tokens';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(amount: number, currency: string): string {
  return `${currency} $${amount.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Data interface
// ---------------------------------------------------------------------------

export interface InvoiceReminderData {
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
  daysOverdue: number;
  originalDueDate: string;
  isFirstReminder: boolean;
  isUrgent: boolean;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const sectionHeading: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: colors.neutral.mediumGray,
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  margin: '0 0 12px 0',
};

// ---------------------------------------------------------------------------
// Preview data
// ---------------------------------------------------------------------------

const previewProps: InvoiceReminderData = {
  invoiceNumber: 'INV-2026-0042',
  senderName: 'Stand Up Sydney',
  senderEmail: 'accounts@standupsydney.com',
  recipientName: 'ID Comedy Club',
  recipientEmail: 'billing@example.com',
  issueDate: '2026-02-17',
  dueDate: '2026-03-17',
  totalAmount: 850.00,
  currency: 'AUD',
  items: [
    { description: 'MC Services', quantity: 1, unitPrice: 350.00, total: 350.00 },
    { description: 'Headliner Set', quantity: 1, unitPrice: 500.00, total: 500.00 },
  ],
  daysOverdue: 14,
  originalDueDate: '2026-03-03',
  isFirstReminder: false,
  isUrgent: true,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoiceReminder(data: InvoiceReminderData = previewProps) {
  const urgencyLabel = data.isUrgent
    ? 'OVERDUE'
    : data.isFirstReminder
      ? 'REMINDER'
      : 'FINAL NOTICE';

  const urgencyColor = data.isUrgent
    ? colors.status.urgent
    : data.isFirstReminder
      ? colors.status.warning
      : '#dd6b20';

  const alertVariant = data.isUrgent ? 'urgent' as const : 'warning' as const;
  const previewText = `${urgencyLabel}: Invoice ${data.invoiceNumber} — ${formatCurrency(data.totalAmount, data.currency)} ${data.daysOverdue > 0 ? `${data.daysOverdue} days overdue` : 'due today'}`;

  return (
    <EmailLayout previewText={previewText}>
      <BrandHeader
        title={urgencyLabel}
        subtitle={`Invoice ${data.invoiceNumber} — Payment Due`}
        backgroundColor={urgencyColor}
      />

      <AlertBox variant={alertVariant}>
        <Text style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
          <strong>
            {data.daysOverdue > 0
              ? `Payment ${data.daysOverdue} days overdue`
              : 'Payment due today'}
          </strong>
          <br />
          Amount due: <strong>{formatCurrency(data.totalAmount, data.currency)}</strong>
        </Text>
      </AlertBox>

      <ContentCard>
        <Text style={{ margin: '0 0 12px 0', fontSize: '15px', lineHeight: '1.5' }}>
          Hello {data.recipientName},
        </Text>
        <Text style={{ margin: '0', fontSize: '15px', lineHeight: '1.6' }}>
          This is a {data.isFirstReminder ? 'friendly reminder' : data.isUrgent ? 'notice' : 'final notice'}{' '}
          that your invoice payment is{' '}
          {data.daysOverdue > 0
            ? `${data.daysOverdue} days overdue`
            : 'due today'}.
          {data.isUrgent && ' Please make payment immediately to avoid further action.'}
        </Text>
      </ContentCard>

      <ContentCard accentColor={urgencyColor}>
        <Text style={sectionHeading}>Invoice Summary</Text>
        <DetailRow label="Invoice" value={data.invoiceNumber} highlight />
        <DetailRow label="Issued" value={formatDate(data.issueDate)} />
        <DetailRow label="Original Due" value={formatDate(data.originalDueDate)} />
        <DetailRow
          label="Amount Due"
          value={formatCurrency(data.totalAmount, data.currency)}
          highlight
        />
      </ContentCard>

      <ContentCard>
        <Text style={{ margin: '0', fontSize: '14px', color: colors.neutral.mediumGray, lineHeight: '1.6' }}>
          Questions or need to arrange payment? Contact us at{' '}
          <Link href={`mailto:${data.senderEmail}`} style={{ color: urgencyColor, textDecoration: 'none' }}>
            {data.senderEmail}
          </Link>
        </Text>
      </ContentCard>

      <BrandFooter />
    </EmailLayout>
  );
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

export async function renderReminderHtml(data: InvoiceReminderData): Promise<string> {
  return await render(<InvoiceReminder {...data} />);
}

export async function renderReminderText(data: InvoiceReminderData): Promise<string> {
  return await render(<InvoiceReminder {...data} />, { plainText: true });
}

export default InvoiceReminder;
