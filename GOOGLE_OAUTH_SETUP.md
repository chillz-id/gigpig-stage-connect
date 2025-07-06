# Google OAuth Setup Guide for Stand Up Sydney

## Prerequisites
1. Access to Supabase dashboard
2. Access to Google Cloud Console
3. Your production URL (e.g., https://your-app.vercel.app)

## Step 1: Configure Supabase OAuth Settings

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click to expand
4. You'll see the OAuth redirect URL that Supabase expects. It should look like:
   ```
   https://pdikjpfulhhpqpxzpgtu.supabase.co/auth/v1/callback
   ```
5. Copy this URL - you'll need it for Google Cloud Console

## Step 2: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID (or create one if needed)
5. Add the following to **Authorized redirect URIs**:
   - Supabase callback URL from Step 1
   - Your app's callback URLs:
     - Development: `http://localhost:8080/auth/callback`
     - Production: `https://your-app.vercel.app/auth/callback`
6. Copy your **Client ID** and **Client Secret**

## Step 3: Update Supabase with Google Credentials

1. Back in Supabase dashboard → **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Paste your Google OAuth Client ID
4. Paste your Google OAuth Client Secret
5. Set the redirect URL to match your app:
   - For production: `https://your-app.vercel.app/auth/callback`
   - For development: `http://localhost:8080/auth/callback`
6. Save the configuration

## Step 4: Update Environment Variables

### For Local Development (.env)
```bash
VITE_OAUTH_REDIRECT_URL="http://localhost:8080/auth/callback"
```

### For Production (.env.production)
```bash
VITE_OAUTH_REDIRECT_URL="https://your-app.vercel.app/auth/callback"
```

## Step 5: Deploy and Test

1. Commit and push your changes
2. Deploy to Vercel (auto-deploys from main branch)
3. Test the authentication flow:
   - Clear browser cache/use incognito
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Check Supabase dashboard for new user

## Troubleshooting

### Common Issues:

1. **"Redirect URI mismatch" error**
   - Ensure the redirect URL in your app EXACTLY matches what's in Google Console
   - Check for trailing slashes, http vs https, etc.

2. **User not persisting after OAuth**
   - Check browser console for errors
   - Verify Supabase RLS policies allow user creation
   - Check if profile creation trigger is set up

3. **"Invalid client" error**
   - Verify Client ID and Secret are correctly copied to Supabase
   - Ensure Google provider is enabled in Supabase

### Debug Steps:

1. Open browser developer tools
2. Check Network tab during OAuth flow
3. Look for error messages in Console
4. Check Supabase logs for authentication errors
5. Verify all URLs match exactly across:
   - Your app code
   - Supabase configuration
   - Google Cloud Console

## Security Notes

- Never commit OAuth credentials to version control
- Use environment variables for all sensitive data
- Ensure production URLs use HTTPS
- Regularly rotate OAuth credentials