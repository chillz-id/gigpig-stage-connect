# Humanitix to Brevo Customer Synchronization

Complete integration guide for automatically synchronizing customer data from Humanitix ticket sales to Brevo CRM for email marketing and customer management.

## Overview

This integration creates a seamless flow of customer data from comedy event ticket sales on Humanitix directly to your Brevo CRM system, enabling:

- **Automatic customer database building** from ticket sales
- **Real-time synchronization** to Brevo for marketing campaigns
- **Customer segmentation** based on purchase behavior
- **Targeted email marketing** to comedy event attendees
- **Customer lifetime value tracking** and engagement analytics

## Architecture

```
Humanitix Order → Webhook → Enhanced Customer Data → N8N Workflow → Brevo CRM
                            ↓
                     Customers Table (Database)
```

### Components

1. **Enhanced Humanitix Webhook** - Captures detailed customer data
2. **Customers Database Table** - Central customer repository
3. **N8N Workflow** - Automated Brevo synchronization
4. **Brevo CRM Lists** - Segmented customer management
5. **Migration Scripts** - Historical data import

## Database Schema

### Customers Table

```sql
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  mobile TEXT,
  location TEXT DEFAULT 'AU',
  marketing_opt_in BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'humanitix',
  
  -- Customer metrics
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_date TIMESTAMPTZ,
  last_event_id UUID REFERENCES events(id),
  last_event_name TEXT,
  
  -- Customer segmentation
  customer_segment TEXT DEFAULT 'new',
  preferred_venue TEXT,
  
  -- Brevo synchronization
  brevo_contact_id TEXT,
  brevo_sync_status TEXT DEFAULT 'pending',
  brevo_last_sync TIMESTAMPTZ,
  brevo_sync_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Customer Segments

- **new**: First-time customers
- **active**: Purchased within last 3 months
- **vip**: 5+ orders or high spending
- **inactive**: No purchases in 6+ months

## Brevo Configuration

### Required Lists in Brevo

1. **All Comedy Customers** (ID: 1) - Main list for all customers
2. **Active Customers** (ID: 2) - Recent purchasers
3. **VIP Customers** (ID: 3) - High-value customers
4. **Inactive Customers** (ID: 4) - Re-engagement campaigns

### Custom Attributes

Create these custom attributes in your Brevo account:

```
FIRSTNAME (text)
LASTNAME (text)
SMS (text) - Mobile number
TOTAL_ORDERS (number)
TOTAL_SPENT (number)
LAST_EVENT_NAME (text)
LAST_ORDER_DATE (date)
CUSTOMER_SEGMENT (text)
MARKETING_OPT_IN (boolean)
PREFERRED_VENUE (text)
SOURCE (text)
CUSTOMER_SINCE (date)
```

## Installation Guide

### 1. Database Migration

Run the customers table migration:

```bash
cd /root/agents
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20250808_create_customers_table.sql
```

### 2. Environment Configuration

Add Brevo credentials to `/etc/standup-sydney/credentials.env`:

```bash
# Brevo (formerly Sendinblue)
BREVO_API_KEY=your_brevo_api_key_here
BREVO_API_URL=https://api.brevo.com/v3
```

### 3. Deploy Enhanced Webhook

Deploy the enhanced Humanitix webhook:

```bash
supabase functions deploy humanitix-webhook-enhanced --project-ref pdikjpfulhhpqpxzpgtu
```

### 4. Import N8N Workflow

1. Open your N8N instance (http://localhost:5678)
2. Import the workflow from `/root/agents/n8n-workflows/humanitix-brevo-sync.json`
3. Configure credentials:
   - **Supabase API**: Your Supabase URL and service key
   - **Brevo API**: Your Brevo API key

### 5. Test Integration

Test the Brevo connection:

```bash
cd /root/agents
node scripts/test-brevo-integration.js
```

### 6. Historical Data Migration

Migrate existing customers to Brevo:

```bash
cd /root/agents
node scripts/migrate-customers-to-brevo.js
```

## Workflow Configuration

### N8N Workflow Features

- **Webhook Trigger**: Responds to Humanitix order events
- **Scheduled Sync**: Runs every 6 hours for pending customers
- **Batch Processing**: Handles up to 50 customers per execution
- **Error Handling**: Logs failures and provides detailed reporting
- **List Management**: Automatically assigns customers to appropriate lists

### Webhook URL

Once deployed, the N8N workflow will be available at:
```
http://your-n8n-instance:5678/webhook/humanitix-brevo-sync
```

Add this URL to the enhanced webhook environment:
```bash
N8N_BREVO_SYNC_WEBHOOK=http://localhost:5678/webhook/humanitix-brevo-sync
```

## Usage Examples

### Manual Sync

Trigger a manual sync of pending customers:

```bash
curl -X POST http://localhost:5678/webhook/humanitix-brevo-sync \
  -H "Content-Type: application/json" \
  -d '{"trigger": "manual_sync"}'
