# Invoicing and Payments

## Overview
Invoice creation, payment links, and accounting exports (Xero) live inside the platform. Stripe handles payment links/checkout; Xero sync mirrors invoices into accounting. Public pay links render success/cancel pages for payers.

## Data
- `invoices` – header (invoice_number, status draft/sent/paid/overdue, due_date, totals, gst_included, issued_by_id, issued_to_id, xero_invoice_id, stripe_payment_link_id).
- `invoice_items` – line items (description, quantity, unit_amount, tax_rate).
- `payments`/`stripe_payments` – records of Stripe charges and status.
- `xero_tokens` – OAuth tokens for Xero tenant.

## Frontend entry points
- Components: `src/components/invoice/InvoiceCard.tsx`, `src/components/InvoiceFilters.tsx`, `src/components/invoice/*` for editor/viewer UX.
- Pages: `src/pages/InvoicePaymentSuccess.tsx`, `src/pages/InvoicePaymentCancelled.tsx` (public pay result screens), invoice lists embedded in dashboards (e.g., organization profile tabs, admin widgets).

## Services / hooks
- `src/services/invoiceService.ts` – CRUD, numbering, PDF generation hooks.
- `src/services/paymentService.ts` and `src/services/stripeService.ts` – create payment intents/links, record payments, verify statuses.
- `src/services/xeroIntegrationService.ts` and `src/services/xeroService.ts` – OAuth flow, push invoices/contacts to Xero, sync status back.
- `src/services/pdfService.ts` – PDF generation for download/email attachments.

## Flow
1) User creates/edits invoice via invoice components → stored in `invoices` + `invoice_items`.
2) Generate Stripe payment link → stored on invoice; payer lands on hosted checkout and is redirected to success/cancel pages.
3) Stripe webhook (via n8n/edge) updates `stripe_payments` and invoice status to paid.
4) Optional Xero sync pushes invoice + contact; statuses pulled back on webhook/cron.

## Known gaps / actions
- Ensure public payment routes stay in sync with router lazy imports (recent Vite dynamic import errors caused module fetch failures; verify `App.tsx` route chunks load).
- Confirm GST handling matches `deal_participants` and bookings when invoices originate from deals.
- Xero token refresh must run on schedule; verify `xeroIntegrationService` refresh path is wired to jobs.
