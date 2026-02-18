/**
 * Test script: Renders all email templates to HTML files and optionally sends a test email.
 *
 * Usage:
 *   npx tsx scripts/test-email-render.tsx              # render only
 *   npx tsx scripts/test-email-render.tsx --send        # render + send SpotAssignment to chillz@standupsydney.com
 */

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import render helpers
import { renderHtml as renderSpotAssignment } from '../src/templates/email/SpotAssignment';
import { renderHtml as renderSpotConfirmation } from '../src/templates/email/SpotConfirmation';
import { renderHtml as renderSpotDeadline } from '../src/templates/email/SpotDeadline';
import { render24HourHtml as renderDeadline24h } from '../src/templates/email/DeadlineReminder';
import { renderInvoiceHtml as renderInvoice } from '../src/templates/email/invoicing/InvoiceEmail';
import { renderReminderHtml as renderInvoiceReminder } from '../src/templates/email/invoicing/InvoiceReminder';
import { renderReceiptHtml as renderPaymentReceipt } from '../src/templates/email/invoicing/InvoiceReceipt';

// Sample data
const spotAssignmentData = {
  comedianName: 'Chillz Skinner',
  comedianEmail: 'chillz@standupsydney.com',
  eventTitle: 'Friday Night Comedy at ID Comedy Club',
  eventDate: '2026-03-06T19:30:00',
  eventTime: '7:30 PM',
  venue: 'ID Comedy Club',
  address: '88 Foveaux St, Surry Hills NSW 2010',
  spotType: '10-minute Set',
  confirmationDeadline: '2026-03-04T17:00:00',
  confirmationUrl: 'https://standupsydney.com/confirm/abc123',
  eventUrl: 'https://standupsydney.com/events/friday-night-comedy',
  promoterName: 'Dave Johnson',
  promoterEmail: 'dave@standupsydney.com',
  performanceDuration: '10 minutes',
  specialInstructions: 'Please arrive by 6:30 PM for sound check. Clean material only — this is an all-ages show.',
};

const spotConfirmationData = {
  comedianName: 'Chillz Skinner',
  comedianEmail: 'chillz@standupsydney.com',
  promoterName: 'Dave Johnson',
  promoterEmail: 'dave@standupsydney.com',
  eventTitle: 'Friday Night Comedy at ID Comedy Club',
  eventDate: '2026-03-06T19:30:00',
  eventTime: '7:30 PM',
  venue: 'ID Comedy Club',
  address: '88 Foveaux St, Surry Hills NSW 2010',
  spotType: '10-minute Set',
  eventUrl: 'https://standupsydney.com/events/friday-night-comedy',
  lineupUrl: 'https://standupsydney.com/events/friday-night-comedy/lineup',
  performanceDuration: '10 minutes',
  arrivalTime: '6:30 PM',
  soundCheckTime: '6:45 PM',
  additionalInfo: 'Green room is on the second floor. Water and snacks provided.',
  isPromoterEmail: false,
};

const spotDeadlineData = {
  comedianName: 'Chillz Skinner',
  comedianEmail: 'chillz@standupsydney.com',
  eventTitle: 'Friday Night Comedy at ID Comedy Club',
  eventDate: '2026-03-06T19:30:00',
  eventTime: '7:30 PM',
  venue: 'ID Comedy Club',
  address: '88 Foveaux St, Surry Hills NSW 2010',
  spotType: '10-minute Set',
  confirmationDeadline: '2026-03-04T17:00:00',
  confirmationUrl: 'https://standupsydney.com/confirm/abc123',
  hoursRemaining: 2,
  promoterName: 'Dave Johnson',
  promoterEmail: 'dave@standupsydney.com',
};

const deadlineReminderData = {
  comedianName: 'Chillz Skinner',
  comedianEmail: 'chillz@standupsydney.com',
  eventTitle: 'Friday Night Comedy at ID Comedy Club',
  eventDate: '2026-03-06T19:30:00',
  venue: 'ID Comedy Club',
  spotType: '10-minute Set',
  confirmationDeadline: '2026-03-04T17:00:00',
  confirmationUrl: 'https://standupsydney.com/confirm/abc123',
  hoursRemaining: 24,
  promoterName: 'Dave Johnson',
  promoterEmail: 'dave@standupsydney.com',
};

