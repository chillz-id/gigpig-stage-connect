# Webhook Setup Documentation

This document provides instructions for setting up webhooks to automatically sync ticket sales from Humanitix and Eventbrite.

## Overview

The webhook infrastructure allows real-time synchronization of ticket sales by receiving notifications when orders are created, updated, or refunded on the ticketing platforms.

## Webhook Endpoints

### Humanitix Webhook
- **Endpoint**: `https://[your-supabase-project].supabase.co/functions/v1/humanitix-webhook`
- **Method**: POST
- **Authentication**: Optional webhook signature validation via `x-humanitix-signature` header

### Eventbrite Webhook
- **Endpoint**: `https://[your-supabase-project].supabase.co/functions/v1/eventbrite-webhook`
- **Method**: POST
- **Authentication**: Optional webhook signature validation via `x-eventbrite-signature` header

## Deployment Instructions

### 1. Deploy Edge Functions to Supabase

```bash
# Deploy Humanitix webhook function
supabase functions deploy humanitix-webhook

# Deploy Eventbrite webhook function
supabase functions deploy eventbrite-webhook
```

### 2. Set Environment Variables

Set the following environment variables in your Supabase project:

```bash
# For Humanitix webhook signature validation (optional but recommended)
supabase secrets set HUMANITIX_WEBHOOK_SECRET=your_webhook_secret

# For Eventbrite webhook signature validation (optional but recommended)
supabase secrets set EVENTBRITE_WEBHOOK_SECRET=your_webhook_secret

# For Eventbrite API access (required if not using per-event tokens)
supabase secrets set EVENTBRITE_OAUTH_TOKEN=your_eventbrite_oauth_token
```

### 3. Configure Webhooks on Platforms

#### Humanitix Configuration

1. Log in to your Humanitix account
2. Navigate to Settings > Developer > Webhooks
3. Click "Create Webhook"
4. Configure:
   - **URL**: Your Humanitix webhook endpoint
   - **Events**: Select the following events:
     - `order.created`
     - `order.updated`
     - `order.cancelled`
     - `order.refunded`
5. Copy the webhook secret and set it as `HUMANITIX_WEBHOOK_SECRET` in Supabase

#### Eventbrite Configuration

1. Log in to your Eventbrite account
2. Go to Account Settings > Developer > Webhooks
3. Click "Create Webhook"
4. Configure:
   - **Payload URL**: Your Eventbrite webhook endpoint
   - **Actions**: Select the following:
     - `order.placed`
     - `order.updated`
     - `order.refunded`
5. Save the webhook configuration

## Webhook Event Processing

### Humanitix Events

#### order.created / order.updated
- Creates or updates a ticket sale record in the `ticket_sales` table
- Only processes orders with status "paid"
- Extracts customer information, ticket quantities, and pricing

#### order.cancelled
- Updates the ticket sale record with `refund_status = 'cancelled'`

#### order.refunded
- Updates the ticket sale record with `refund_status = 'refunded'`
- Records the refund amount and date

### Eventbrite Events

#### order.placed / order.updated
- Fetches full order details from Eventbrite API
- Creates or updates a ticket sale record
- Requires valid Eventbrite access token

#### order.refunded
- Updates the ticket sale record with refund information

## Database Tables Used

### ticket_sales
Stores all ticket sale records with the following key fields:
- `event_id`: Links to local event
- `customer_name`, `customer_email`: Customer information
- `ticket_quantity`, `ticket_type`: Ticket details
- `total_amount`, `currency`: Pricing information
- `platform`, `platform_order_id`: Platform identification
- `refund_status`: none, cancelled, or refunded
- `raw_data`: Complete order data from platform

### ticket_platforms
Links local events to external platform events:
- `event_id`: Local event ID
- `platform`: 'humanitix' or 'eventbrite'
- `external_event_id`: Platform's event ID
- `last_sync_at`: Last synchronization timestamp
- `webhook_last_received`: Last webhook received timestamp

### webhook_logs
Stores all webhook events for debugging and auditing:
- `platform`: Source platform
- `event_type`: Type of webhook event
- `payload`: Full webhook payload
- `signature`: Webhook signature (if provided)
- `processed`: Success/failure status
- `error_message`: Error details (if any)

## Testing Webhooks

Use the provided testing script to simulate webhook events:

```bash
# Test Humanitix webhook
npm run test:webhook:humanitix

# Test Eventbrite webhook
npm run test:webhook:eventbrite

# Test with custom payload
node scripts/test-webhooks.js --platform humanitix --event order.created --file sample-order.json
```

## Monitoring and Debugging

### View Webhook Logs

```sql
-- View recent webhook events
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- View failed webhooks
SELECT * FROM webhook_logs 
WHERE processed = false 
ORDER BY created_at DESC;

-- View webhooks for specific platform
SELECT * FROM webhook_logs 
WHERE platform = 'humanitix' 
ORDER BY created_at DESC;
```

### Check Sync Status

```sql
-- View sync status for all events
SELECT 
  e.name as event_name,
  tp.platform,
  tp.last_sync_at,
  tp.webhook_last_received
FROM ticket_platforms tp
JOIN events e ON e.id = tp.event_id
ORDER BY tp.webhook_last_received DESC;
```

## Security Considerations

1. **Webhook Signatures**: Always validate webhook signatures in production
2. **HTTPS Only**: Webhooks are only accepted over HTTPS
3. **IP Whitelisting**: Consider implementing IP whitelisting for additional security
4. **Rate Limiting**: Edge functions have built-in rate limiting
5. **Error Handling**: All errors are logged without exposing sensitive information

## Troubleshooting

### Common Issues

1. **Webhook not received**
   - Check webhook URL configuration on platform
   - Verify Edge Function is deployed and running
   - Check Supabase function logs

2. **Signature validation failing**
   - Ensure webhook secret is correctly set in environment variables
   - Verify signature calculation method matches platform documentation

3. **Order not found in database**
   - Check if the event is properly linked in `ticket_platforms` table
   - Verify the `external_event_id` matches

4. **API access errors (Eventbrite)**
   - Ensure OAuth token is valid and has correct permissions
   - Check if token needs refresh

### Debug Mode

Enable debug logging by setting environment variable:
```bash
supabase secrets set DEBUG_WEBHOOKS=true
```

This will log additional information to help diagnose issues.