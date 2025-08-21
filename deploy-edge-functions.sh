#!/bin/bash

# Deploy all Edge Functions to Supabase
# Run this from the /root/agents directory

echo "Deploying Edge Functions to Supabase..."

# Make sure you're in the right directory
cd /root/agents

# Deploy each function
echo "1. Deploying check-subscription..."
supabase functions deploy check-subscription

echo "2. Deploying create-checkout..."
supabase functions deploy create-checkout

echo "3. Deploying customer-portal..."
supabase functions deploy customer-portal

echo "4. Deploying google-calendar-sync..."
supabase functions deploy google-calendar-sync

echo "5. Deploying google-maps-proxy..."
supabase functions deploy google-maps-proxy

echo "6. Deploying xero-oauth..."
supabase functions deploy xero-oauth

echo "7. Creating and deploying save-push-subscription..."
# First create the missing function
mkdir -p supabase/functions/save-push-subscription
cat > supabase/functions/save-push-subscription/index.ts << 'EOF'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { subscription } = await req.json()
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // Save subscription to database
    const { error } = await supabaseClient
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: subscription,
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
EOF

# Deploy the new function
supabase functions deploy save-push-subscription

echo "All Edge Functions deployed!"
echo "Note: Make sure you have run 'supabase login' and 'supabase link' first"