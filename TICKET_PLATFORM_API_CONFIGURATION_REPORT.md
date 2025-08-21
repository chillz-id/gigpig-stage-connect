# Ticket Platform API Configuration Report

## 📊 Configuration Summary

### 1. Environment Variables Status
- ✅ **HUMANITIX_API_KEY**: Configured (9f23a99810...)
- ✅ **HUMANITIX_WEBHOOK_SECRET**: Generated (f0bdb827997b1a4d4a7d7534556be0b4d0f0899ee9949508785c38bfbe733623)
- ❌ **EVENTBRITE_API_KEY**: Not configured (needs to be obtained from Eventbrite)
- ✅ **EVENTBRITE_WEBHOOK_SECRET**: Generated (9b2211a25f464b7149915bbc4f94cf04d4dc852f1cb9817e71810f4db2abcdd8)
- ❌ **EVENTBRITE_OAUTH_TOKEN**: Not configured (requires OAuth setup)

### 2. Webhook Endpoints
Both webhook endpoints have been successfully deployed and are active:

- **Humanitix Webhook**: `https://pdikjpfulhhpqpxzpgtu.supabase.co/functions/v1/humanitix-webhook`
  - Status: ✅ Active (Version 2)
  - Handles: order.created, order.updated, order.cancelled, order.refunded
  
- **Eventbrite Webhook**: `https://pdikjpfulhhpqpxzpgtu.supabase.co/functions/v1/eventbrite-webhook`
  - Status: ✅ Active (Version 2)
  - Handles: order.placed, order.updated, order.refunded

### 3. Database Configuration
- ✅ **ticket_platforms** table: Ready (0 records)
- ✅ **ticket_sales** table: Ready (3 records)
- ✅ **ticket_webhook_logs** table: Created and functional

### 4. API Connectivity Tests
- ❌ **Humanitix API**: Connection failed (400) - API key may need additional configuration
- ⚠️ **Eventbrite API**: Cannot test without OAuth token

### 5. Webhook Testing Results
- ✅ Both webhooks respond correctly (200 OK)
- ✅ Webhook events are being logged to ticket_webhook_logs table
- ✅ Signature validation is implemented (though simplified for Eventbrite)

## 🔧 Required Actions

### 1. Configure Humanitix Webhook
1. Log in to your Humanitix dashboard
2. Navigate to Settings > Webhooks
3. Add the webhook URL: `https://pdikjpfulhhpqpxzpgtu.supabase.co/functions/v1/humanitix-webhook`
4. Configure the webhook secret: `f0bdb827997b1a4d4a7d7534556be0b4d0f0899ee9949508785c38bfbe733623`
5. Select events: order.created, order.updated, order.cancelled, order.refunded

### 2. Configure Eventbrite Integration
1. **Obtain API Credentials**:
   - Log in to Eventbrite
   - Go to Account Settings > App Management
   - Create a new app or use existing one
   - Copy the Private Token and add to EVENTBRITE_API_KEY

2. **Set up Webhooks**:
   - In the app settings, add webhook URL: `https://pdikjpfulhhpqpxzpgtu.supabase.co/functions/v1/eventbrite-webhook`
   - Configure webhook secret: `9b2211a25f464b7149915bbc4f94cf04d4dc852f1cb9817e71810f4db2abcdd8`
   - Select actions: order.placed, order.updated, order.refunded

3. **OAuth Setup** (for advanced features):
   - Implement OAuth flow if needed for user-specific event access
   - Store tokens in platform_config field of ticket_platforms table

### 3. Link Events to Platforms
When creating events that use external ticketing:
1. Create event in Stand Up Sydney platform
2. Create corresponding event in Humanitix/Eventbrite
3. Add ticket_platforms record linking them:
   ```sql
   INSERT INTO ticket_platforms (
     event_id, 
     platform, 
     external_event_id, 
     external_event_url
   ) VALUES (
     'local-event-uuid',
     'humanitix', -- or 'eventbrite'
     'external-event-id',
     'https://events.humanitix.com/your-event'
   );
   ```

## 🧪 Testing the Integration

### Test Humanitix Integration:
```bash
# Send a test webhook from Humanitix dashboard
# Or use the test script:
node /root/agents/scripts/test-ticket-webhooks.js
```

### Test Eventbrite Integration:
```bash
# After configuring API key, test with:
curl -X GET https://www.eventbriteapi.com/v3/users/me/ \
  -H "Authorization: Bearer YOUR_EVENTBRITE_TOKEN"
```

## 📈 Next Steps

1. **Complete API Configuration**: Add missing Eventbrite credentials
2. **Test Live Webhooks**: Create test events and purchases on both platforms
3. **Monitor Webhook Logs**: Check ticket_webhook_logs table for incoming events
4. **Set Up Sync Jobs**: Configure periodic sync for historical data if needed
5. **Create Admin UI**: Build interface for managing platform connections

## 🔒 Security Considerations

- Webhook secrets are securely generated and stored
- All webhook endpoints validate signatures (when secrets are configured)
- Edge functions use service role for database access
- Webhook logs store full payload for debugging but should be cleaned periodically

## 📊 Current Integration Status

| Feature | Humanitix | Eventbrite |
|---------|-----------|------------|
| API Key | ✅ Configured | ❌ Needed |
| Webhook Secret | ✅ Generated | ✅ Generated |
| Webhook Endpoint | ✅ Active | ✅ Active |
| Webhook Logging | ✅ Working | ✅ Working |
| API Connectivity | ⚠️ 400 Error | ❌ No Token |
| Platform Config | ❌ Not Set | ❌ Not Set |

The ticket platform integration infrastructure is now ready. Once the remaining API credentials are configured and webhooks are set up in the external platforms, the system will automatically sync ticket sales data.