#!/bin/bash
# Start Linear webhook handler for real-time synchronization
echo "🚀 Starting Linear webhook handler on port 3030..."
echo "📍 Webhook URL: http://localhost:3030/webhook"
echo "💊 Health check: http://localhost:3030/health"
echo "🔧 Configure LINEAR_WEBHOOK_SECRET environment variable"
echo "📡 Use ngrok or similar to expose webhook to Linear"
node /root/agents/linear-webhook-handler.js
