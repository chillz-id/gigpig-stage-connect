# Xero Integration Setup Guide

## Prerequisites

1. **Xero Account**: You need a Xero account with appropriate permissions
2. **Xero Developer Account**: Register at https://developer.xero.com/
3. **Xero App**: Create a new app in the Xero Developer portal

## Step 1: Create Xero App

1. Visit https://developer.xero.com/
2. Click "My Apps" → "New App"
3. Fill in the app details:
   - **App Name**: "Stand Up Sydney"
   - **Integration Type**: "Web app"
   - **Company or Application URL**: "https://agents.standupsydney.com"
   - **OAuth 2.0 redirect URI**: "https://agents.standupsydney.com/auth/xero-callback"
   - **Scopes**: Select the following:
     - `accounting.transactions` (Read and write invoices)
     - `accounting.contacts` (Read and write contacts)
     - `accounting.settings` (Read organization settings)
     - `offline_access` (Maintain connection without user presence)

## Step 2: Configure Credentials

After creating the app, you'll receive:
- **Client ID**: Used for OAuth authentication
- **Client Secret**: Used for token exchange

### Environment Variables

Update the following files with your Xero credentials:

#### `/etc/standup-sydney/credentials.env`
```bash
# Xero Integration
XERO_CLIENT_ID=your-client-id-here
XERO_CLIENT_SECRET=your-client-secret-here
```

#### `/root/agents/.env`
```bash
# Xero Integration
XERO_CLIENT_ID=your-client-id-here
XERO_CLIENT_SECRET=your-client-secret-here
VITE_XERO_CLIENT_ID=your-client-id-here
VITE_XERO_CLIENT_SECRET=your-client-secret-here
VITE_XERO_REDIRECT_URI=https://agents.standupsydney.com/auth/xero-callback
```

#### `/root/agents/.mcp.json`
The MCP configuration should automatically pick up the credentials from environment variables.

## Step 3: Database Setup

The database schema is already configured. The following tables support Xero integration:

- `xero_integrations`: Stores OAuth tokens and connection status
- `xero_invoices`: Tracks invoice sync status
- `xero_bills`: Tracks bill sync status
- `xero_webhook_events`: Handles real-time updates from Xero

## Step 4: Testing the Integration

1. **Start the development server**:
   ```bash
   cd /root/agents
   npm run dev
   ```

2. **Navigate to the integration page**:
   - Go to Profile → Invoices tab
   - Click "Connect to Xero"
   - Complete the OAuth flow

3. **Test sync operations**:
   - Create a test invoice
   - Click "Sync to Xero"
   - Verify the invoice appears in Xero

## Step 5: Production Deployment

1. **Update production environment variables**:
   ```bash
   sudo nano /etc/standup-sydney/credentials.env
   ```

2. **Restart the application**:
   ```bash
   sudo systemctl restart standup-sydney
   ```

3. **Test the production integration**:
   - Visit https://agents.standupsydney.com
   - Complete the OAuth flow
   - Test invoice creation and sync

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**:
   - Ensure the redirect URI in Xero matches exactly: `https://agents.standupsydney.com/auth/xero-callback`
   - Check for trailing slashes and protocol (https)

2. **Scope Issues**:
   - Verify all required scopes are selected in the Xero app
   - Re-authorize if scopes were changed

3. **Token Expiration**:
   - Tokens automatically refresh when needed
   - Check `xero_integrations` table for token status

4. **Database Connection**:
   - Verify Supabase connection is working
   - Check RLS policies for Xero tables

### Debugging

1. **Check logs**:
   ```bash
   sudo journalctl -u standup-sydney -f
   ```

2. **Test database connection**:
   ```bash
   cd /root/agents
   npm run test:smoke
   ```

3. **Verify environment variables**:
   ```bash
   cd /root/agents
   node -e "console.log(process.env.VITE_XERO_CLIENT_ID)"
   ```

## Security Considerations

1. **Environment Variables**: Never commit credentials to version control
2. **Token Storage**: Tokens are encrypted in the database
3. **Webhook Verification**: Webhook signatures are verified before processing
4. **Rate Limiting**: API calls are rate-limited to prevent abuse
5. **Scopes**: Only request necessary permissions

## API Endpoints

The integration provides the following key endpoints:

- `GET /auth/xero-callback`: OAuth callback handler
- `POST /api/xero/sync`: Manual sync trigger
- `POST /api/xero/webhook`: Webhook event handler
- `GET /api/xero/status`: Integration status check

## Features Supported

- ✅ **OAuth 2.0 Authentication**: Secure connection to Xero
- ✅ **Invoice Sync**: Two-way invoice synchronization
- ✅ **Contact Management**: Automatic contact creation
- ✅ **Payment Tracking**: Payment status updates
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Token Refresh**: Automatic token renewal
- ✅ **Webhook Support**: Real-time updates from Xero
- ✅ **Multi-tenant**: Support for multiple Xero organizations

## Next Steps

1. Set up Xero webhook endpoint for real-time updates
2. Implement batch payment processing
3. Add reporting and analytics
4. Set up automated reconciliation
5. Configure backup and disaster recovery

For technical support, contact the development team or check the application logs.