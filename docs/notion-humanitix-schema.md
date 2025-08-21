# Humanitix Partner Invoicing - Notion Database Schema

## Overview
Comprehensive Notion database schema designed for complete Humanitix data management with partner invoicing requirements. Handles 746 orders across 22 events with complete financial transparency.

## Financial Structure Analysis
- **Total Revenue**: $32,472.86
- **Partner Share**: $24,142.07 (74.3%)
- **Platform Fees**: $4,488.06 (13.8%)
- **Discounts**: $3,380.93 (10.4%)
- **Refunds**: $481.73 (1.5%)

## Database Schema Design

### 1. Primary Table: Ticket Sales (Main Database)

#### Core Transaction Fields
| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| **Order ID** | Title | Primary identifier from Humanitix | Yes |
| **Event** | Relation | Link to Events table | Yes |
| **Customer** | Relation | Link to Customers table | Yes |
| **Partner** | Relation | Link to Partners table | Yes |
| **Transaction Date** | Date | When order was placed | Yes |
| **Transaction Status** | Select | Active, Refunded, Transferred, Cancelled | Yes |

#### Ticket Details
| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| **Ticket Type** | Text | Name of ticket type | Yes |
| **Quantity** | Number | Number of tickets | Yes |
| **Unit Price** | Number | Price per ticket | Yes |
| **Subtotal** | Formula | Quantity × Unit Price | Auto |
| **Package Name** | Text | Package name if applicable | No |
| **Package Price** | Number | Package price if applicable | No |

#### Discount Information
| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| **Discount Code** | Text | Promo code used | No |
| **Discount Type** | Select | Percentage, Fixed, Package | No |
| **Discount Amount** | Number | Total discount applied | No |
| **Discount Percentage** | Number | Discount as percentage | No |

#### Fee Breakdown
| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| **Platform Fee** | Number | Humanitix platform fee | Yes |
| **Booking Fee** | Number | Booking processing fee | Yes |
| **Processing Fee** | Number | Payment processing fee | Yes |
| **Total Fees** | Formula | Sum of all fees | Auto |

#### Financial Calculations
| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| **Gross Revenue** | Formula | Subtotal before discounts | Auto |
| **Net Revenue** | Formula | Gross - Discounts - Fees | Auto |
| **Partner Share** | Formula | Net Revenue × Partner Rate | Auto |
| **Platform Share** | Formula | Total Fees + (Net × Platform Rate) | Auto |

#### Refund Tracking
| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| **Refund Status** | Select | None, Partial, Full | Yes |
| **Refund Amount** | Number | Amount refunded | No |
| **Refund Date** | Date | When refund was processed | No |
| **Refund Reason** | Text | Reason for refund | No |

#### Audit Trail
| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| **Created Date** | Created time | When record was created | Auto |
| **Last Modified** | Last edited time | When record was updated | Auto |
| **Created By** | Created by | Who created record | Auto |
| **Last Modified By** | Last edited by | Who updated record | Auto |
| **Import Batch** | Text | N8N import batch identifier | No |

### 2. Events Table

| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| **Event Name** | Title | Name of the event | Yes |
| **Event Date** | Date | When event occurs | Yes |
| **Event Time** | Text | Start time | Yes |
| **Venue** | Text | Event venue | Yes |
| **Partner** | Relation | Link to Partners table | Yes |
| **Event Status** | Select | Active, Cancelled, Completed | Yes |
| **Total Tickets Sold** | Rollup | Count from Ticket Sales | Auto |
| **Total Revenue** | Rollup | Sum from Ticket Sales | Auto |
| **Partner Revenue** | Rollup | Sum of Partner Share | Auto |
| **Event Description** | Text | Event details | No |

### 3. Customers Table

| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| **Customer Name** | Title | Full name | Yes |
| **Email** | Email | Customer email | Yes |
| **Phone** | Phone | Customer phone | No |
| **Total Orders** | Rollup | Count from Ticket Sales | Auto |
| **Total Spent** | Rollup | Sum from Ticket Sales | Auto |
| **First Purchase** | Rollup | Min date from Ticket Sales | Auto |
| **Last Purchase** | Rollup | Max date from Ticket Sales | Auto |
| **Customer Status** | Select | Active, Inactive | Yes |

### 4. Partners Table

| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| **Partner Name** | Title | Partner/Promoter name | Yes |
| **Contact Email** | Email | Partner contact email | Yes |
| **Contact Phone** | Phone | Partner contact phone | No |
| **Revenue Share Rate** | Number | Partner's revenue share (0.743) | Yes |
| **Total Events** | Rollup | Count from Events | Auto |
| **Total Revenue** | Rollup | Sum from Ticket Sales | Auto |
| **Partner Share Total** | Rollup | Sum of Partner Share | Auto |
| **Payment Method** | Select | Bank Transfer, PayPal, Check | Yes |
| **Tax ID** | Text | Partner's tax identification | No |

### 5. Ticket Types Table

| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| **Ticket Type Name** | Title | Name of ticket type | Yes |
| **Event** | Relation | Link to Events table | Yes |
| **Base Price** | Number | Standard price | Yes |
| **Quantity Available** | Number | Total tickets available | Yes |
| **Quantity Sold** | Rollup | Count from Ticket Sales | Auto |
| **Revenue Generated** | Rollup | Sum from Ticket Sales | Auto |
| **Ticket Description** | Text | Ticket details | No |

