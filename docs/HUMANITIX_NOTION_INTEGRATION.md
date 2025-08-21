# Humanitix to Notion Integration

This document describes the N8N workflow that automatically syncs ticket sales data from Humanitix API to a Notion database for tracking and analytics.

## Overview

The integration provides:
- Automated polling of Humanitix API every 15 minutes
- Real-time ticket sales tracking in Notion
- Duplicate prevention and error handling
- Historical data import capabilities
- Daily sales reporting

## Prerequisites

### API Keys Required
- ✅ **Humanitix API Key**: Already configured in `.env`
- ✅ **Notion Integration Token**: Already configured in `.env`
- ✅ **N8N Instance**: Running at http://170.64.252.55:5678

### Notion Database Setup

Create a new Notion database called **"Ticket Sales Tracker"** with these properties:

| Property Name | Type | Description | Options |
|---------------|------|-------------|---------|
| **Event Name** | Title | Name of the event | - |
| **Event Date** | Date | When the event occurs | - |
| **Platform** | Select | Source platform | Humanitix |
| **Order ID** | Text | Unique order identifier | - |
| **Customer Name** | Text | Full customer name | - |
| **Customer Email** | Email | Customer contact email | - |
| **Customer Phone** | Phone | Customer phone number | - |
| **Ticket Types** | Text | Types of tickets purchased | - |
| **Quantity** | Number | Total number of tickets | - |
| **Amount** | Number | Total amount paid | - |
| **Currency** | Select | Currency used | AUD, USD, EUR, GBP |
| **Status** | Select | Order status | Paid, Pending, Cancelled, Refunded |
| **Purchase Date** | Date | When order was placed | - |
| **Venue** | Text | Event venue name | - |
| **Last Sync** | Date | When record was last synced | - |
| **Raw Data** | Text | Complete webhook payload | - |

### Database Views (Recommended)

Create these views for better organization:

1. **Recent Sales** - Filter by Last Sync in last 7 days
2. **By Event** - Group by Event Name
3. **By Status** - Group by Status
4. **This Month** - Filter by Purchase Date in current month
5. **Revenue Summary** - Sum Amount, group by Event Name

## N8N Workflow Configuration

### Main Workflow: "Humanitix to Notion Sync"

#### Node Configuration

**1. Schedule Trigger**
```json
{
  "triggerInterval": "00:15",
  "timezone": "Australia/Sydney"
}
```

**2. HTTP Request - Get Events**
```json
{
  "method": "GET",
  "url": "https://api.humanitix.com/v1/events",
  "headers": {
    "X-API-Key": "{{$env.HUMANITIX_API_KEY}}",
    "Content-Type": "application/json"
  },
  "qs": {
    "status": "published",
    "page": "1"
  }
}
```

**3. HTTP Request - Get Orders per Event**
```json
{
  "method": "GET", 
  "url": "https://api.humanitix.com/v1/events/{{$json.id}}/orders",
  "headers": {
    "X-API-Key": "{{$env.HUMANITIX_API_KEY}}",
    "Content-Type": "application/json"
  },
  "qs": {
    "updated_since": "{{$node['Get Last Sync'].json.timestamp}}",
    "page": "1",
    "status": "all"
  }
}
```

**4. Function Node - Transform Data**
```javascript
// Transform Humanitix order data to Notion format
const orders = $input.all();
const transformedOrders = [];

for (const orderBatch of orders) {
  if (orderBatch.json.data && orderBatch.json.data.length > 0) {
    for (const order of orderBatch.json.data) {
      // Extract ticket types and total quantity
      const ticketTypes = order.tickets?.map(t => t.ticketType?.name || 'General').join(', ') || 'General';
      const totalQuantity = order.tickets?.reduce((sum, t) => sum + (t.quantity || 1), 0) || 1;
      
      transformedOrders.push({
        json: {
          parent: { database_id: "{{$env.NOTION_DATABASE_ID}}" },
          properties: {
            "Event Name": {
              title: [{ text: { content: order.event?.name || 'Unknown Event' } }]
            },
            "Event Date": {
              date: order.event?.startDate ? { start: order.event.startDate } : null
            },
            "Platform": {
              select: { name: "Humanitix" }
            },
            "Order ID": {
              rich_text: [{ text: { content: order.id || 'N/A' } }]
            },
            "Customer Name": {
              rich_text: [{ text: { content: `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'N/A' } }]
            },
            "Customer Email": {
              email: order.email || null
            },
            "Customer Phone": {
              phone_number: order.phone || null
            },
            "Ticket Types": {
              rich_text: [{ text: { content: ticketTypes } }]
            },
            "Quantity": {
              number: totalQuantity
            },
            "Amount": {
              number: parseFloat(order.total || 0)
            },
            "Currency": {
              select: { name: order.currency || "AUD" }
            },
            "Status": {
              select: { name: order.status || "unknown" }
            },
            "Purchase Date": {
              date: order.createdAt ? { start: order.createdAt } : null
            },
            "Venue": {
              rich_text: [{ text: { content: order.event?.venue?.name || 'TBD' } }]
            },
            "Last Sync": {
              date: { start: new Date().toISOString() }
            },
            "Raw Data": {
              rich_text: [{ text: { content: JSON.stringify(order, null, 2) } }]
            }
          }
        }
      });
    }
  }
}

