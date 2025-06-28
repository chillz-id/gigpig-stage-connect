#!/bin/bash
# Simple start script for Railway dev preview

echo "🚀 Starting Stand Up Sydney Dev Preview..."

# Ensure we have a PORT
export PORT=${PORT:-8080}
echo "📡 Using port: $PORT"

# Create .env.local if environment variables are available
if [ ! -z "$VITE_SUPABASE_URL" ]; then
    echo "🔧 Setting up environment variables..."
    cat > .env.local << EOF
VITE_SUPABASE_URL=$VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
VITE_GTM_ID=$VITE_GTM_ID
EOF
    echo "✅ Environment variables configured"
else
    echo "⚠️ No environment variables found, continuing without .env.local"
fi

# Start Vite development server
echo "🎭 Starting Vite development server on port $PORT..."
exec npm run dev -- --host 0.0.0.0 --port $PORT
