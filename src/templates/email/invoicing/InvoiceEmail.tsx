import * as React from 'react';
import { Text, Link, Hr, Section, render } from '@react-email/components';
import {
  EmailLayout,
  BrandHeader,
  BrandFooter,
  DetailRow,
  ContentCard,
  AlertBox,
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

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '11px',
  fontFamily: fonts.body,
  backgroundColor: colors.neutral.darkGray,
  color: colors.neutral.white,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '14px',
  fontFamily: fonts.body,
  borderBottom: `1px solid ${colors.neutral.lightGray}`,
  color: colors.neutral.darkGray,
};

// ---------------------------------------------------------------------------
// Preview data
// ---------------------------------------------------------------------------

const previewProps: InvoiceEmailData = {
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
  notes: 'Payment via bank transfer preferred.',
  paymentInstructions: 'BSB: 062-000, Account: 1234 5678. Reference: INV-2026-0042',
  companyName: 'Stand Up Sydney Pty Ltd',
  companyAddress: '88 Foveaux St, Surry Hills NSW 2010',
  companyABN: '33 614 240 328',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoiceEmail(data: InvoiceEmailData = previewProps) {
  const previewText = `Invoice ${data.invoiceNumber} — ${formatCurrency(data.totalAmount, data.currency)} due ${formatDate(data.dueDate)}`;

  return (
    <EmailLayout previewText={previewText}>
      <BrandHeader
        title={`Invoice ${data.invoiceNumber}`}
        subtitle={data.companyName || 'Stand Up Sydney'}
      />

      <ContentCard>
        <Text style={{ margin: '0 0 12px 0', fontSize: '15px', lineHeight: '1.5' }}>
          Hello {data.recipientName},
        </Text>
        <Text style={{ margin: '0', fontSize: '15px', lineHeight: '1.6' }}>
          Please find your invoice details below. Payment is due by{' '}
          <strong>{formatDate(data.dueDate)}</strong>.
        </Text>
      </ContentCard>

      {/* Invoice summary with accent */}
      <ContentCard accentColor={colors.brand.primary}>
        <table role="presentation" cellPadding="0" cellSpacing="0" width="100%">
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top' }}>
                <Text style={{ ...sectionHeading, margin: '0 0 8px 0' }}>Invoice Details</Text>
                <DetailRow label="Invoice" value={data.invoiceNumber} highlight />
                <DetailRow label="Issued" value={formatDate(data.issueDate)} />
                <DetailRow label="Due" value={formatDate(data.dueDate)} highlight />
              </td>
            </tr>
          </tbody>
        </table>
      </ContentCard>

      {/* Line items table */}
      <ContentCard padding="0">
        <Text style={{ ...sectionHeading, padding: '24px 24px 12px 24px' }}>Line Items</Text>
        <table
          role="presentation"
          cellPadding="0"
          cellSpacing="0"
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Description</th>
              <th style={{ ...thStyle, textAlign: 'center', width: '50px' }}>Qty</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '80px' }}>Rate</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '90px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i}>
                <td style={tdStyle}>{item.description}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: fonts.mono, fontSize: '13px' }}>
                  ${item.unitPrice.toFixed(2)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, fontFamily: fonts.mono, fontSize: '13px' }}>
                  ${item.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total row */}
        <table role="presentation" cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td
                style={{
                  padding: '16px 24px',
                  fontSize: '18px',
                  fontWeight: 700,
                  textAlign: 'right',
                  color: colors.brand.primary,
                  borderTop: `2px solid ${colors.brand.primary}`,
                }}
              >
                Total: {formatCurrency(data.totalAmount, data.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </ContentCard>

      {/* Payment instructions */}
      <ContentCard accentColor={colors.brand.accent}>
        <Text style={sectionHeading}>Payment Instructions</Text>
        <Text style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.6' }}>
          {data.paymentInstructions ||
            `Please make payment by ${formatDate(data.dueDate)} to avoid any late fees.`}
        </Text>
        <Text style={{ margin: '0', fontSize: '14px', color: colors.neutral.mediumGray }}>
          Questions? Contact us at{' '}
          <Link href={`mailto:${data.senderEmail}`} style={{ color: colors.brand.primary, textDecoration: 'none' }}>
            {data.senderEmail}
          </Link>
        </Text>
      </ContentCard>

      {data.notes ? (
        <ContentCard>
          <Text style={sectionHeading}>Notes</Text>
          <Text style={{ margin: '0', fontSize: '14px', lineHeight: '1.6', color: colors.neutral.mediumGray }}>
            {data.notes}
          </Text>
        </ContentCard>
      ) : null}

      {(data.companyAddress || data.companyABN) ? (
        <ContentCard>
          <Text style={sectionHeading}>Company Information</Text>
          {data.companyAddress ? (
            <DetailRow label="Address" value={data.companyAddress} />
          ) : null}
          {data.companyABN ? (
            <DetailRow label="ABN" value={data.companyABN} />
          ) : null}
        </ContentCard>
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
