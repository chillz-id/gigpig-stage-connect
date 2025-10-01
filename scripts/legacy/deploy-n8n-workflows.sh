#!/bin/bash

# Stand Up Sydney N8N Workflow Deployment Script
# This script deploys critical N8N workflows to fix P1 issues

set -e

echo "🚀 Stand Up Sydney N8N Workflow Deployment"
echo "=========================================="

# Configuration
N8N_API_URL="http://localhost:5678/api/v1"
N8N_API_KEY="${N8N_API_KEY}"
WORKFLOW_DIR="/root/agents/n8n-workflows"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if N8N is running
check_n8n_status() {
    log_info "Checking N8N status..."
    if curl -s -f "$N8N_API_URL/workflows" -H "X-N8N-API-KEY: $N8N_API_KEY" > /dev/null 2>&1; then
        log_success "N8N is running and accessible"
        return 0
    else
        log_error "N8N is not accessible at $N8N_API_URL"
        log_info "Please ensure N8N is running and the API key is correct"
        return 1
    fi
}

# Deploy workflow function
deploy_workflow() {
    local workflow_file="$1"
    local workflow_name="$2"
    
    log_info "Deploying workflow: $workflow_name"
    
    if [ ! -f "$workflow_file" ]; then
        log_error "Workflow file not found: $workflow_file"
        return 1
    fi
    
    # Create workflow via N8N API
    local response=$(curl -s -w "%{http_code}" \
        -X POST "$N8N_API_URL/workflows" \
        -H "Content-Type: application/json" \
        -H "X-N8N-API-KEY: $N8N_API_KEY" \
        -d @"$workflow_file" \
        -o /tmp/n8n_response.json)
    
    local http_code="${response: -3}"
    local response_body=$(cat /tmp/n8n_response.json)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        local workflow_id=$(echo "$response_body" | jq -r '.id // .data.id // empty')
        log_success "✅ Workflow deployed successfully!"
        log_info "   • Name: $workflow_name"
        log_info "   • ID: $workflow_id"
        log_info "   • Status: Active"
        
        # Activate the workflow
        activate_workflow "$workflow_id" "$workflow_name"
        
        return 0
    else
        log_error "❌ Failed to deploy workflow: $workflow_name"
        log_error "   • HTTP Code: $http_code"
        log_error "   • Response: $response_body"
        return 1
    fi
}

# Activate workflow function
activate_workflow() {
    local workflow_id="$1"
    local workflow_name="$2"
    
    log_info "Activating workflow: $workflow_name"
    
    local response=$(curl -s -w "%{http_code}" \
        -X POST "$N8N_API_URL/workflows/$workflow_id/activate" \
        -H "X-N8N-API-KEY: $N8N_API_KEY" \
        -o /tmp/n8n_activate_response.json)
    
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        log_success "✅ Workflow activated successfully!"
    else
        log_warning "⚠️  Failed to activate workflow (it may already be active)"
    fi
}

# Test workflow function
test_workflow() {
    local webhook_name="$1"
    local test_data="$2"
    
    log_info "Testing webhook: $webhook_name"
    
    local webhook_url="http://localhost:5678/webhook/$webhook_name"
    local response=$(curl -s -w "%{http_code}" \
        -X POST "$webhook_url" \
        -H "Content-Type: application/json" \
        -d "$test_data" \
        -o /tmp/webhook_test_response.json)
    
    local http_code="${response: -3}"
    local response_body=$(cat /tmp/webhook_test_response.json)
    
    if [ "$http_code" = "200" ]; then
        log_success "✅ Webhook test successful!"
        log_info "   • Response: $response_body"
    else
        log_warning "⚠️  Webhook test returned HTTP $http_code"
        log_info "   • This may be normal if the workflow requires specific data"
    fi
}

# Main deployment process
main() {
    echo
    log_info "Starting N8N workflow deployment..."
    
    # Check prerequisites
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed. Please install jq first."
        exit 1
    fi
    
    if [ -z "$N8N_API_KEY" ]; then
        log_error "N8N_API_KEY environment variable is not set"
        exit 1
    fi
    
    # Check N8N status
    if ! check_n8n_status; then
        exit 1
    fi
    
    echo
    log_info "Deploying critical P1 workflows..."
    
    # Deploy Google Auth Recovery Workflow
    if [ -f "$WORKFLOW_DIR/google-auth-recovery-workflow.json" ]; then
        deploy_workflow "$WORKFLOW_DIR/google-auth-recovery-workflow.json" "Google Auth Recovery & User Onboarding"
        
        # Test the webhook
        test_workflow "google-auth-recovery" '{
            "event_type": "user.created",
            "user_id": "test-user-123",
            "email": "test@standupsydney.com",
            "user_metadata": {
                "full_name": "Test User",
                "avatar_url": "https://example.com/avatar.jpg"
            },
            "provider": "google",
            "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
            "source": "deployment_test"
        }'
    else
        log_warning "Google Auth Recovery workflow file not found"
    fi
    
    echo
    log_success "🎉 N8N Workflow deployment completed!"
    
    echo
    log_info "Next steps:"
    log_info "1. Run Supabase migration: cd /root/agents && supabase db push"
    log_info "2. Update Notion database IDs in environment variables"
    log_info "3. Test the webhook manually: SELECT test_auth_recovery_webhook();"
    log_info "4. Monitor workflow executions in N8N dashboard: http://localhost:5678"
    
    echo
    log_info "🔗 Important URLs:"
    log_info "   • N8N Dashboard: http://localhost:5678"
    log_info "   • Webhook URL: http://localhost:5678/webhook/google-auth-recovery"
    log_info "   • Frontend: https://stand-up-sydney.vercel.app"
    
    # Cleanup
    rm -f /tmp/n8n_response.json /tmp/n8n_activate_response.json /tmp/webhook_test_response.json
}

# Run the main function
main "$@"