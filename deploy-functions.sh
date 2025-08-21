#!/bin/bash

# Deploy all Supabase Edge Functions

echo "🚀 Deploying Supabase Edge Functions..."

# Source environment variables
source .env

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "   npm install -g supabase"
    exit 1
fi

# Deploy each function
functions=(
    "google-maps-proxy"
    "check-subscription"
    "create-checkout"
    "customer-portal"
    "google-calendar-sync"
    "xero-oauth"
)

for func in "${functions[@]}"; do
    echo "📦 Deploying $func..."
    supabase functions deploy $func --project-ref pdikjpfulhhpqpxzpgtu
done

echo "✅ All edge functions deployed successfully!"
echo ""
echo "Note: Make sure to set the GOOGLE_MAPS_API_KEY secret in Supabase dashboard:"
echo "https://app.supabase.com/project/pdikjpfulhhpqpxzpgtu/settings/vault"