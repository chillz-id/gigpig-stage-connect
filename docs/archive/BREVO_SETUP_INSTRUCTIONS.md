# Brevo Integration Setup Instructions

## 🎯 Current Status

✅ **API Credentials Added** - Your Brevo API key is configured  
✅ **Integration Code Ready** - All scripts and workflows created  
⚠️  **IP Whitelisting Required** - Brevo requires IP address authorization  

## 🔐 Required Action: IP Whitelisting

Brevo detected an unrecognized IP address and requires you to whitelist our server IP.

### Server IP Address to Whitelist:
```
170.64.129.59
```

### How to Add IP to Brevo Allowlist:

1. **Log into your Brevo account**
2. **Go to Account Settings** → Security
3. **Find "Authorized IP Addresses"** section
4. **Click "Add IP Address"**
5. **Enter**: `170.64.129.59`
6. **Save changes**

**Direct Link**: https://app.brevo.com/security/authorised_ips

## 🧪 Test Integration

Once IP is whitelisted, test the connection:

```bash
cd /root/agents
node scripts/test-brevo-integration.js
```

Expected output:
```
✅ Connected to account: [Your Name]
✅ Found X lists
✅ Test contact created
✅ All tests completed successfully!
```

## 🚀 Complete Setup Process

### 1. Database Migration
```bash
cd /root/agents
# Apply the customers table migration
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20250808_create_customers_table.sql
```

### 2. Deploy Enhanced Webhook
```bash
# Deploy the enhanced webhook
supabase functions deploy humanitix-webhook-enhanced --project-ref pdikjpfulhhpqpxzpgtu
```

### 3. Set Up Brevo Lists

Create these lists in your Brevo dashboard:

- **All Comedy Customers** (will be assigned ID 1)
- **Active Customers** (will be assigned ID 2) 
- **VIP Customers** (will be assigned ID 3)
- **Inactive Customers** (will be assigned ID 4)

### 4. Create Custom Attributes

In Brevo, create these contact attributes:

| Attribute Name | Type | Description |
|----------------|------|-------------|
| FIRSTNAME | Text | Customer first name |
| LASTNAME | Text | Customer last name |
| SMS | Text | Mobile phone number |
| TOTAL_ORDERS | Number | Total number of orders |
| TOTAL_SPENT | Number | Total amount spent |
| LAST_EVENT_NAME | Text | Name of last event attended |
| LAST_ORDER_DATE | Date | Date of last purchase |
| CUSTOMER_SEGMENT | Text | new/active/vip/inactive |
| MARKETING_OPT_IN | Boolean | Email marketing consent |
| PREFERRED_VENUE | Text | Most frequently attended venue |
| SOURCE | Text | How customer was acquired |
| CUSTOMER_SINCE | Date | When customer first purchased |

### 5. Import N8N Workflow

1. **Open N8N** at http://localhost:5678
2. **Go to Workflows** → Import
3. **Import** `/root/agents/n8n-workflows/humanitix-brevo-sync.json`
4. **Configure credentials**:
   - Supabase: Your project URL and service key
   - Brevo: Your API key
5. **Update list IDs** in the workflow to match your Brevo lists
6. **Activate** the workflow

### 6. Historical Data Migration

Migrate existing customers to Brevo:

```bash
cd /root/agents
node scripts/migrate-customers-to-brevo.js
```

This will:
- Process all existing customers from ticket sales
- Create contacts in Brevo with proper segmentation
- Assign to appropriate lists
- Generate a detailed migration report

## 📊 Verify Setup

### Check Customer Database
```bash
# Check customers table was created
psql -c "SELECT COUNT(*) FROM customers;"

# Check customer segments
psql -c "SELECT customer_segment, COUNT(*) FROM customers GROUP BY customer_segment;"
```

### Check Brevo Sync Status
```bash
# Check sync status
psql -c "SELECT brevo_sync_status, COUNT(*) FROM customers GROUP BY brevo_sync_status;"
```

### Test Real-time Sync

Trigger the N8N workflow manually:
```bash
curl -X POST http://localhost:5678/webhook/humanitix-brevo-sync \
  -H "Content-Type: application/json" \
  -d '{"trigger": "manual_test"}'
```

## 🔍 Monitoring & Troubleshooting

### Common Issues

#### 1. "IP Address Not Authorized"
- **Solution**: Add `170.64.129.59` to Brevo authorized IPs
- **URL**: https://app.brevo.com/security/authorised_ips

#### 2. "List ID not found"
- **Solution**: Update list IDs in N8N workflow to match your Brevo lists
- **Check**: Brevo dashboard → Contacts → Lists

#### 3. "Custom attribute not found"  
- **Solution**: Create missing attributes in Brevo dashboard
- **Path**: Brevo → Contacts → Settings → Contact attributes

#### 4. Customers not syncing
- **Check**: N8N workflow is active
- **Check**: Database trigger is working
- **Check**: Webhook is receiving data

### Debug Commands

```bash
# Test Brevo connection
node scripts/test-brevo-integration.js

# Check recent webhook logs
psql -c "SELECT * FROM ticket_webhook_logs ORDER BY created_at DESC LIMIT 5;"

# Check sync failures
psql -c "SELECT email, brevo_sync_error FROM customers WHERE brevo_sync_status = 'failed';"

# Manual sync trigger
curl -X POST http://localhost:5678/webhook/humanitix-brevo-sync
```

## 🎯 Expected Results

Once fully set up, you'll have:

### Automatic Customer Flow
```
Humanitix Order → Enhanced Webhook → Customer Database → N8N → Brevo Lists
```

### Customer Segmentation
- **New customers**: Automatically added to "All Customers" list
- **Active customers**: Added to "Active Customers" list  
- **VIP customers**: Added to "VIP Customers" list
- **Inactive customers**: Moved to "Inactive Customers" for re-engagement

### Marketing Capabilities
- **Welcome series** for new customers
- **VIP exclusive** event notifications
- **Re-engagement campaigns** for inactive customers
- **Venue-specific promotions** based on preferences
- **Birthday campaigns** and special offers

### Analytics & Insights
- **Customer lifetime value** tracking
- **Purchase behavior** analysis
- **Event preferences** and venue popularity
- **Marketing campaign performance** metrics

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Review logs** in N8N and database
3. **Test API connection** with the test script
4. **Verify IP whitelisting** in Brevo

---

**Next Step**: Whitelist IP address `170.64.129.59` in Brevo, then run the test script!