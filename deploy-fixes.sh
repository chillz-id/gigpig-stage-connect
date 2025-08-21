#!/bin/bash

echo "🚀 Deploying Stand Up Sydney Fixes"
echo "=================================="

# 1. Apply database migrations
echo "📊 Applying database migrations..."
echo "Please run these migrations in Supabase SQL Editor:"
echo "1. /root/agents/supabase/migrations/20250109_fix_google_auth.sql"
echo "2. /root/agents/supabase/migrations/20250109_fix_event_publishing.sql"
echo ""
echo "Press Enter when migrations are applied..."
read

# 2. Commit and push changes
echo "📦 Committing changes..."
git add -A
git commit -m "🔧 Fix critical issues: Google Auth, Event Publishing, Maps Integration

- Added profile creation trigger for OAuth users
- Fixed event publishing RLS policies
- Implemented Google Maps edge function fallback
- Added deposit feature to invoicing system"

echo "🌐 Pushing to GitHub..."
git push origin main

# 3. Deploy edge functions
echo "☁️ Deploying edge functions..."
if command -v supabase &> /dev/null; then
    supabase functions deploy google-maps-proxy --project-ref pdikjpfulhhpqpxzpgtu
else
    echo "⚠️  Supabase CLI not found. Please deploy edge functions manually."
fi

# 4. Trigger Vercel deployment
echo "🔄 Vercel will automatically deploy from GitHub push..."

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Next Steps:"
echo "1. Monitor Vercel deployment: https://vercel.com/dashboard"
echo "2. Set GOOGLE_MAPS_API_KEY in Supabase Vault (optional)"
echo "3. Test the production site after deployment"
echo ""
echo "🎉 Platform should be fully operational in ~2-3 minutes!"