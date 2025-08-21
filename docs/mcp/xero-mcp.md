# Xero MCP Server Documentation

## Overview

The Xero MCP server provides integration with Xero's accounting API through the Model Context Protocol, enabling AI assistants to interact with accounting data, invoices, contacts, and financial records.

**Official Repository**: [github.com/XeroAPI/xero-mcp-server](https://github.com/XeroAPI/xero-mcp-server)

## Configuration

In `/root/agents/.mcp.json`:
```json
"xero": {
  "command": "npx",
  "args": [
    "-y",
    "@xeroapi/xero-mcp-server@latest"
  ],
  "env": {
    "XERO_CLIENT_ID": "",
    "XERO_CLIENT_SECRET": ""
  }
}
```

## Available Tools

### Contact Management
- `create_contact`: Create new contact (customer/supplier)
- `get_contact`: Retrieve contact details
- `update_contact`: Update contact information
- `list_contacts`: List all contacts
- `delete_contact`: Delete contact

### Invoice Management
- `create_invoice`: Create new invoice
- `get_invoice`: Retrieve invoice details
- `update_invoice`: Update invoice information
- `list_invoices`: List invoices with filters
- `void_invoice`: Void an invoice
- `send_invoice`: Send invoice to customer

### Payment Operations
- `create_payment`: Record payment
- `get_payment`: Retrieve payment details
- `list_payments`: List payments
- `delete_payment`: Delete payment

### Account Management
- `list_accounts`: List chart of accounts
- `create_account`: Create new account
- `get_account`: Get account details
- `update_account`: Update account information

### Financial Reporting
- `get_balance_sheet`: Generate balance sheet
- `get_profit_loss`: Generate profit & loss report
- `get_trial_balance`: Generate trial balance
- `get_aged_receivables`: Aged receivables report
- `get_aged_payables`: Aged payables report

### Item Management
- `create_item`: Create inventory item
- `get_item`: Retrieve item details
- `update_item`: Update item information
- `list_items`: List all items

## Usage Examples

### Contact Operations
```javascript
// Create new contact
await xero.create_contact({
  Name: "Acme Corporation",
  EmailAddress: "accounts@acme.com",
  ContactType: "CUSTOMER",
  Addresses: [
    {
      AddressType: "STREET",
      AddressLine1: "123 Main St",
      City: "Sydney",
      PostalCode: "2000",
      Country: "Australia"
    }
  ]
});

// Get contact
const contact = await xero.get_contact({
  ContactID: "contact-uuid"
});
```

### Invoice Management
```javascript
// Create invoice
await xero.create_invoice({
  Type: "ACCREC",
  Contact: {
    ContactID: "contact-uuid"
  },
  LineItems: [
    {
      Description: "Consulting Services",
      Quantity: 1,
      UnitAmount: 100.00,
      AccountCode: "200"
    }
  ],
  Date: "2024-01-15",
  DueDate: "2024-02-15"
});

// List invoices
const invoices = await xero.list_invoices({
  where: "Status==\"AUTHORISED\"",
  order: "Date DESC"
});
```

### Payment Processing
```javascript
// Record payment
await xero.create_payment({
  Invoice: {
    InvoiceID: "invoice-uuid"
  },
  Account: {
    Code: "090"
  },
  Amount: 100.00,
  Date: "2024-01-15"
});
```

### Financial Reporting
```javascript
// Get profit & loss
const profitLoss = await xero.get_profit_loss({
  fromDate: "2024-01-01",
  toDate: "2024-01-31"
});

// Get balance sheet
const balanceSheet = await xero.get_balance_sheet({
  date: "2024-01-31"
});
```

## Authentication

The Xero MCP server uses OAuth 2.0 authentication:

### Setting Up OAuth App
1. Go to [Xero Developer Portal](https://developer.xero.com)
2. Create new app
3. Configure OAuth 2.0 settings
4. Get Client ID and Client Secret

### OAuth Flow
1. **Authorization**: Direct user to Xero authorization URL
2. **Token Exchange**: Exchange authorization code for access token
3. **API Access**: Use access token for API requests
4. **Refresh**: Refresh tokens when they expire

### Required Scopes
- `accounting.transactions` - Read/write transactions
- `accounting.contacts` - Read/write contacts
- `accounting.settings` - Read organization settings
- `accounting.reports.read` - Read financial reports

## Common Use Cases

1. **Invoice Automation**: Create and send invoices automatically
2. **Payment Processing**: Record payments and reconcile accounts
3. **Financial Reporting**: Generate reports and analytics
4. **Contact Management**: Sync customer/supplier data
5. **Inventory Management**: Track items and stock levels
6. **Accounting Integration**: Connect with other business systems

## Error Handling

Common errors and solutions:
- **401 Unauthorized**: Check OAuth tokens
- **403 Forbidden**: Verify API permissions/scopes
- **404 Not Found**: Check resource IDs
- **400 Bad Request**: Validate request data
- **429 Rate Limited**: Implement rate limiting

## Rate Limiting

Xero API rate limits:
- **Standard**: 60 requests per minute
- **Burst**: Up to 500 requests per minute
- **Daily**: 5000 requests per day

## Data Validation

Xero has strict validation rules:
- **Decimal Places**: Currency amounts must have 2 decimal places
- **Required Fields**: Ensure all required fields are provided
- **Field Lengths**: Respect maximum field lengths
- **Date Formats**: Use ISO 8601 date format

## Best Practices

1. **Token Management**: Securely store and refresh tokens
2. **Error Handling**: Implement comprehensive error handling
3. **Rate Limiting**: Respect API rate limits
4. **Data Validation**: Validate data before API calls
5. **Webhook Integration**: Use webhooks for real-time updates
6. **Batch Operations**: Process multiple records efficiently

## Supported Endpoints

### Core Accounting
- Contacts, Invoices, Payments
- Credit Notes, Bank Transactions
- Manual Journals, Accounts

### Reporting
- Balance Sheet, Profit & Loss
- Trial Balance, Aged Reports
- Budget Reports, Executive Summary

### Setup
- Organizations, Users, Currencies
- Tax Rates, Tracking Categories
- Items, Brand Themes

## Related Resources

- [Xero API Documentation](https://developer.xero.com/documentation)
- [Xero MCP Server Repository](https://github.com/XeroAPI/xero-mcp-server)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Xero Developer Portal](https://developer.xero.com)