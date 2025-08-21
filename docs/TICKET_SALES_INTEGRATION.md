# Ticket Sales Integration

This document describes the ticket sales data integration system for Stand Up Sydney, which syncs ticket sales from external platforms (Humanitix and Eventbrite) into the local database.

## Overview

The ticket sales integration provides:
- Real-time webhook processing for order events
- Ticket sales tracking and analytics
- Multi-platform support (Humanitix, Eventbrite)
- Attendee management
- Revenue analytics and reporting

## Architecture

### Database Tables

1. **ticket_sales** - Stores all ticket sale transactions
   - Tracks customer info, quantities, amounts
   - Supports refunds and cancellations
   - Stores raw webhook data for debugging

2. **attendees** - Individual attendee records
   - Links to ticket sales
   - Supports check-in functionality
   - Stores attendee contact details

3. **ticket_platforms** - Links events to external platforms
   - Tracks sync status
   - Stores platform-specific configuration
   - Monitors webhook activity

4. **webhook_logs** - Audit trail of all webhook events
   - Debugging and monitoring
   - Error tracking

### Edge Functions

- `humanitix-webhook` - Processes Humanitix webhooks
- `eventbrite-webhook` - Processes Eventbrite webhooks

## Setup Instructions

### 1. Apply Database Migrations

```bash
# Apply the ticket sales integration migration
supabase db push
```

### 2. Deploy Edge Functions

```bash
# Deploy webhook handlers
supabase functions deploy humanitix-webhook
supabase functions deploy eventbrite-webhook
```

### 3. Set Environment Variables

```bash
# Webhook secrets for signature validation
supabase secrets set HUMANITIX_WEBHOOK_SECRET=your_secret
supabase secrets set EVENTBRITE_WEBHOOK_SECRET=your_secret

# API tokens (if needed)
supabase secrets set HUMANITIX_API_KEY=your_api_key
supabase secrets set EVENTBRITE_OAUTH_TOKEN=your_token
```

### 4. Configure Webhooks on Platforms

#### Humanitix
1. Log into Humanitix Dashboard
2. Navigate to Settings > Webhooks
3. Add webhook URL: `https://[project-id].supabase.co/functions/v1/humanitix-webhook`
4. Select events: order.created, order.updated, order.cancelled, order.refunded

#### Eventbrite
1. Log into Eventbrite
2. Go to Account Settings > Webhooks
3. Add webhook URL: `https://[project-id].supabase.co/functions/v1/eventbrite-webhook`
4. Select actions: order.placed, order.updated, order.refunded

## Testing

### Local Testing

Access the ticket sales test page at `/admin/ticket-sales` to:
- View the sales dashboard
- Test webhook processing
- Set up platform integrations
- Monitor webhook logs

### Webhook Testing

Use the test script to simulate webhooks:

```bash
# Test Humanitix webhook
npm run test:webhook:humanitix

# Test Eventbrite webhook
npm run test:webhook:eventbrite

# Custom webhook test
node scripts/test-webhooks.js --platform humanitix --event order.created
```

### Unit Tests

```bash
# Run integration tests
npm run test -- tests/ticket-sales.test.ts

# Run smoke tests
npm run test -- tests/ticket-sales-smoke.test.ts
```

## API Usage

### JavaScript/TypeScript

```typescript
import { humanitixApiService } from '@/services/humanitixApiService';
import { webhookProcessorService } from '@/services/webhookProcessorService';

// Sync ticket sales for an event
await humanitixApiService.syncEventTicketSales(
  eventId, 
  humanitixEventId
);

// Process a webhook manually
await webhookProcessorService.processWebhook({
  platform: 'humanitix',
  event_type: 'order.created',
  data: webhookPayload,
  timestamp: new Date().toISOString()
});
```

### SQL Queries

```sql
-- View ticket sales for an event
SELECT * FROM ticket_sales 
WHERE event_id = 'your-event-id'
ORDER BY purchase_date DESC;

-- Get sales analytics
SELECT * FROM ticket_sales_analytics
WHERE event_id = 'your-event-id';

-- Check attendee check-in status
SELECT * FROM attendee_checkin_status
WHERE event_id = 'your-event-id';

-- Monitor webhook activity
SELECT * FROM webhook_logs
WHERE platform = 'humanitix'
ORDER BY created_at DESC
LIMIT 20;
```

## Webhook Event Types

### Humanitix Events
- `order.created` - New ticket purchase
- `order.updated` - Order modification
- `order.cancelled` - Order cancellation
- `order.refunded` - Order refund

### Eventbrite Events
- `order.placed` - New ticket purchase
- `order.updated` - Order modification
- `order.refunded` - Order refund
- `attendee.updated` - Attendee information change
- `attendee.checked_in` - Attendee check-in

## Data Flow

1. **Webhook Received** → Edge Function validates and processes
2. **Ticket Sale Created/Updated** → Record in ticket_sales table
3. **Attendees Processed** → Individual records in attendees table
4. **Platform Sync Updated** → Last sync timestamp recorded
5. **Analytics Updated** → Views reflect new data

## Monitoring

### Dashboard Metrics
- Total revenue
- Tickets sold
- Platform breakdown
- Refund tracking
- Webhook health

### Error Handling
- All errors logged to webhook_logs
- Failed webhooks can be retried
- Email alerts for critical failures (if configured)

## Security Considerations

1. **Webhook Signatures** - Always validate in production
2. **HTTPS Only** - All webhooks use secure connections
3. **Rate Limiting** - Built into Edge Functions
4. **Data Privacy** - PII stored securely with RLS

## Troubleshooting

### Common Issues

1. **Webhook not received**
   - Check Edge Function deployment
   - Verify webhook URL in platform settings
   - Check Supabase function logs

2. **Order not found**
   - Ensure event is linked in ticket_platforms
   - Verify external_event_id matches

3. **Signature validation failing**
   - Check webhook secret in environment
   - Verify signature algorithm matches platform

### Debug Mode

Enable detailed logging:
```bash
supabase secrets set DEBUG_WEBHOOKS=true
```

## Future Enhancements

- [ ] Real-time sales notifications
- [ ] Advanced analytics dashboard
- [ ] Automated reconciliation reports
- [ ] Support for additional platforms
- [ ] QR code generation for tickets
- [ ] Mobile check-in app integration