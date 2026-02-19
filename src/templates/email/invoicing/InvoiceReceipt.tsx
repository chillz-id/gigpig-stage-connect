import * as React from 'react';
import { Text, Hr } from '@react-email/components';
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
        subtitle="Thank you for your payment"
      />

      <AlertBox variant="success">
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
          Payment confirmed for Invoice {data.invoiceNumber}.
        </Text>
      </AlertBox>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <ContentCard>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0 0 12px 0' }}>
          Hello {data.recipientName},
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
          We've received your payment. Here's your receipt for your records.
        </Text>
      </ContentCard>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <ContentCard>
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
