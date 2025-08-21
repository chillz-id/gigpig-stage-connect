# Ticket Sales Integration Setup Complete

## Overview
Successfully created a Notion database for ticket sales tracking and configured the N8N workflow with all necessary environment variables.

## Configuration Details

### Notion Database
- **Database Name**: Ticket Sales Tracker
- **Database ID**: `2304745b-8cbe-81cd-9483-d7acc2377bd6`
- **Database URL**: https://www.notion.so/2304745b8cbe81cd9483d7acc2377bd6
- **Parent Page**: Shows Tracker page

### Database Schema
The database includes the following properties:
- **Event Name** (title) - The name of the event
- **Event Date** (date) - When the event occurs
- **Platform** (select) - Options: Humanitix, Eventbrite, Other
- **Order ID** (rich_text) - Unique order identifier
- **Customer Name** (rich_text) - Customer's full name
- **Customer Email** (email) - Customer's email address
- **Customer Phone** (phone_number) - Customer's phone number
- **Ticket Types** (rich_text) - Types of tickets purchased
- **Quantity** (number) - Number of tickets
- **Amount** (number) - Total amount in dollars
- **Currency** (select) - Options: AUD, USD, EUR, GBP
- **Status** (select) - Options: Paid, Pending, Cancelled, Refunded
- **Purchase Date** (date) - When the purchase was made
- **Venue** (rich_text) - Event venue
- **Last Sync** (date) - Last synchronization timestamp
- **Raw Data** (rich_text) - Original webhook data

### N8N Workflow
- **Workflow Name**: Humanitix to Notion Sync - 2025-07-13
- **Workflow ID**: `GIKrozPgzkjMBbhn`
- **Status**: Active ✅
- **Schedule**: Runs every 15 minutes
- **Workflow URL**: http://localhost:5678/workflow/GIKrozPgzkjMBbhn

### Environment Variables Configured
The following variables have been set in the workflow's staticData:
- `NOTION_DATABASE_ID`: 2304745b-8cbe-81cd-9483-d7acc2377bd6
- `HUMANITIX_API_KEY`: ✅ Configured (from .env file)
- `SLACK_CHANNEL_ID`: (Optional - not set)

## How It Works

1. **Scheduled Sync**: The workflow runs every 15 minutes to check for new orders
2. **Fetch Events**: Gets all events from Humanitix API
3. **Retrieve Orders**: For each event, fetches associated orders
4. **Duplicate Check**: Checks if order already exists in Notion database
5. **Create Entry**: If new, creates entry in Notion with all order details
6. **Optional Notification**: Can send Slack notification if channel ID is configured

## Next Steps

### 1. Test the Integration
You can test the integration by:
- Waiting for the next scheduled run (every 15 minutes)
- Manually triggering the workflow in N8N
- Creating a test order in Humanitix

### 2. Monitor Executions
- Visit http://localhost:5678/workflow/GIKrozPgzkjMBbhn
- Check execution history and logs
- View any errors or warnings

### 3. Configure Slack Notifications (Optional)
To enable Slack notifications:
1. Get your Slack channel ID
2. Update the workflow variable `SLACK_CHANNEL_ID`
3. Ensure the Slack node has proper permissions

### 4. Verify Data Flow
- Check the Notion database for new entries
- Verify all fields are populated correctly
- Ensure no duplicate entries are created

## Troubleshooting

### Common Issues
1. **No data appearing**: Check if the workflow is running and has proper API credentials
2. **Duplicate entries**: Verify the Order ID duplicate check is working
3. **Missing fields**: Check the data transformation in the "Transform Data" node

### API Limits
- Humanitix API: Check rate limits if handling large volumes
- Notion API: Standard rate limits apply (3 requests per second)

## Scripts Created

1. **setup-ticket-sales-integration.py** - Main setup script (used to create database)
2. **update-n8n-workflow.py** - Workflow configuration script

## Security Notes
- Humanitix API key is stored securely in workflow variables
- Notion integration has limited scope to the specific database
- Consider rotating API keys periodically