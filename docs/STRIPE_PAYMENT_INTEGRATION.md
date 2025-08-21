# Stripe Payment Integration Documentation

## Overview

The Stand Up Sydney platform integrates with Stripe to enable online invoice payments through secure payment links. This integration allows comedians and promoters to receive payments directly through the platform.

## Architecture

### Components

1. **Edge Functions**
   - `create-payment-link`: Creates Stripe payment links for invoices
   - `stripe-webhook`: Handles Stripe webhook events for payment updates

2. **Frontend Components**
   - `InvoiceCard`: Displays payment link creation and management UI
   - `InvoicePaymentSuccess`: Success page after payment completion
   - `InvoicePaymentCancelled`: Cancellation page for abandoned payments

3. **Services**
   - `stripeService.ts`: Frontend service for Stripe operations

4. **Database Tables**
   - `invoice_payment_links`: Stores payment link information
   - `invoice_payments`: Records payment transactions

## Setup Instructions

### 1. Stripe Account Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard:
   - Publishable key (for frontend)
   - Secret key (for backend)
   - Webhook signing secret

### 2. Environment Variables

Add these to your `.env` file:

```env
# Frontend (Vite)
VITE_STRIPE_PUBLIC_KEY=pk_test_... or pk_live_...

# Backend (Supabase Edge Functions)
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Deploy Edge Functions

Deploy the edge functions to Supabase:

```bash
# From the project root
cd supabase/functions

# Deploy create-payment-link function
supabase functions deploy create-payment-link

# Deploy stripe-webhook function
supabase functions deploy stripe-webhook
```

### 4. Configure Stripe Webhook

1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://[your-project].supabase.co/functions/v1/stripe-webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

## Usage Flow

### Creating a Payment Link

1. User clicks "Pay Link" button on an invoice
2. Frontend calls `stripeService.createPaymentLink()`
3. Service invokes `create-payment-link` edge function
4. Edge function:
   - Validates user authentication
   - Creates Stripe payment link
   - Stores link in `invoice_payment_links` table
   - Returns payment URL

### Payment Processing

1. User clicks payment link and is redirected to Stripe Checkout
2. User completes payment on Stripe
3. Stripe sends webhook to `stripe-webhook` function
4. Webhook handler:
   - Verifies webhook signature
   - Creates payment record in `invoice_payments`
   - Updates invoice status
   - Sends notification to user
5. User is redirected to success/cancel page

## Database Schema

### invoice_payment_links

```sql
CREATE TABLE invoice_payment_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id),
  payment_link_id TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'completed', 'cancelled', 'failed'
  amount DECIMAL(10,2),
  currency TEXT,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### invoice_payments

```sql
CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id),
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  status TEXT,
  is_deposit BOOLEAN DEFAULT FALSE,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Considerations

1. **Authentication**: All payment link creation requires authenticated users
2. **Authorization**: Users can only create payment links for their own invoices
3. **Webhook Verification**: All webhooks are verified using Stripe's signature
4. **HTTPS Only**: All payment operations require HTTPS
5. **No Card Storage**: Card details are never stored in our database

## Testing

### Local Testing

1. Use Stripe test keys (starting with `sk_test_` and `pk_test_`)
2. Use test card numbers from Stripe docs
3. Run the test script:

```bash
node test-stripe-payment-link.js
```

### Test Card Numbers

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication Required: `4000 0025 0000 3155`

## Troubleshooting

### Common Issues

1. **Payment link creation fails**
   - Check Stripe API keys are set correctly
   - Verify user authentication
   - Check invoice exists and user has access

2. **Webhook not received**
   - Verify webhook endpoint URL
   - Check webhook signing secret
   - Review Stripe webhook logs

3. **Payment not recorded**
   - Check webhook handler logs
   - Verify database permissions
   - Check for duplicate payment records

### Debug Logging

Enable debug logging in edge functions:

```typescript
const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE] ${step}`, details);
};
```

## API Reference

### Create Payment Link

```typescript
POST /functions/v1/create-payment-link

Headers:
  Authorization: Bearer [user-token]
  Content-Type: application/json

Body:
{
  "invoiceId": "uuid",
  "amount": 10000, // in cents
  "currency": "aud",
  "description": "Invoice #INV-001",
  "metadata": {
    "invoiceId": "uuid",
    "invoiceNumber": "INV-001"
  },
  "successUrl": "https://app.com/payment-success",
  "cancelUrl": "https://app.com/payment-cancelled"
}

Response:
{
  "paymentLinkId": "plink_...",
  "url": "https://checkout.stripe.com/...",
  "expiresAt": "2024-02-01T00:00:00Z"
}
```

### Webhook Events

The webhook handler processes these Stripe events:

1. **checkout.session.completed**
   - Records payment in database
   - Updates invoice status
   - Sends success notification

2. **payment_intent.succeeded**
   - Backup handler for payment recording
   - Updates payment status

3. **payment_intent.payment_failed**
   - Updates payment link status
   - Sends failure notification

## Monitoring

### Key Metrics

1. **Payment Success Rate**: Track successful vs failed payments
2. **Link Conversion**: Track created links vs completed payments
3. **Processing Time**: Monitor webhook processing duration
4. **Error Rate**: Track edge function errors

### Logging

All payment operations are logged with:
- Timestamp
- User ID
- Invoice ID
- Payment amount
- Status
- Error details (if any)

## Future Enhancements

1. **Recurring Payments**: Support subscription-based payments
2. **Multiple Currencies**: Expand beyond AUD
3. **Payment Plans**: Allow installment payments
4. **Refunds**: Automated refund processing
5. **Tax Handling**: Automatic tax calculation
6. **Mobile SDK**: Native mobile payment experience