# Humanitix Notion Database Setup Guide

## Overview

This guide provides step-by-step instructions for setting up and using the comprehensive Notion database system for Humanitix partner invoicing and revenue management.

## Prerequisites

- Notion account with API access
- Node.js 18+ installed
- Environment variables configured
- N8N workflow data available

## Database Schema Summary

The system creates 5 interconnected databases:

1. **Ticket Sales** (Main) - All transaction records
2. **Partners** - Partner/promoter information
3. **Events** - Event details and performance
4. **Customers** - Customer information and purchase history
5. **Ticket Types** - Ticket type definitions and sales

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file with the following variables:

```env
# Notion Configuration
NOTION_TOKEN=your_notion_integration_token
NOTION_PARENT_PAGE_ID=your_parent_page_id

# Database IDs (set after creation)
PARTNERS_DB_ID=
EVENTS_DB_ID=
CUSTOMERS_DB_ID=
TICKET_TYPES_DB_ID=
TICKET_SALES_DB_ID=

# N8N Configuration
N8N_API_KEY=your_n8n_api_key
N8N_API_URL=http://localhost:5678/api/v1
```

### 2. Notion Integration Setup

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the integration token to `NOTION_TOKEN`
4. Create a parent page in Notion for your databases
5. Share the parent page with your integration
6. Copy the parent page ID to `NOTION_PARENT_PAGE_ID`

### 3. Database Creation

Run the database creation script:

```bash
cd /root/agents/scripts
node create-notion-humanitix-database.js
```

This will create all 5 databases with proper relationships and formulas.

### 4. Update Environment Variables

After database creation, update your `.env` file with the generated database IDs:

```env
PARTNERS_DB_ID=abc123def456...
EVENTS_DB_ID=def456ghi789...
CUSTOMERS_DB_ID=ghi789jkl012...
TICKET_TYPES_DB_ID=jkl012mno345...
TICKET_SALES_DB_ID=mno345pqr678...
```

### 5. Create Database Views

Run the views configuration script:

```bash
node create-notion-views.js
```

This will output instructions for manually creating the following views:

#### Ticket Sales Views
- **Partner Revenue Dashboard** - Active transactions by partner
- **Event Financial Summary** - Revenue breakdown by event
- **Monthly Revenue Report** - Time-based revenue analysis
- **Refund Tracking** - All refunded transactions
- **High Value Orders** - Orders over $100

#### Events Views
- **Event Performance** - Revenue and ticket sales by event
- **Upcoming Events** - Future events with active status
- **Completed Events** - Past events with final revenue

#### Customers Views
- **Top Customers** - Highest spending customers
- **Recent Customers** - New customers by signup date
- **Frequent Customers** - Customers with 3+ orders

#### Partners Views
- **Partner Dashboard** - Overview of all partners
- **Partner Performance** - Revenue performance metrics

### 6. Data Import

Import data from N8N workflow or JSON file:

```bash
# Import from N8N workflow
node import-humanitix-to-notion.js n8n workflow-id

# Import from JSON file
node import-humanitix-to-notion.js file path/to/data.json

# Import sample data for testing
node import-humanitix-to-notion.js sample
```

## Usage Instructions

### Partner Invoice Generation

Generate invoices for specific partners:

```bash
# Generate invoice for specific partner
node generate-partner-invoices.js [partner-id] 2024-01-01 2024-01-31

# Generate invoices for all partners
node generate-partner-invoices.js 2024-01-01 2024-01-31
```

Output formats:
- **HTML** - Formatted invoice for viewing/printing
- **CSV** - Data export for accounting systems
- **JSON** - Raw data for API integration

### Data Management

#### Regular Data Import
Set up automated imports from N8N:

```bash
# Weekly import script
#!/bin/bash
cd /root/agents/scripts
node import-humanitix-to-notion.js n8n latest-workflow-id
```

#### Data Validation
Validate imported data:

```bash
# Check data integrity
node validate-notion-data.js

# Fix common issues
node fix-notion-data.js
```

### Reporting

#### Monthly Partner Reports
Generate comprehensive monthly reports:

```bash
# Generate monthly report for January 2024
node generate-partner-invoices.js 2024-01-01 2024-01-31 ./reports/2024-01
```

#### Financial Summary
Get financial overview:

```bash
# Get financial summary for date range
node financial-summary.js 2024-01-01 2024-01-31
```

## Database Structure Details

### Ticket Sales Database (Main)

**Core Transaction Fields:**
- Order ID (Title) - Primary identifier
- Event (Relation) - Links to Events database
- Customer (Relation) - Links to Customers database
- Partner (Relation) - Links to Partners database
- Transaction Date (Date) - When order was placed
- Transaction Status (Select) - Active/Refunded/Transferred/Cancelled

**Financial Fields:**
- Ticket Type (Text) - Type of ticket sold
- Quantity (Number) - Number of tickets
- Unit Price (Number) - Price per ticket
- Subtotal (Formula) - Quantity × Unit Price
- Discount Amount (Number) - Total discount applied
- Platform Fee (Number) - Humanitix platform fee
- Booking Fee (Number) - Booking processing fee
- Processing Fee (Number) - Payment processing fee
- Net Revenue (Formula) - Gross - Discounts - Fees
- Partner Share (Formula) - Net Revenue × 0.743
- Platform Share (Formula) - Total Fees + (Net × 0.257)

