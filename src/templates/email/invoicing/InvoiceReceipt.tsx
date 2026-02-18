import * as React from 'react';
import { Text, Section } from '@react-email/components';
import { render } from '@react-email/components';
import {
  EmailLayout,
  BrandHeader,
  BrandFooter,
  DetailRow,
  ContentCard,
  AlertBox,
} from '../components';
import { colors } from '../tokens';

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const sectionHeading: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: colors.neutral.mediumGray,
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  margin: '0 0 12px 0',
};

const previewProps: InvoicePaymentReceiptData = {
  invoiceNumber: 'INV-2026-0042',
  paymentAmount: 850.00,
  paymentDate: '2026-03-15',
  paymentMethod: 'Bank Transfer',
  senderName: 'Stand Up Sydney',
  recipientName: 'ID Comedy Club',
  recipientEmail: 'billing@example.com',
  remainingBalance: 0,
  currency: 'AUD',
};

export function PaymentReceipt(data: InvoicePaymentReceiptData = previewProps) {
  return (
    <EmailLayout previewText={`Payment received — Invoice ${data.invoiceNumber}`}>
      <BrandHeader
        title="Payment Received"
        subtitle="Thank you for your payment!"
        backgroundColor={colors.status.success}
      />

      <AlertBox variant="success">
        <Text style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
          <strong>Payment confirmed.</strong> Invoice {data.invoiceNumber} has been paid in full.
        </Text>
      </AlertBox>

      <ContentCard>
        <Text style={{ margin: '0 0 12px 0', fontSize: '15px', lineHeight: '1.5' }}>
          Hello {data.recipientName},
        </Text>
        <Text style={{ margin: '0', fontSize: '15px', lineHeight: '1.6' }}>
          We've received your payment. Here's your receipt for your records.
        </Text>
      </ContentCard>

      <ContentCard accentColor={colors.status.success}>
        <Text style={sectionHeading}>Payment Details</Text>
        <DetailRow label="Invoice" value={data.invoiceNumber} highlight />
        <DetailRow label="Date" value={formatDate(data.paymentDate)} />
        <DetailRow label="Method" value={data.paymentMethod} />
        <DetailRow
          label="Amount Paid"
          value={`${data.currency} $${data.paymentAmount.toFixed(2)}`}
          highlight
        />
      </ContentCard>

      <BrandFooter />
    </EmailLayout>
  );
}

export async function renderReceiptHtml(data: InvoicePaymentReceiptData): Promise<string> {
  return await render(<PaymentReceipt {...data} />);
}

export async function renderReceiptText(data: InvoicePaymentReceiptData): Promise<string> {
  return await render(<PaymentReceipt {...data} />, { plainText: true });
}

export default PaymentReceipt;
