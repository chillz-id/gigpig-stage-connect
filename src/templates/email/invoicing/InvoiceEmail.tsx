import * as React from 'react';
import { Text, Link, render } from '@react-email/components';
import {
  EmailLayout,
  BrandHeader,
  BrandFooter,
  DetailRow,
  ContentCard,
  Divider,
} from '../components';
import { colors, fonts } from '../tokens';

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

export interface InvoiceEmailData {
  invoiceNumber: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  issueDate: string;
  dueDate: string;
  createdAt?: string;
  eventName?: string;
  eventDate?: string;
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
  taxRate?: number;
  currency: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxAmount?: number;
    isDeduction?: boolean;
  }>;
  notes?: string;
  paymentInstructions?: string;
  senderBankName?: string;
  senderBankBsb?: string;
  senderBankAccount?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyABN?: string;
  attachPDF?: boolean;
}

// ---------------------------------------------------------------------------
// Table styles
// ---------------------------------------------------------------------------

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '12px',
  fontFamily: fonts.body,
  backgroundColor: colors.neutral.heading,
  color: colors.neutral.white,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '14px',
  fontFamily: fonts.body,
  borderBottom: `1px solid ${colors.neutral.border}`,
  color: colors.neutral.body,
};

// ---------------------------------------------------------------------------
// Preview data
// ---------------------------------------------------------------------------