### Partners Database

**Partner Information:**
- Partner Name (Title) - Name of partner/promoter
- Contact Email (Email) - Primary contact
- Contact Phone (Phone) - Contact number
- Revenue Share Rate (Number) - Percentage (default 74.3%)
- Payment Method (Select) - Bank Transfer/PayPal/Check
- Tax ID (Text) - Tax identification number

**Calculated Fields:**
- Total Events (Rollup) - Count of events
- Total Revenue (Rollup) - Sum of net revenue
- Partner Share Total (Rollup) - Sum of partner share

### Events Database

**Event Information:**
- Event Name (Title) - Name of the event
- Event Date (Date) - When event occurs
- Event Time (Text) - Start time
- Venue (Text) - Event location
- Partner (Relation) - Links to Partners database
- Event Status (Select) - Active/Cancelled/Completed

**Performance Metrics:**
- Total Tickets Sold (Rollup) - Sum of quantities
- Total Revenue (Rollup) - Sum of net revenue
- Partner Revenue (Rollup) - Sum of partner share

### Customers Database

**Customer Information:**
- Customer Name (Title) - Full name
- Email (Email) - Customer email
- Phone (Phone) - Contact number
- Customer Status (Select) - Active/Inactive

**Purchase History:**
- Total Orders (Rollup) - Count of orders
- Total Spent (Rollup) - Sum of net revenue
- First Purchase (Rollup) - Earliest transaction date
- Last Purchase (Rollup) - Latest transaction date

## Financial Calculations

### Revenue Sharing Model

Based on the financial analysis of 746 orders:

- **Partner Share**: 74.3% of net revenue
- **Platform Share**: 25.7% of net revenue + all fees
- **Total Revenue**: $32,472.86
- **Partner Share**: $24,142.07
- **Platform Fees**: $4,488.06
- **Discounts**: $3,380.93
- **Refunds**: $481.73

### Formula Calculations

```javascript
// Core formulas used in the database
Gross Revenue = Quantity × Unit Price
Net Revenue = Gross Revenue - Discount Amount - Total Fees
Partner Share = Net Revenue × 0.743
Platform Share = Total Fees + (Net Revenue × 0.257)
Total Fees = Platform Fee + Booking Fee + Processing Fee
```

## Partner Invoice Template

Each partner invoice includes:

### Header Section
- Invoice number (auto-generated)
- Invoice date
- Partner information
- Revenue share percentage
- Invoice period

### Event Details
- Event name, date, and venue
- Individual ticket sales
- Customer information
- Discount codes and amounts
- Fee breakdown
- Net revenue calculation

### Financial Summary
- Total tickets sold
- Gross revenue
- Total discounts
- Platform fees
- Net revenue
- Final partner share amount

### Payment Information
- Payment method
- Payment terms
- Contact information

## Automation & Integration

### N8N Integration

The system integrates with N8N workflows to:
- Extract data from Humanitix API
- Transform data into Notion format
- Import data automatically
- Generate import reports
- Handle error cases

### Automated Reporting

Set up automated reporting with:
- Daily sales imports
- Weekly partner updates
- Monthly invoice generation
- Quarterly financial summaries
- Annual partner reports

## Troubleshooting

### Common Issues

1. **Database Creation Fails**
   - Check Notion token permissions
   - Verify parent page access
   - Ensure integration is shared with page

2. **Data Import Errors**
   - Validate JSON format
   - Check database ID environment variables
   - Verify rate limits aren't exceeded

3. **Invoice Generation Problems**
   - Ensure all database IDs are set
   - Check partner and event relationships
   - Verify date range format

4. **Formula Calculations Wrong**
   - Check property names match exactly
   - Verify number formatting
   - Ensure relationships are properly set

### Error Resolution

```bash
# Check database structure
node validate-notion-structure.js

# Fix broken relationships
node fix-notion-relationships.js

# Regenerate formulas
node update-notion-formulas.js

# Clean up duplicate records
node clean-notion-duplicates.js
```

## Best Practices

### Data Management
- Import data regularly (daily/weekly)
- Validate data integrity after imports
- Backup database before major changes
- Monitor for duplicate records

### Invoice Generation
- Generate invoices monthly
- Archive old invoices
- Maintain consistent naming conventions
- Verify calculations before sending

### Security
- Limit Notion integration permissions
- Use environment variables for secrets
- Rotate API keys regularly
- Monitor access logs

### Performance
- Batch database operations
- Use proper rate limiting
- Cache frequently accessed data
- Optimize query filters

## Support & Maintenance

### Regular Tasks
- [ ] Weekly data imports
- [ ] Monthly partner invoice generation
- [ ] Quarterly financial reporting
- [ ] Annual schema review

### Monitoring
- [ ] Data quality checks
- [ ] Import error tracking
- [ ] Performance monitoring
- [ ] User feedback collection

### Updates
- [ ] Schema version control
- [ ] Formula updates
- [ ] View configuration changes
- [ ] Integration improvements

## Conclusion

This comprehensive Notion database system provides complete visibility into Humanitix partner revenue sharing, enabling:

- Automated data collection and processing
- Detailed financial reporting
- Professional invoice generation
- Real-time performance tracking
- Transparent partner relationships

The system handles all 746 orders across 22 events with complete financial accuracy and audit trails, ensuring partners receive accurate and timely revenue sharing reports.