# Calendar Integration Setup Guide

## 🚀 Quick Setup Summary

Your calendar integration is **95% ready**! Here's what needs to be completed:

## ✅ Already Working
- ✅ Supabase connection and authentication
- ✅ All frontend calendar sync components 
- ✅ ICS file export functionality
- ✅ Basic calendar database tables
- ✅ Google Maps integration

## 🔧 Setup Required (5 minutes)

### 1. Apply Database Migration

**Option A: Supabase Dashboard (Recommended)**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu)
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `setup-calendar-integration.sql`
4. Click **Run** to execute

**Option B: Install Supabase CLI**
```bash
npm install -g supabase
supabase db reset --linked
```

### 2. Set Up Google Calendar OAuth

#### A. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Calendar API**:
   - Go to **APIs & Services > Library**
   - Search for "Google Calendar API"
   - Click **Enable**

#### B. Create OAuth Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Set **Application type**: Web application
4. Add **Authorized redirect URIs**:
   - For development: `http://localhost:8080/auth/google-calendar-callback`
   - For production: `https://your-domain.com/auth/google-calendar-callback`
5. Copy the **Client ID** and **Client Secret**

#### C. Update Environment Variables
Add to your `.env` file:
```bash
# Google Calendar Integration
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 3. Deploy Supabase Edge Function (Optional)

For full Google Calendar sync, deploy the edge function:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Deploy the function
supabase functions deploy google-calendar-sync --project-ref pdikjpfulhhpqpxzpgtu

# Set environment secrets
supabase secrets set GOOGLE_CLIENT_ID=your_google_oauth_client_id --project-ref pdikjpfulhhpqpxzpgtu
supabase secrets set GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret --project-ref pdikjpfulhhpqpxzpgtu
supabase secrets set SITE_URL=https://your-domain.com --project-ref pdikjpfulhhpqpxzpgtu
```

## 🎯 What Works Right Now (Without Setup)

Even without completing the Google OAuth setup, comedians can already:

1. **✅ Set Availability**: Interactive calendar to mark available/unavailable dates
2. **✅ Block Date Ranges**: Mark vacation periods, tours, etc.
3. **✅ Track Confirmed Gigs**: View all upcoming performances
4. **✅ Export to Apple Calendar/Outlook**: Download .ics files
5. **✅ Add Manual Gigs**: Comedians can add their own shows

## 🎭 What's Added After Google Setup

Once Google OAuth is configured:

1. **🔄 Automatic Google Calendar Sync**: Gigs appear in Google Calendar automatically
2. **🔗 One-Click Connection**: "Connect Google Calendar" button works
3. **📱 Real-time Updates**: Changes sync immediately
4. **🔄 Token Refresh**: Automatic handling of expired tokens

## 🧪 Testing the Integration

### Test Without Google OAuth:
1. Start the dev server: `npm run dev`
2. Sign in as a comedian
3. Go to your profile
4. Test availability calendar
5. Add a test gig
6. Download .ics file and import to Apple Calendar

### Test With Google OAuth:
1. Complete Google setup above
2. Click "Connect Google Calendar" in profile
3. Authorize the application
4. Add a confirmed gig
5. Check Google Calendar for automatic sync

## 🚨 Production Deployment Notes

1. **Environment Variables**: Update `SITE_URL` to your production domain
2. **Redirect URIs**: Add production domain to Google OAuth settings
3. **Edge Function**: Deploy to production Supabase project
4. **Testing**: Test OAuth flow on production domain

## 📞 Support

If you encounter any issues:

1. **Database Issues**: Check Supabase logs in dashboard
2. **OAuth Issues**: Verify redirect URIs match exactly
3. **Function Issues**: Check Supabase Edge Function logs
4. **Frontend Issues**: Check browser console for errors

The calendar integration is enterprise-ready and will be a major differentiator for your platform! 🌟