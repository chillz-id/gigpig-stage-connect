# Xero Integration Setup Instructions

## 1. Create Xero App

1. Go to https://developer.xero.com/
2. Sign in or create a developer account
3. Click "New app" 
4. Fill in the details:
   - App name: Stand Up Sydney
   - Company or application URL: https://standupSydney.com
   - OAuth 2.0 redirect URI: 
     - Development: `http://localhost:8080/auth/xero-callback`
     - Production: `https://yourdomain.com/auth/xero-callback`
5. Select scopes:
   - `accounting.transactions`
   - `accounting.contacts`
   - `accounting.settings`
   - `offline_access`

## 2. Get Credentials

After creating the app, you'll receive:
- Client ID: (copy this)
- Client Secret: (copy this - only shown once!)

## 3. Add to Supabase Environment

### Option A: Supabase Dashboard
1. Go to your Supabase project
2. Settings → Edge Functions → Secrets
3. Add:
   - `XERO_CLIENT_ID` = your_client_id
   - `XERO_CLIENT_SECRET` = your_client_secret

### Option B: Local Development
Create `.env.local` in `/root/agents/`:
```env
VITE_XERO_CLIENT_ID=your_client_id
VITE_XERO_CLIENT_SECRET=your_client_secret
```

## 4. Configure Webhooks (Optional but Recommended)

In Xero developer dashboard:
1. Go to your app → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/xero`
3. Select events:
   - Invoice.Create
   - Invoice.Update
   - Payment.Create
   - Contact.Create

## 5. Test the Integration

1. Go to Admin Dashboard → Financial → Xero Integration
2. Click "Connect to Xero"
3. Authorize the app
4. Test by creating an invoice

## Important Notes

- **Client Secret Security**: Never commit the client secret to git
- **Token Storage**: Tokens are encrypted in Supabase
- **Rate Limits**: Xero has API rate limits (5000 calls/day)
- **Sandbox**: Use Xero demo company for testing

## Troubleshooting

If connection fails:
1. Check redirect URI matches exactly
2. Verify scopes are correct
3. Ensure client ID/secret are set
4. Check browser console for errors

## Production Deployment

For production:
1. Update redirect URI in Xero app
2. Set environment variables in production
3. Enable webhooks for real-time sync
4. Monitor API usage in Xero dashboard