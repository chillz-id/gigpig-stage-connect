# Resend Email Service Setup Guide

## Overview

Stand Up Sydney uses [Resend](https://resend.com) for transactional email delivery. This document explains how to configure and use the email service.

## Current Status

**✅ Email Service Implemented**
- Resend package installed (`npm install resend`)
- Email service created at `src/services/emailService.ts`
- Auth flow updated to send welcome emails on signup
- UI messaging updated to clarify immediate access (no email confirmation required)

**⚠️ Configuration Required**
- Resend API key needs to be added to environment variables
- From email domain needs to be verified in Resend dashboard

## Quick Setup

### 1. Get Resend API Key

1. Go to [resend.com](https://resend.com) and sign up/sign in
2. Navigate to **API Keys** in the dashboard
3. Click **Create API Key**
4. Name it (e.g., "Stand Up Sydney Production")
5. Copy the API key (starts with `re_`)

### 2. Verify Your Domain

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `standupsydney.com` or `gigpigs.app`)
4. Add the required DNS records to your domain provider
5. Wait for verification (usually < 5 minutes)

**Recommended Domain Setup:**
- Use a subdomain for emails: `mail.standupsydney.com`
- Or use a dedicated email domain: `gigpigs.app`

### 3. Configure Environment Variables

Add to your `.env` file:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_your_actual_api_key_here
VITE_RESEND_FROM_EMAIL=team@gigpigs.app
```

**Important:** Replace values with your actual Resend API key and verified email address.

### 4. Deploy to Vercel

Add environment variables to Vercel:

```bash
vercel env add RESEND_API_KEY production
# Paste your API key when prompted

vercel env add VITE_RESEND_FROM_EMAIL production
# Enter: team@gigpigs.app
```

Or use the Vercel dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add both `RESEND_API_KEY` and `VITE_RESEND_FROM_EMAIL`
4. Redeploy the application

## Email Templates

### 1. Welcome Email (Comedians)

**Trigger:** New user signs up
**Template:** `emailService.sendComedianWelcome()`

**Features:**
- Branded header with gradient background
- Onboarding checklist
- Dashboard link button
- Professional design with responsive layout

### 2. Email Confirmation (Future Use)

**Trigger:** Manual email confirmation flows
**Template:** `emailService.sendEmailConfirmation()`

**Note:** Currently not used since Supabase is configured for auto-confirmation. Can be enabled later if needed.

### 3. Gig Confirmation

**Trigger:** Comedian spot is confirmed by promoter
**Template:** `emailService.sendGigConfirmation()`

**Features:**
- Event details (name, venue, date, time)
- Spot duration
- Performer reminders
- Link to gig management dashboard

## Usage Examples

### Send Welcome Email

```typescript
import { emailService } from '@/services/emailService';

// In signup flow
await emailService.sendComedianWelcome(
  'comedian@example.com',
  'John Smith'
);
```

### Send Gig Confirmation

```typescript
await emailService.sendGigConfirmation(
  'comedian@example.com',
  {
    eventName: 'Monday Night Comedy',
    venue: 'The Comedy Store',
    date: 'March 15, 2025',
    time: '8:00 PM',
    spotDuration: '5 minutes'
  }
);
```

### Send Custom Email

```typescript
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  html: '<h1>Custom HTML Content</h1>',
  from: 'custom@standupsydney.com' // Optional, defaults to VITE_RESEND_FROM_EMAIL
});
```

## Current Email Flow

### Signup Process

1. **User submits signup form** → `handleSignUp()` in `Auth.tsx`
2. **Supabase creates account** → Auto-confirms email (no verification required)
3. **Success toast shown** → "Account Created Successfully! 🎉"
4. **Welcome email sent** → Non-blocking, sent in background
5. **User can sign in immediately** → No need to check email

**Key Points:**
- Email confirmation is **disabled** in Supabase (auto-confirm enabled)
- Users can sign in immediately without checking email
- Welcome email is informational, not required for activation
- Email failures don't block user signup flow

## Testing

### Local Development

1. Add environment variables to `.env.local`:
```bash
RESEND_API_KEY=re_your_test_api_key
VITE_RESEND_FROM_EMAIL=test@standupsydney.com
```

2. Sign up with a test account
3. Check Resend dashboard → **Logs** to verify email was sent
4. Check email inbox (if using real email address)

### Production Testing

1. Create a test account on production
2. Verify welcome email is received
3. Check Resend logs for delivery status
4. Monitor for bounce/spam reports

## Troubleshooting

### Email Not Sending

**Check:**
1. `RESEND_API_KEY` is set correctly in environment
2. `VITE_RESEND_FROM_EMAIL` domain is verified in Resend
3. Browser console for errors
4. Resend dashboard → Logs for API errors

**Common Issues:**
- **401 Unauthorized:** Invalid API key
- **403 Forbidden:** Domain not verified
- **404 Not Found:** Check API endpoint (should be automatic via SDK)

### Email Goes to Spam

**Solutions:**
1. Verify SPF, DKIM, DMARC records in Resend dashboard
2. Use a dedicated sending domain (not a shared domain)
3. Enable DMARC monitoring
4. Avoid spam trigger words in subject/body
5. Include unsubscribe link for marketing emails

### Rate Limits

**Resend Limits:**
- Free tier: 100 emails/day, 3,000 emails/month
- Paid tier: Custom limits based on plan

**If hitting limits:**
1. Upgrade Resend plan
2. Implement email queuing system
3. Batch similar notifications

## Email Analytics

### Available Metrics (Resend Dashboard)

- **Delivered:** Successfully delivered to inbox
- **Opened:** Email opened by recipient (requires tracking pixel)
- **Clicked:** Links clicked in email
- **Bounced:** Email rejected by recipient server
- **Complained:** Marked as spam by recipient

### Monitoring

1. Go to Resend dashboard → **Analytics**
2. Filter by:
   - Date range
   - Email type (welcome, confirmation, etc.)
   - Delivery status
3. Export data for analysis

## Future Enhancements

### Planned Features

1. **Email Preferences**
   - User opt-in/opt-out for different email types
   - Frequency controls (daily digest vs immediate)

2. **Additional Templates**
   - Password reset emails
   - Event reminder emails (24h before show)
   - Application status updates
   - Payment receipts

3. **Improved Tracking**
   - Click tracking for dashboard links
   - Open rate analytics
   - A/B testing for subject lines

4. **Email Queuing**
   - Bull queue for background processing
   - Retry logic for failed sends
   - Rate limit handling

## Security Considerations

### Best Practices

1. **Never expose API key:**
   - Keep `RESEND_API_KEY` in server environment only
   - Don't commit to git
   - Use Vercel environment variables

2. **Verify sender domain:**
   - Always use verified domains
   - Enable DMARC for anti-spoofing

3. **Rate limiting:**
   - Implement per-user email limits
   - Prevent abuse/spam

4. **Data privacy:**
   - Don't include sensitive data in emails
   - Use secure links with tokens for account actions

## Related Documentation

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Supabase Auth Email Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

## Support

For issues or questions:
1. Check Resend dashboard logs first
2. Review this documentation
3. Check browser console for errors
4. Contact Resend support at [support@resend.com](mailto:support@resend.com)
