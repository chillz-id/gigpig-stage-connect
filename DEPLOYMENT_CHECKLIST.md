# 🚀 Deployment Checklist for Stand Up Sydney

## 1️⃣ **Vercel Deployment** (If not auto-deployed)

If you haven't connected GitHub to Vercel yet:
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Select your repository
4. Use these build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

## 2️⃣ **Environment Variables in Vercel**

Add these in Vercel Dashboard > Settings > Environment Variables:

```bash
VITE_SUPABASE_URL=https://pdikjpfulhhpqpxzpgtu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD4LD2HTMkQMclQt9HgSlVQKD5O-XnrgCs
VITE_APP_URL=https://your-vercel-app.vercel.app
VITE_OAUTH_REDIRECT_URL=https://your-vercel-app.vercel.app/auth/callback
```

## 3️⃣ **Database Migration**

Run this SQL in Supabase Dashboard > SQL Editor:

```sql
-- Copy contents from setup-calendar-integration.sql
-- This creates comedian_availability and comedian_blocked_dates tables
```

## 4️⃣ **Supabase OAuth Settings**

1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Update **Site URL**: `https://your-vercel-app.vercel.app`
3. Add to **Redirect URLs**:
   - `https://your-vercel-app.vercel.app/auth/callback`
   - `https://your-vercel-app.vercel.app/auth/google-calendar-callback`

## 5️⃣ **Google OAuth Setup** (For Calendar Integration)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-vercel-app.vercel.app/auth/google-calendar-callback`
6. Copy Client ID and add to Vercel: `VITE_GOOGLE_CLIENT_ID=your_client_id`

## 6️⃣ **Deploy Supabase Edge Function** (Optional)

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link
supabase login
supabase link --project-ref pdikjpfulhhpqpxzpgtu

# Deploy function
supabase functions deploy google-calendar-sync

# Set secrets
supabase secrets set GOOGLE_CLIENT_ID=your_google_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_google_client_secret
supabase secrets set SITE_URL=https://your-vercel-app.vercel.app
```

## 7️⃣ **Post-Deployment Testing**

### Core Features:
- [ ] User signup/login with Google OAuth
- [ ] Create/edit comedian profiles
- [ ] Create/publish events as promoter
- [ ] Apply to events as comedian
- [ ] Upload media/images
- [ ] Search and filter events

### Calendar Features:
- [ ] Set availability (click dates)
- [ ] Block date ranges
- [ ] Add manual gigs
- [ ] Download .ics file
- [ ] Connect Google Calendar (after OAuth setup)

### Mobile Testing:
- [ ] PWA installation prompt
- [ ] Responsive design on mobile
- [ ] Offline indicator
- [ ] Touch-friendly navigation

## 8️⃣ **Production URLs to Update**

After deployment, update these:
1. **Vercel Environment Variables**: Update `VITE_APP_URL`
2. **Supabase Auth Settings**: Update Site URL and Redirect URLs
3. **Google OAuth**: Add production redirect URI
4. **PWA Manifest**: Update start_url in manifest.json

## 🎉 **Launch Checklist**

- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] OAuth redirect URLs configured
- [ ] Test user registration flow
- [ ] Test comedian profile creation
- [ ] Test event creation and publishing
- [ ] Test calendar features
- [ ] Verify mobile responsiveness
- [ ] Check PWA installation

## 🚨 **Common Issues & Solutions**

**OAuth Redirect Mismatch:**
- Ensure URLs match exactly (https, no trailing slash)
- Clear browser cache and cookies

**Database Connection Issues:**
- Verify Supabase URL and anon key
- Check RLS policies are enabled

**Google Maps Not Loading:**
- Verify API key has required APIs enabled
- Check domain restrictions

**Build Failures:**
- Check Node version (should be 18+)
- Clear Vercel cache and redeploy

## 📞 **Support Resources**

- **Vercel Status**: [status.vercel.com](https://status.vercel.com)
- **Supabase Status**: [status.supabase.com](https://status.supabase.com)
- **Error Logs**: Vercel Dashboard > Functions > Logs

Your platform is ready for production! 🚀🎭