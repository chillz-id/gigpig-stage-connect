#!/bin/bash

# Script to add webhook secrets to the environment configuration

echo "📝 Adding webhook secrets to environment configuration..."

# Check if the credentials file exists
CREDS_FILE="/etc/standup-sydney/credentials.env"
if [ ! -f "$CREDS_FILE" ]; then
    echo "❌ Credentials file not found at $CREDS_FILE"
    exit 1
fi

# Generate secure webhook secrets
HUMANITIX_SECRET=$(openssl rand -hex 32)
EVENTBRITE_SECRET=$(openssl rand -hex 32)

# Check if secrets already exist
if grep -q "HUMANITIX_WEBHOOK_SECRET" "$CREDS_FILE"; then
    echo "ℹ️  HUMANITIX_WEBHOOK_SECRET already exists in config"
else
    echo "" >> "$CREDS_FILE"
    echo "# Webhook Secrets" >> "$CREDS_FILE"
    echo "HUMANITIX_WEBHOOK_SECRET=$HUMANITIX_SECRET" >> "$CREDS_FILE"
    echo "✅ Added HUMANITIX_WEBHOOK_SECRET"
fi

if grep -q "EVENTBRITE_WEBHOOK_SECRET" "$CREDS_FILE"; then
    echo "ℹ️  EVENTBRITE_WEBHOOK_SECRET already exists in config"
else
    echo "EVENTBRITE_WEBHOOK_SECRET=$EVENTBRITE_SECRET" >> "$CREDS_FILE"
    echo "✅ Added EVENTBRITE_WEBHOOK_SECRET"
fi

# Add Eventbrite API key placeholder if not exists
if grep -q "EVENTBRITE_API_KEY" "$CREDS_FILE"; then
    echo "ℹ️  EVENTBRITE_API_KEY already exists in config"
else
    echo "EVENTBRITE_API_KEY=" >> "$CREDS_FILE"
    echo "✅ Added EVENTBRITE_API_KEY (needs to be filled with actual key)"
fi

# Add Eventbrite OAuth token placeholder
if grep -q "EVENTBRITE_OAUTH_TOKEN" "$CREDS_FILE"; then
    echo "ℹ️  EVENTBRITE_OAUTH_TOKEN already exists in config"
else
    echo "EVENTBRITE_OAUTH_TOKEN=" >> "$CREDS_FILE"
    echo "✅ Added EVENTBRITE_OAUTH_TOKEN (needs OAuth setup)"
fi

echo ""
echo "📋 Webhook Secrets Generated:"
echo "   HUMANITIX_WEBHOOK_SECRET: $HUMANITIX_SECRET"
echo "   EVENTBRITE_WEBHOOK_SECRET: $EVENTBRITE_SECRET"
echo ""
echo "⚠️  Important: These secrets need to be configured in your ticket platform dashboards!"
echo ""

# Sync credentials to local .env
/root/agents/scripts/sync-credentials.sh

echo "✅ Environment configuration updated!"