return transformedOrders;
```

**5. Notion - Query Database (Check Duplicates)**
```json
{
  "database_id": "{{$env.NOTION_DATABASE_ID}}",
  "filter": {
    "property": "Order ID",
    "rich_text": {
      "equals": "{{$json.properties['Order ID'].rich_text[0].text.content}}"
    }
  }
}
```

**6. IF Node - Skip if Exists**
```json
{
  "conditions": {
    "string": [
      {
        "value1": "{{$json.results.length}}",
        "operation": "equal",
        "value2": "0"
      }
    ]
  }
}
```

**7. Notion - Create Database Item**
```json
{
  "resource": "databaseItem",
  "operation": "create",
  "databaseId": "{{$env.NOTION_DATABASE_ID}}",
  "properties": "{{$json.properties}}"
}
```

## Environment Variables

Add to your N8N environment or workflow settings:

```bash
HUMANITIX_API_KEY=9f23a99810087538c62feb645c45d195ab966d38533cd6456a4c7092f6ae679fd4515936e5b9869c261dc83721626a46c7328dd22bf6acd567646897ecf4c8c7b4f8b24a1b0dbab2fd952a8c25dd7a3b3f5542f0121c63e6616322eb128741bfbd9322b94c5a46acbe3cc9add71ec2
NOTION_TOKEN=ntn_YOUR_NOTION_API_KEY_HERE_CONTACT_OWNER
NOTION_DATABASE_ID=your-notion-database-id
```

## Supporting Workflows

### Daily Sales Summary
**Schedule**: Daily at 9:00 AM
**Purpose**: Send daily sales summary to Slack/email

### Historical Data Import
**Trigger**: Manual
**Purpose**: Import historical orders from Humanitix
**Parameters**: Start date, end date

### Error Recovery
**Trigger**: Manual
**Purpose**: Retry failed API calls and sync missed data

## Testing

### 1. Test Humanitix API Connection
```bash
curl -H "X-API-Key: $HUMANITIX_API_KEY" \
     https://api.humanitix.com/v1/events?page=1
```

### 2. Test Notion Database Creation
Create a test entry manually to verify database structure.

### 3. Test N8N Workflow
- Start with manual trigger
- Test with small date range
- Verify data appears in Notion correctly
- Check duplicate prevention

## Monitoring

### Key Metrics to Track
- API call success rate
- Number of orders synced per run
- Duplicate detection rate
- Error frequency
- Sync latency

### Common Errors
- **401 Unauthorized**: Check Humanitix API key
- **429 Rate Limited**: Reduce polling frequency
- **404 Not Found**: Verify Notion database ID
- **Validation Error**: Check Notion property types

## API Rate Limits

### Humanitix API Limits
- Check your plan's limits in Humanitix dashboard
- Implement exponential backoff for rate limit errors
- Consider caching event data to reduce API calls

### Notion API Limits
- 3 requests per second
- Built-in retry logic for rate limits

## Data Flow

1. **Scheduled Trigger** → Starts workflow every 15 minutes
2. **Get Events** → Fetch active events from Humanitix
3. **Get Orders** → Fetch orders for each event (since last sync)
4. **Transform Data** → Convert to Notion format
5. **Check Duplicates** → Query Notion for existing order IDs
6. **Create Entries** → Add new orders to Notion database
7. **Update Timestamp** → Store last successful sync time

## Security Considerations

1. **API Keys**: Stored securely in environment variables
2. **Data Privacy**: Customer data handled according to privacy laws
3. **Access Control**: Notion database permissions properly configured
4. **Audit Trail**: Complete raw data stored for debugging

## Future Enhancements

- [ ] Real-time webhook support (if Humanitix adds webhooks)
- [ ] Advanced analytics dashboard in Notion
- [ ] Integration with other ticketing platforms
- [ ] Automated refund processing
- [ ] Customer segmentation and insights
- [ ] Revenue forecasting

## Troubleshooting

### Workflow Not Running
1. Check N8N instance is active
2. Verify schedule trigger configuration
3. Check workflow activation status

### No Data Appearing
1. Verify Humanitix API key permissions
2. Check event date ranges
3. Confirm Notion database ID is correct

### Duplicate Entries
1. Check duplicate detection logic
2. Verify Order ID uniqueness
3. Review transformation function

### API Errors
1. Check API key validity
2. Review rate limiting
3. Verify endpoint URLs

## Support

For issues with this integration:
1. Check N8N workflow execution logs
2. Review Humanitix API documentation
3. Verify Notion database configuration
4. Test individual nodes in isolation