const previewProps: InvoiceEmailData = {
  invoiceNumber: 'INV-2026-0042',
  senderName: 'GigPigs',
  senderEmail: 'team@gigpigs.app',
  recipientName: 'ID Comedy Club',
  recipientEmail: 'billing@example.com',
  issueDate: '2026-02-17',
  dueDate: '2026-03-17',
  createdAt: '2026-02-26',
  eventName: 'Magic Mic Comedy',
  eventDate: '2026-02-25',
  totalAmount: 850.00,
  subtotal: 765.00,
  taxAmount: 85.00,
  taxRate: 10,
  currency: 'AUD',
  items: [
    { description: 'MC Services', quantity: 1, unitPrice: 350.00, total: 385.00, taxAmount: 35.00 },
    { description: 'Headliner Set', quantity: 1, unitPrice: 500.00, total: 550.00, taxAmount: 50.00 },
    { description: 'Commission', quantity: 1, unitPrice: -85.00, total: -85.00, taxAmount: 0 },
  ],
  notes: 'Thanks for a great show!',
  senderBankName: 'Jane Smith',
  senderBankBsb: '062-000',
  senderBankAccount: '1234 5678',
  companyName: 'GigPigs Pty Ltd',
  companyAddress: '88 Foveaux St, Surry Hills NSW 2010',
  companyABN: '33 614 240 328',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoiceEmail(props: InvoiceEmailData = previewProps) {
  const data = { ...previewProps, ...props };
  const previewText = `Invoice ${data.invoiceNumber} — ${formatCurrency(data.totalAmount, data.currency)} due ${formatDate(data.dueDate)}`;

  return (
    <EmailLayout previewText={previewText}>
      <BrandHeader
        title={`Invoice ${data.invoiceNumber}`}
        subtitle={data.companyName || 'GigPigs'}
      />

      {data.createdAt ? (
        <ContentCard>
          <Text style={{ fontSize: '13px', color: colors.neutral.muted, margin: '0' }}>
            Generated on {formatDate(data.createdAt)}
          </Text>
        </ContentCard>
      ) : null}

      <Divider />

      {/* Summary — two-column layout like Xero */}
      <ContentCard>
        <table role="presentation" cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '12px' }}>
                <DetailRow label="Invoice No" value={data.invoiceNumber} highlight />
                <DetailRow label="Due Date" value={formatDate(data.dueDate)} />
                <DetailRow label="From" value={data.senderName} />
              </td>
              <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '12px' }}>
                {data.eventName ? <DetailRow label="Event" value={data.eventName} /> : null}
                {data.eventDate ? <DetailRow label="Event Date" value={formatDate(data.eventDate)} /> : null}
                <DetailRow label="To" value={data.recipientName} />
              </td>
            </tr>
          </tbody>
        </table>
      </ContentCard>

      <Divider />

      {/* Line items table — Xero-style: Description | Sub Total | GST | Total */}
      <ContentCard padding="0">
        <table
          role="presentation"
          cellPadding="0"
          cellSpacing="0"
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Description</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '90px' }}>Sub Total</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '90px' }}>GST ({data.taxRate || 10}%)</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '90px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => {
              const isDeduction = item.isDeduction || item.total < 0 || item.unitPrice < 0;
              const itemSubtotal = item.quantity * item.unitPrice;
              const itemTax = item.taxAmount ?? (isDeduction ? 0 : itemSubtotal * ((data.taxRate || 10) / 100));
              const deductionColor = '#DC2626';
              const amountStyle: React.CSSProperties = {
                ...tdStyle,
                textAlign: 'right',
                fontFamily: fonts.mono,
                fontSize: '13px',
                ...(isDeduction ? { color: deductionColor } : {}),
              };
              return (
                <tr key={i} style={isDeduction ? { backgroundColor: '#FEF2F2' } : undefined}>
                  <td style={{ ...tdStyle, ...(isDeduction ? { color: deductionColor } : {}) }}>
                    {item.description}{isDeduction ? ' (Deduction)' : ''}
                  </td>
                  <td style={amountStyle}>
                    {isDeduction ? '-' : ''}${Math.abs(itemSubtotal).toFixed(2)}
                  </td>
                  <td style={amountStyle}>
                    {itemTax < 0 ? '-' : ''}${Math.abs(itemTax).toFixed(2)}
                  </td>
                  <td style={{ ...amountStyle, fontWeight: 600 }}>
                    {isDeduction ? '-' : ''}${Math.abs(item.total).toFixed(2)}
                  </td>
                </tr>
              );
            })}

            {/* Sub total row */}
            <tr>
              <td style={{ ...tdStyle, fontWeight: 600 }}>Sub total</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: fonts.mono, fontSize: '13px', fontWeight: 600 }}>
                ${(data.subtotal ?? data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)).toFixed(2)}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: fonts.mono, fontSize: '13px', fontWeight: 600 }}>
                ${(data.taxAmount ?? 0).toFixed(2)}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: fonts.mono, fontSize: '13px', fontWeight: 600 }}>
                ${data.totalAmount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount Due */}
        <table role="presentation" cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ padding: '16px 12px', fontSize: '14px', color: colors.neutral.body }}>
                Amount Due
              </td>
              <td
                style={{
                  padding: '16px 12px',
                  fontSize: '20px',
                  fontWeight: 700,
                  textAlign: 'right',
                  color: colors.brand.primary,
                  borderTop: `2px solid ${colors.brand.primary}`,
                }}
              >
                {formatCurrency(data.totalAmount, data.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </ContentCard>

      <Divider />

      {/* Payment details */}
      {(data.senderBankName || data.senderBankBsb || data.senderBankAccount) ? (
        <ContentCard>
          <Text style={{ fontSize: '13px', fontWeight: 700, color: colors.neutral.heading, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Payment Details
          </Text>
          <DetailRow label="Account Name" value={data.senderName} />
          {data.senderBankBsb ? <DetailRow label="BSB" value={data.senderBankBsb} /> : null}
          {data.senderBankAccount ? <DetailRow label="Account Number" value={data.senderBankAccount} /> : null}
          <DetailRow label="Reference" value={data.invoiceNumber} highlight />
          {data.companyABN ? <DetailRow label="ABN" value={data.companyABN} /> : null}
          <Text style={{ fontSize: '14px', lineHeight: '1.6', color: colors.neutral.muted, margin: '12px 0 0 0' }}>
            Payment via bank transfer preferred.
          </Text>
        </ContentCard>
      ) : data.paymentInstructions ? (
        <ContentCard>
          <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
            {data.paymentInstructions}
          </Text>
        </ContentCard>
      ) : null}

      {data.notes ? (
        <>
          <Divider />
          <ContentCard>
            <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
              {data.notes}
            </Text>
          </ContentCard>
        </>
      ) : null}

      <BrandFooter />
    </EmailLayout>
  );
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

export async function renderInvoiceHtml(data: InvoiceEmailData): Promise<string> {
  return await render(<InvoiceEmail {...data} />);
}

export async function renderInvoiceText(data: InvoiceEmailData): Promise<string> {
  return await render(<InvoiceEmail {...data} />, { plainText: true });
}

export default InvoiceEmail;
