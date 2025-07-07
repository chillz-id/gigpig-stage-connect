# Calendar Sync & Deployment Status

## Summary of Work Completed

### 1. Calendar Synchronization Feature (COMPLETED)
Implemented full calendar sync functionality for comedians to sync confirmed gigs with Google Calendar and Apple Calendar.

#### Features Implemented:
- **Google Calendar OAuth Integration**
  - OAuth flow with proper redirect handling
  - Token exchange and storage in `calendar_integrations` table
  - Automatic event creation when spots are confirmed
  - Sync status tracking and error handling

- **Apple Calendar / ICS Export**
  - Generate .ics files for confirmed gigs
  - Download functionality for Apple Calendar, Outlook, etc.
  - Proper timezone handling (Australia/Sydney)

- **Database Schema**
  ```sql
  -- Calendar integrations table
  CREATE TABLE calendar_integrations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    provider TEXT, -- 'google', 'apple', etc.
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    calendar_id TEXT,
    is_active BOOLEAN DEFAULT true
  );

  -- Comedian availability tracking
  CREATE TABLE comedian_availability (
    id UUID PRIMARY KEY,
    comedian_id UUID REFERENCES auth.users,
    date DATE,
    is_available BOOLEAN DEFAULT true,
    blocked_reason TEXT
  );
  ```

#### Key Files Created/Modified:
- `/root/agents/src/hooks/useCalendarIntegration.ts` - Main calendar sync logic
- `/root/agents/src/hooks/useComedianAvailability.ts` - Availability management
- `/root/agents/src/hooks/useComedianGigs.ts` - Gig tracking for comedians
- `/root/agents/src/components/comedian-profile/ComedianCalendarSync.tsx` - UI component
- `/root/agents/src/pages/GoogleCalendarCallback.tsx` - OAuth callback handler
- `/root/agents/supabase/functions/google-calendar/index.ts` - Edge function for Google API
- `/root/agents/supabase/migrations/20250706150000_create_comedian_availability.sql` - DB migration

### 2. Production Deployment (IN PROGRESS)

#### Environment Configuration:
- **Vercel URL**: https://stand-up-sydney.vercel.app
- **Google OAuth Client ID**: 89129292382-skmn34r0gpnejoqjvh3l5f0b1u6s3lko.apps.googleusercontent.com
- **Production env file**: `/root/agents/.env.production` and `/root/agents/public/env-production-download.txt`

#### Current Deployment Issues:
1. **White Page Error**: Site shows blank page with JavaScript module errors
2. **Service Worker Errors**: "Request scheme 'chrome-extension' is unsupported"
3. **React Context Error**: "useTheme must be used within a ThemeProvider"
4. **Manifest 401 Error**: manifest.json returning unauthorized

#### Fixes Applied:
1. **Service Worker Chrome Extension Fix**:
   - Added URL scheme checks in `cacheFirst`, `networkFirstWithCache`, and `networkFirstWithOffline` functions
   - Skip non-HTTP URLs to prevent chrome-extension errors
   - Code in `/root/agents/public/sw.js`

2. **Import Path Fixes**:
   - Fixed all `@/lib/supabase` imports to `@/integrations/supabase/client`
   - Used sed command: `find src -name "*.ts*" -exec sed -i 's|@/lib/supabase|@/integrations/supabase/client|g' {} \;`

3. **Vercel Configuration**:
   - Added proper MIME type headers for JavaScript files
   - Configuration in `/root/agents/vercel.json`

4. **Temporary Debugging Measures**:
   - Disabled service worker registration in `pwaService.ts` to isolate React context error
   - This helps determine if SW is causing the initialization issue

#### Latest Git Status:
- Branch: main
- Last commit: "Fix service worker chrome-extension errors and temporarily disable SW registration"
- Pushed to GitHub, triggering Vercel deployment

### 3. Required OAuth Redirect URIs
For Google Calendar integration to work, add these to Google Cloud Console:
- `https://stand-up-sydney.vercel.app/auth/google-calendar-callback`
- `http://localhost:8080/auth/google-calendar-callback` (for local dev)

### 4. Next Steps for Deployment Fix:
1. Wait for Vercel deployment to complete with SW disabled
2. If React context error persists:
   - Check if ThemeProvider is initialized before any useTheme calls
   - Verify all providers are properly nested in App.tsx
   - Look for components using hooks outside of provider scope
3. Once app loads, re-enable service worker registration
4. Test calendar sync functionality in production

### 5. Testing Calendar Sync:
1. Login as a comedian
2. Go to Profile > Calendar Sync tab
3. Click "Connect Google Calendar"
4. Complete OAuth flow
5. Create a confirmed spot
6. Check if event appears in Google Calendar
7. Test ICS download for Apple Calendar

### 6. Important Notes:
- App.tsx was modified by user/linter to add InvoiceForm and XeroCallback routes
- All environment variables are configured in .env.production
- Service worker provides offline functionality but temporarily disabled for debugging
- Calendar sync requires comedian role to access

## Commands for Next Session:
```bash
# Check deployment status
curl https://stand-up-sydney.vercel.app

# View deployment logs (need Vercel CLI)
vercel logs stand-up-sydney.vercel.app

# Re-enable service worker (after React context fix)
# Edit /root/agents/src/services/pwaService.ts and uncomment lines 52-70

# Test local build
cd /root/agents
npm run build
npm run preview
```

## Files to Check if Issues Persist:
1. `/root/agents/src/contexts/ThemeContext.tsx` - Verify provider export
2. `/root/agents/src/App.tsx` - Check provider nesting order
3. `/root/agents/src/components/DockNavigation.tsx` - Uses useTheme
4. Browser DevTools > Application > Service Workers - Clear all SW data

This deployment is for the Stand Up Sydney comedy platform with calendar synchronization for comedians to sync their confirmed gigs with external calendars.