## Database Views Configuration

### 1. Partner Revenue Dashboard
**Filter**: Group by Partner
**Properties**: Partner Name, Total Revenue, Partner Share Total, Event Count
**Sort**: Partner Share Total (Descending)

### 2. Event Financial Summary
**Filter**: Group by Event
**Properties**: Event Name, Date, Total Revenue, Partner Revenue, Platform Fees
**Sort**: Event Date (Descending)

### 3. Monthly Revenue Report
**Filter**: Group by Month (Transaction Date)
**Properties**: Month, Total Revenue, Partner Share, Platform Fees, Discount Amount
**Sort**: Month (Descending)

### 4. Customer Purchase History
**Filter**: Group by Customer
**Properties**: Customer Name, Email, Total Orders, Total Spent, Last Purchase
**Sort**: Total Spent (Descending)

### 5. Refund Tracking
**Filter**: Refund Status ≠ None
**Properties**: Order ID, Customer, Event, Refund Amount, Refund Date, Refund Reason
**Sort**: Refund Date (Descending)

### 6. Partner Invoice View
**Filter**: Partner = [Selected Partner] AND Transaction Status = Active
**Properties**: Order ID, Event, Customer, Ticket Type, Quantity, Partner Share, Transaction Date
**Sort**: Transaction Date (Descending)

## Automated Formulas

### 1. Financial Calculations
```
Gross Revenue = Quantity × Unit Price
Net Revenue = Gross Revenue - Discount Amount - Total Fees
Partner Share = Net Revenue × Partner Share Rate
Platform Share = Total Fees + (Net Revenue × (1 - Partner Share Rate))
```

### 2. Summary Rollups
```
Event Total Revenue = sum(prop("Net Revenue"))
Partner Total Share = sum(prop("Partner Share"))
Customer Total Spent = sum(prop("Net Revenue"))
```

### 3. Status Calculations
```
Refund Status = if(prop("Refund Amount") > 0, "Refunded", "None")
Transaction Status = if(prop("Refund Status") == "Refunded", "Refunded", "Active")
```

## Data Validation Rules

### 1. Required Field Validation
- Order ID must be unique and not empty
- Event must be linked to valid event
- Customer must be linked to valid customer
- Quantity must be > 0
- Unit Price must be > 0

### 2. Financial Validation
- Discount Amount cannot exceed Gross Revenue
- Refund Amount cannot exceed Net Revenue
- Partner Share Rate must be between 0 and 1
- All monetary values must be ≥ 0

### 3. Date Validation
- Transaction Date cannot be in the future
- Refund Date cannot be before Transaction Date
- Event Date should be after Transaction Date

## Import/Export Specifications

### 1. N8N Import Format
```json
{
  "order_id": "string",
  "event_id": "string",
  "customer_email": "string",
  "ticket_type": "string",
  "quantity": "number",
  "unit_price": "number",
  "discount_code": "string",
  "discount_amount": "number",
  "platform_fee": "number",
  "booking_fee": "number",
  "processing_fee": "number",
  "transaction_date": "ISO date",
  "refund_amount": "number",
  "refund_date": "ISO date"
}
```

### 2. Partner Invoice Export
```csv
Order ID,Event Name,Customer Name,Ticket Type,Quantity,Unit Price,Discount,Partner Share,Date
```

### 3. Financial Summary Export
```csv
Partner,Month,Total Revenue,Partner Share,Platform Fees,Discount Amount,Net Revenue
```

## Security & Access Control

### 1. Partner Access
- Partners can only view their own events and revenue
- Read-only access to customer information
- Cannot modify financial calculations

### 2. Admin Access
- Full access to all data
- Can modify partner rates and fees
- Can process refunds and adjustments

### 3. Data Integrity
- Audit trail for all changes
- Backup before bulk imports
- Version control for schema changes

## Reporting Templates

### 1. Partner Monthly Invoice
- Partner details and contact information
- Event-by-event breakdown
- Customer purchase details
- Fee calculations and net revenue
- Total partner share amount

### 2. Financial Dashboard
- Total revenue across all partners
- Revenue share breakdown
- Platform fee analysis
- Discount usage statistics
- Refund tracking

### 3. Customer Analytics
- Purchase patterns and frequency
- Average order value
- Customer lifetime value
- Repeat purchase rate

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Create all tables with properties
- [ ] Set up relationships between tables
- [ ] Configure formulas and rollups
- [ ] Create initial views

### Phase 2: Data Import
- [ ] Test N8N import workflow
- [ ] Validate data integrity
- [ ] Set up automated imports
- [ ] Configure error handling

### Phase 3: Partner Views
- [ ] Create partner-specific views
- [ ] Set up access permissions
- [ ] Configure invoice templates
- [ ] Test export functionality

### Phase 4: Reporting
- [ ] Create dashboard views
- [ ] Set up automated reports
- [ ] Configure alerts and notifications
- [ ] Train users on system

## Maintenance & Updates

### 1. Regular Tasks
- Weekly data imports from N8N
- Monthly partner invoice generation
- Quarterly financial reporting
- Annual schema review

### 2. Monitoring
- Data quality checks
- Import error monitoring
- Performance optimization
- User feedback integration

This comprehensive schema handles all 746 orders across 22 events with complete financial transparency for partners, ensuring accurate revenue sharing and comprehensive audit trails.