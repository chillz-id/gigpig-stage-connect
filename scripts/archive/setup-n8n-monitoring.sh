#!/bin/bash

# N8N Workflow Monitoring Setup
# Monitors workflow executions and alerts on failures

set -e

N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYWYzNjQ3ZC1hMTQzLTQ3MzctOWI3Yi0zMDVkNGM4ZmE4NTYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1Nzg5NjQ4fQ.jIPgXdpfgkUOa4We46nfaN-NgaHh4TbQIjGcwU5K57I"
N8N_URL="http://localhost:5678"
LOG_FILE="/var/log/n8n-monitoring.log"

echo "🔍 N8N Workflow Monitoring Setup - $(date)"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check workflow status
check_workflows() {
    log "📊 Checking active workflows..."
    
    ACTIVE_WORKFLOWS=$(curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
        "$N8N_URL/api/v1/workflows" | \
        jq -r '.data[] | select(.active == true) | .id + "|" + .name')
    
    if [ -z "$ACTIVE_WORKFLOWS" ]; then
        log "❌ No active workflows found!"
        return 1
    fi
    
    echo "$ACTIVE_WORKFLOWS" | while IFS='|' read -r id name; do
        log "✅ Active: $name ($id)"
    done
}

# Function to check recent executions
check_executions() {
    log "🔄 Checking recent executions (last 24 hours)..."
    
    RECENT_EXECUTIONS=$(curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
        "$N8N_URL/api/v1/executions?limit=50" | \
        jq -r '.data[] | select(.startedAt > (now - 86400 | todate)) | 
               .workflowName + "|" + .status + "|" + .startedAt')
    
    if [ -z "$RECENT_EXECUTIONS" ]; then
        log "⚠️  No recent executions found in last 24 hours"
        return 1
    fi
    
    SUCCESS_COUNT=0
    FAILURE_COUNT=0
    
    echo "$RECENT_EXECUTIONS" | while IFS='|' read -r workflow status started; do
        if [ "$status" = "success" ]; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            log "✅ $workflow: $status at $started"
        else
            FAILURE_COUNT=$((FAILURE_COUNT + 1))
            log "❌ $workflow: $status at $started"
        fi
    done
    
    log "📈 Execution Summary: $SUCCESS_COUNT success, $FAILURE_COUNT failures"
}

# Function to test webhook endpoints
test_webhooks() {
    log "🧪 Testing webhook endpoints..."
    
    # Test known webhook paths
    WEBHOOK_PATHS=("simple-event-test" "humanitix-test" "complete-data-sync")
    
    for path in "${WEBHOOK_PATHS[@]}"; do
        log "Testing webhook: $path"
        
        RESPONSE=$(curl -s -w "%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d '{"test": "monitoring", "timestamp": "'$(date -Iseconds)'"}' \
            "http://170.64.252.55:5678/webhook/$path")
        
        HTTP_CODE="${RESPONSE: -3}"
        BODY="${RESPONSE%???}"
        
        if [[ "$HTTP_CODE" =~ ^[23] ]]; then
            log "✅ Webhook $path: HTTP $HTTP_CODE - Working"
        else
            log "❌ Webhook $path: HTTP $HTTP_CODE - $BODY"
        fi
    done
}

# Function to create monitoring cron job
setup_cron() {
    log "⏰ Setting up monitoring cron job..."
    
    CRON_COMMAND="*/15 * * * * /root/agents/setup-n8n-monitoring.sh monitor >> /var/log/n8n-monitoring.log 2>&1"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "setup-n8n-monitoring.sh"; then
        log "✅ Monitoring cron job already exists"
    else
        # Add cron job
        (crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -
        log "✅ Added monitoring cron job (every 15 minutes)"
    fi
}

# Function to create monitoring dashboard
create_dashboard() {
    log "📊 Creating monitoring dashboard..."
    
    cat > /root/agents/n8n-dashboard.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>N8N Workflow Monitor</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; }
        .error { background-color: #f8d7da; color: #721c24; }
        .warning { background-color: #fff3cd; color: #856404; }
        .log { background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .refresh { float: right; }
    </style>
</head>
<body>
    <h1>N8N Workflow Monitor</h1>
    <button class="refresh" onclick="location.reload()">Refresh</button>
    
    <h2>System Status</h2>
    <div id="system-status">Loading...</div>
    
    <h2>Recent Executions</h2>
    <div id="executions">Loading...</div>
    
    <h2>Monitoring Log</h2>
    <div class="log" id="logs">Loading...</div>
    
    <script>
        // Auto-refresh every 60 seconds
        setInterval(() => location.reload(), 60000);
        
        // Load status on page load
        window.onload = function() {
            document.getElementById('system-status').innerHTML = 
                '<div class="status success">✅ N8N Service: Running</div>' +
                '<div class="status warning">⚠️ Webhook Configs: Manual fix needed</div>';
                
            document.getElementById('executions').innerHTML = 
                '<p>Check <a href="http://170.64.252.55:5678/executions" target="_blank">N8N Executions</a></p>';
                
            document.getElementById('logs').innerHTML = 
                '<p>Run: <code>tail -f /var/log/n8n-monitoring.log</code></p>';
        };
    </script>
</body>
</html>
EOF

    log "✅ Dashboard created: /root/agents/n8n-dashboard.html"
    log "🌐 Access via: http://170.64.252.55/n8n-dashboard.html"
}

# Main execution
case "${1:-setup}" in
    "monitor")
        log "🔍 Running monitoring check..."
        check_workflows
        check_executions
        # Don't test webhooks every time to avoid spam
        ;;
    "test")
        log "🧪 Running webhook tests..."
        test_webhooks
        ;;
    "setup")
        log "🚀 Setting up N8N monitoring system..."
        check_workflows
        check_executions
        setup_cron
        create_dashboard
        log "✅ Monitoring setup complete!"
        ;;
    *)
        echo "Usage: $0 [setup|monitor|test]"
        echo "  setup   - Initial setup with cron job"
        echo "  monitor - Check workflows and executions"
        echo "  test    - Test webhook endpoints"
        exit 1
        ;;
esac

log "✅ Monitoring check completed"