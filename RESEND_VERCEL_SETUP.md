# Resend Email Service - Vercel Configuration

## Environment Variables to Add

The following environment variables need to be added to Vercel for the email service to work in production:

### 1. RESEND_API_KEY
- **Value:** `re_dkLktbsg_7nvvNhZB3QxumBEPDSU5oKaG`
- **Environment:** Production, Preview, Development
- **Description:** Resend API key for sending transactional emails

### 2. VITE_RESEND_API_KEY
- **Value:** `re_dkLktbsg_7nvvNhZB3QxumBEPDSU5oKaG`
- **Environment:** Production, Preview, Development
- **Description:** Client-accessible Resend API key (prefixed with VITE_ for Vite)

### 3. VITE_RESEND_FROM_EMAIL
- **Value:** `noreply@gigpigs.app`
- **Environment:** Production, Preview, Development
- **Description:** Default "from" email address for all transactional emails

## How to Add to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project: **stand-up-sydney** or **gigpigs**
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable:
   - Click **Add New**
   - Enter the variable name (e.g., `RESEND_API_KEY`)
   - Paste the value
   - Select environments: Production, Preview, Development
   - Click **Save**
5. Repeat for all 3 variables
6. **Redeploy** the application for changes to take effect

### Option 2: Vercel CLI (if linked)

```bash
cd /root/agents

# Add RESEND_API_KEY
echo "re_dkLktbsg_7nvvNhZB3QxumBEPDSU5oKaG" | vercel env add RESEND_API_KEY production
echo "re_dkLktbsg_7nvvNhZB3QxumBEPDSU5oKaG" | vercel env add RESEND_API_KEY preview
echo "re_dkLktbsg_7nvvNhZB3QxumBEPDSU5oKaG" | vercel env add RESEND_API_KEY development

# Add VITE_RESEND_API_KEY
echo "re_dkLktbsg_7nvvNhZB3QxumBEPDSU5oKaG" | vercel env add VITE_RESEND_API_KEY production
echo "re_dkLktbsg_7nvvNhZB3QxumBEPDSU5oKaG" | vercel env add VITE_RESEND_API_KEY preview
echo "re_dkLktbsg_7nvvNhZB3QxumBEPDSU5oKaG" | vercel env add VITE_RESEND_API_KEY development

# Add VITE_RESEND_FROM_EMAIL
echo "noreply@gigpigs.app" | vercel env add VITE_RESEND_FROM_EMAIL production
echo "noreply@gigpigs.app" | vercel env add VITE_RESEND_FROM_EMAIL preview
echo "noreply@gigpigs.app" | vercel env add VITE_RESEND_FROM_EMAIL development
```

## Domain Verification Required

Before emails can be sent, you need to verify your domain in Resend:

1. Go to https://resend.com/domains
2. Click **Add Domain**
3. Enter: `gigpigs.app`
4. Add the DNS records provided by Resend to your DNS provider:
   - **TXT record** for domain verification
   - **DKIM record** for email authentication
   - **SPF record** for sender verification
5. Wait for verification (usually < 5 minutes)

### DNS Records to Add

Resend will provide specific DNS records. They typically look like:

```
TXT  @  resend._domainkey=YOUR_VERIFICATION_CODE
TXT  @  v=spf1 include:_spf.resend.com ~all
```

**Where to add these:**
- If using Vercel DNS: https://vercel.com/dashboard → Domains
- If using Cloudflare: Cloudflare dashboard → DNS
- If using other DNS provider: Their DNS management interface

## Testing Email Service

Once environment variables are added and domain is verified:

1. **Test Signup Flow:**
   - Go to https://stand-up-sydney.vercel.app/auth
   - Click "Sign Up"
   - Create a test account
   - Check if welcome email is received

2. **Check Resend Logs:**
   - Go to https://resend.com/logs
   - View delivery status of sent emails
   - Check for any errors or bounces

3. **Monitor in Console:**
   - Open browser DevTools
   - Check for any email service errors
   - Verify email sending doesn't block signup

## Current Status

✅ **Local Development:** Configured
- `.env` file updated with Resend credentials
- `/etc/standup-sydney/credentials.env` updated for persistence

⚠️ **Production (Vercel):** Needs Configuration
- Environment variables need to be added via Vercel dashboard
- Domain `gigpigs.app` needs verification in Resend

⚠️ **Domain Verification:** Pending
- Domain needs DNS records added
- Wait for Resend verification

## Related Documentation

- [Resend Email Setup Guide](./docs/RESEND_EMAIL_SETUP.md) - Comprehensive implementation guide
- [Email Service Code](./src/services/emailService.ts) - TypeScript implementation
- [Auth Flow](./src/pages/Auth.tsx) - Signup integration

## Support

For issues:
1. Check Resend dashboard logs: https://resend.com/logs
2. Review browser console for errors
3. Verify environment variables are set in Vercel
4. Ensure domain is verified in Resend