```

### Specific Customer Sync

Sync a specific customer after a new order:

```bash
curl -X POST http://localhost:5678/webhook/humanitix-brevo-sync \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "humanitix_order",
    "customer": {
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Smith",
      "marketingOptIn": true
    }
  }'
```

### Query Customer Data

```sql
-- Get customer analytics
SELECT * FROM customer_analytics 
WHERE customer_segment = 'vip' 
ORDER BY total_spent DESC;

-- Check sync status
SELECT brevo_sync_status, COUNT(*) as count
FROM customers 
GROUP BY brevo_sync_status;

-- Find customers needing sync
SELECT email, brevo_sync_error
FROM customers 
WHERE brevo_sync_status = 'failed';
```

## Marketing Campaigns

### Segmentation Examples

#### New Customer Welcome Series
```sql
SELECT email FROM customers 
WHERE customer_segment = 'new' 
AND created_at > NOW() - INTERVAL '7 days';
```

#### VIP Customer Exclusive Events
```sql
SELECT email FROM customers 
WHERE customer_segment = 'vip' 
AND marketing_opt_in = true;
```

#### Re-engagement Campaign
```sql
SELECT email FROM customers 
WHERE customer_segment = 'inactive' 
AND marketing_opt_in = true 
AND last_order_date < NOW() - INTERVAL '6 months';
```

#### Venue-Specific Promotions
```sql
SELECT email FROM customers 
WHERE preferred_venue = 'Comedy Store' 
AND customer_segment IN ('active', 'vip');
```

## Monitoring & Analytics

### Sync Performance Dashboard

```sql
-- Daily sync summary
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_syncs,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM brevo_sync_logs 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Customer Growth Tracking

```sql
-- Monthly customer acquisition
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_customers,
  SUM(total_spent) as total_revenue
FROM customers
GROUP BY month
ORDER BY month DESC;
```

### Campaign Performance

```sql
-- Customer lifetime value by segment
SELECT 
  customer_segment,
  COUNT(*) as customers,
  AVG(total_spent) as avg_clv,
  AVG(total_orders) as avg_orders,
  COUNT(CASE WHEN marketing_opt_in THEN 1 END) * 100.0 / COUNT(*) as opt_in_rate
FROM customers
GROUP BY customer_segment;
```

## Troubleshooting

### Common Issues

#### Sync Status 'Failed'

Check sync errors:

```sql
SELECT email, brevo_sync_error 
FROM customers 
WHERE brevo_sync_status = 'failed'
LIMIT 10;
```

Common solutions:
- Verify Brevo API key is valid
- Check if email format is valid
- Ensure required custom attributes exist in Brevo

#### Missing Customer Data

Verify webhook is receiving data:

```sql
SELECT * FROM ticket_webhook_logs 
WHERE platform = 'humanitix' 
ORDER BY created_at DESC 
LIMIT 10;
```

#### N8N Workflow Not Triggering

1. Check N8N workflow is active
2. Verify webhook URL is correct
3. Check N8N logs for errors
4. Test webhook endpoint manually

### Debug Commands

```bash
# Test Brevo API connection
node scripts/test-brevo-integration.js

# Check customer sync status
psql -c "SELECT brevo_sync_status, COUNT(*) FROM customers GROUP BY brevo_sync_status;"

# View recent sync logs
psql -c "SELECT * FROM brevo_sync_logs ORDER BY created_at DESC LIMIT 5;"

# Retry failed syncs
curl -X POST http://localhost:5678/webhook/humanitix-brevo-sync
```

## Security Considerations

### API Key Management

- Store Brevo API key in environment variables only
- Use service role for database operations
- Implement webhook signature validation

### Data Privacy

- Respect customer opt-out preferences
- Implement GDPR compliance for EU customers
- Secure transmission of customer data

### Access Control

- Limit database access to service roles
- Monitor API usage and rate limits
- Log all sync operations for audit trail

## Performance Optimization

### Batch Processing

- Process customers in batches of 50
- Implement delays between API calls
- Use exponential backoff for failures

### Database Optimization

- Index customer email and sync status
- Regular cleanup of old sync logs
- Monitor query performance

### API Rate Limiting

- Respect Brevo API limits (300 calls/minute)
- Implement queue for high-volume periods
- Monitor API usage metrics

## Maintenance Tasks

### Daily

- Monitor sync failure rates
- Check for failed customers needing retry
- Review API usage against limits

### Weekly

- Clean up old sync logs
- Review customer segment distribution
- Analyze campaign performance

### Monthly

- Audit customer data quality
- Review and update segmentation rules
- Optimize workflow performance

## Support & Documentation

### Resources

- [Brevo API Documentation](https://developers.brevo.com/)
- [N8N Workflow Documentation](http://localhost:5678/workflows)
- [Supabase Dashboard](https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu)

### Contacts

- **Technical Issues**: dev@standupsydney.com
- **Campaign Support**: marketing@standupsydney.com
- **Data Questions**: admin@standupsydney.com

---

**Last Updated**: August 8, 2025  
**Version**: 1.0  
**Integration**: Humanitix → Brevo CRM