const invoiceData = {
  invoiceNumber: 'INV-2026-0042',
  senderName: 'Stand Up Sydney',
  senderEmail: 'accounts@standupsydney.com',
  recipientName: 'ID Comedy Club',
  recipientEmail: 'chillz@standupsydney.com',
  issueDate: '2026-02-17',
  dueDate: '2026-03-17',
  totalAmount: 850.00,
  currency: 'AUD',
  items: [
    { description: 'MC Services — Friday Night Comedy (March 6)', quantity: 1, unitPrice: 350.00, total: 350.00 },
    { description: 'Headliner Set — Saturday Showcase (March 7)', quantity: 1, unitPrice: 500.00, total: 500.00 },
  ],
  notes: 'Payment via bank transfer preferred.',
  paymentInstructions: 'BSB: 062-000, Account: 1234 5678. Reference: INV-2026-0042',
  companyName: 'Stand Up Sydney Pty Ltd',
  companyAddress: '88 Foveaux St, Surry Hills NSW 2010',
  companyABN: '33 614 240 328',
};

const invoiceReminderData = {
  ...invoiceData,
  daysOverdue: 14,
  originalDueDate: '2026-03-03',
  isFirstReminder: false,
  isUrgent: true,
};

const paymentReceiptData = {
  invoiceNumber: 'INV-2026-0042',
  paymentAmount: 850.00,
  paymentDate: '2026-03-15',
  paymentMethod: 'Bank Transfer',
  senderName: 'Stand Up Sydney',
  recipientName: 'ID Comedy Club',
  recipientEmail: 'chillz@standupsydney.com',
  remainingBalance: 0,
  currency: 'AUD',
};

async function main() {
  const outDir = resolve(__dirname, '../.email-preview');
  mkdirSync(outDir, { recursive: true });

  console.log('Rendering email templates...\n');

  const templates: Array<{ name: string; render: () => Promise<string> }> = [
    { name: 'spot-assignment', render: () => renderSpotAssignment(spotAssignmentData) },
    { name: 'spot-confirmation-comedian', render: () => renderSpotConfirmation(spotConfirmationData) },
    { name: 'spot-confirmation-promoter', render: () => renderSpotConfirmation({ ...spotConfirmationData, isPromoterEmail: true }) },
    { name: 'spot-deadline', render: () => renderSpotDeadline(spotDeadlineData) },
    { name: 'deadline-reminder-24h', render: () => renderDeadline24h(deadlineReminderData) },
    { name: 'invoice', render: () => renderInvoice(invoiceData) },
    { name: 'invoice-reminder', render: () => renderInvoiceReminder(invoiceReminderData) },
    { name: 'payment-receipt', render: () => renderPaymentReceipt(paymentReceiptData) },
  ];

  for (const tmpl of templates) {
    try {
      const html = await tmpl.render();
      const filePath = resolve(outDir, `${tmpl.name}.html`);
      writeFileSync(filePath, html, 'utf-8');
      console.log(`  OK  ${tmpl.name}.html (${(html.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  FAIL  ${tmpl.name}:`, err);
    }
  }

  console.log(`\nAll rendered to ${outDir}/\n`);

  // --send flag: send SpotAssignment to chillz@standupsydney.com via the edge function
  if (process.argv.includes('--send')) {
    console.log('Sending test email via send-email edge function...');
    const html = await renderSpotAssignment(spotAssignmentData);

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars. Load .env first.');
      process.exit(1);
    }

    const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: 'chillz@standupsydney.com',
        subject: '[TEST] Spot Assignment — React Email Template',
        html,
        text: 'This is a test of the new React Email templates.',
      }),
    });

    const result = await resp.json();
    console.log('Response:', JSON.stringify(result, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
