# Xero Integration Setup Guide

## Quick Start (Production Setup)

### 1. Configure Xero App

1. Log into [Xero Developer Portal](https://developer.xero.com)
2. Create or update your app with:
   - **Redirect URI**: `https://agents.standupsydney.com/auth/xero-callback`
   - **Scopes**: Select all accounting scopes
3. Note your **Client ID** and **Client Secret**

### 2. Set Environment Variables

Add to your `.env` file:
```bash
VITE_XERO_CLIENT_ID=196EF4DE2119488F8F6C4228849D650C
VITE_XERO_CLIENT_SECRET=your-client-secret-here
XERO_WEBHOOK_KEY=generate-random-key-here
```

### 3. Apply Database Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL editor
-- Run the migration in supabase/migrations/20250113_add_xero_contact_id.sql
```

### 4. Deploy Edge Functions

```bash
# Deploy the webhook handler
supabase functions deploy xero-webhook

# Set webhook key secret
supabase secrets set XERO_WEBHOOK_KEY=your-webhook-key
```

### 5. Configure Webhooks in Xero

1. In Xero Developer Portal, go to your app's webhooks section
2. Set webhook URL: `https://pdikjpfulhhpqpxzpgtu.supabase.co/functions/v1/xero-webhook`
3. Copy the signing key to `XERO_WEBHOOK_KEY`
4. Select events: Invoice.*, Contact.*

### 6. Test the Integration

```bash
# Run integration test
node test-xero-with-auth.js

# Test OAuth flow (in browser)
https://agents.standupsydney.com/admin/settings/integrations/xero
```

## Usage Examples

### Connect Xero Account (Admin UI)

```typescript
// In your admin settings component
import { xeroService } from '@/services/xeroService';

const connectXero = () => {
  const authUrl = xeroService.getAuthorizationUrl();
  window.location.href = authUrl;
};
```

### Sync Invoice to Xero

```typescript
import { xeroService } from '@/services/xeroService';

// After creating an invoice
await xeroService.syncInvoiceToXero(invoiceId);
```

### Manual Sync All

```typescript
import { xeroSyncService } from '@/services/xeroSyncService';

// Run full synchronization
const result = await xeroSyncService.syncAllInvoices();
console.log(`Synced: ${result.synced}, Failed: ${result.failed}`);
```

### Start Scheduled Sync

```typescript
import { xeroSyncService } from '@/services/xeroSyncService';

// Start automatic sync every 30 minutes
xeroSyncService.startScheduledSync(30);
```

## Account Mapping

### Default Account Codes

Configure these in your Xero chart of accounts:

| Transaction Type | Account Code | Account Name |
|-----------------|--------------|--------------|
| Ticket Sales | 200 | Sales |
| Comedian Fees | 310 | Entertainment Expenses |
| Venue Hire | 320 | Venue Expenses |
| Marketing | 330 | Marketing Expenses |

### Tax Configuration

| Service Type | Tax Type | Rate |
|-------------|----------|------|
| Ticket Sales | OUTPUT2 | 10% GST |
| Comedian Services | INPUT2 | 10% GST |
| International | EXEMPTOUTPUT | 0% |

## Monitoring

### Check Integration Status

```sql
-- View active integrations
SELECT * FROM xero_integrations 
WHERE connection_status = 'active';

-- Recent sync activity
SELECT * FROM xero_invoices 
ORDER BY last_sync_at DESC 
LIMIT 10;

-- Failed syncs
SELECT * FROM xero_invoices 
WHERE sync_status = 'error';
```

### Webhook Events

```sql
-- Recent webhook events
SELECT * FROM xero_webhook_events 
ORDER BY created_at DESC 
LIMIT 20;

-- Unprocessed events
SELECT * FROM xero_webhook_events 
WHERE processed = false;
```

## Troubleshooting

### Common Issues

1. **"Invalid OAuth state"**
   - Clear browser cache
   - Ensure redirect URI matches exactly

2. **"No active Xero integration found"**
   - Check xero_integrations table
   - Verify token hasn't expired

3. **Invoice sync fails**
   - Check contact exists in Xero
   - Verify account codes are valid
   - Ensure tax types are configured

4. **Webhook not receiving events**
   - Verify webhook URL is accessible
   - Check signature verification
   - Review Xero webhook logs

### Debug Mode

Enable detailed logging:
```typescript
// In xeroService.ts
const DEBUG = true;

// Logs will show:
// - API requests/responses
// - Token refresh attempts
// - Sync operations
```

## Support

- **Xero API Docs**: https://developer.xero.com/documentation/
- **Supabase Support**: https://supabase.com/dashboard/support
- **Integration Issues**: Check XERO_INTEGRATION_TEST_REPORT.md

---

*Last Updated: January 13, 2025*