#!/bin/bash
# Deploy Humanitix & Eventbrite to Brevo sync workflows to N8N

echo "🚀 Deploying Brevo Sync Workflows to N8N..."

# N8N API configuration
N8N_URL="http://localhost:5678/api/v1"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1M2UzN2FhMC03MTc4LTRmMmYtODBhYS00ODNiYmE1ODc0YWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUxNTcwMDc2fQ._zbYlvtzSMRFHnQu6O_L2LhJU4Ib1655bynbmoXeqMo"

# Function to deploy workflow
deploy_workflow() {
    local workflow_file=$1
    local workflow_name=$2
    
    echo "📤 Deploying $workflow_name..."
    
    # Check if workflow file exists
    if [ ! -f "$workflow_file" ]; then
        echo "❌ Workflow file not found: $workflow_file"
        return 1
    fi
    
    # Deploy workflow to N8N
    response=$(curl -s -X POST "$N8N_URL/workflows" \
        -H "Authorization: Bearer $N8N_API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$workflow_file")
    
    # Check if deployment was successful
    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        workflow_id=$(echo "$response" | jq -r '.id')
        echo "✅ $workflow_name deployed successfully (ID: $workflow_id)"
        
        # Activate the workflow
        activate_response=$(curl -s -X POST "$N8N_URL/workflows/$workflow_id/activate" \
            -H "Authorization: Bearer $N8N_API_KEY")
        
        if echo "$activate_response" | jq -e '.active' > /dev/null 2>&1; then
            echo "🟢 $workflow_name activated successfully"
        else
            echo "⚠️  $workflow_name deployed but activation failed"
        fi
        
        return 0
    else
        echo "❌ Failed to deploy $workflow_name"
        echo "Response: $response"
        return 1
    fi
}

# Function to check N8N connection
check_n8n_connection() {
    echo "🔍 Checking N8N connection..."
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$N8N_URL/workflows" \
        -H "Authorization: Bearer $N8N_API_KEY")
    
    if [ "$response" = "200" ]; then
        echo "✅ N8N connection successful"
        return 0
    else
        echo "❌ N8N connection failed (HTTP $response)"
        echo "Make sure N8N is running on localhost:5678"
        return 1
    fi
}

# Function to setup credentials
setup_credentials() {
    echo "🔑 Setting up API credentials..."
    
    # Note: In a real deployment, these would be set through N8N UI
    # This is just documentation of what needs to be configured
    
    cat << EOF
📋 MANUAL SETUP REQUIRED:

Please configure these credentials in N8N UI (http://localhost:5678):

1. Humanitix API Key (httpHeaderAuth):
   - Name: "Humanitix API Key"  
   - Header Name: "x-api-key"
   - Header Value: [Your Humanitix API Key]

2. Eventbrite OAuth2:
   - Name: "Eventbrite OAuth2"
   - Client ID: [Your Eventbrite Client ID]
   - Client Secret: [Your Eventbrite Client Secret]

3. Brevo API Key (httpHeaderAuth):
   - Name: "Brevo API Key"
   - Header Name: "api-key" 
   - Header Value: YOUR_BREVO_API_KEY_HERE

4. Supabase API:
   - Name: "Supabase API"
   - URL: https://pdikjpfulhhpqpxzpgtu.supabase.co
   - API Key: [Your Supabase Service Role Key]

EOF
}

# Function to test state mapping
test_state_mapping() {
    echo "🧪 Testing state mapping utility..."
    
    cd /root/agents
    
    # Test state mapping with Node.js
    node -e "
    const { mapLocationToStateCode, testStateMappings } = require('./src/utils/stateMapping.ts');
    
    console.log('🧪 Running State Mapping Tests:');
    testStateMappings();
    
    console.log('\n📍 Testing specific locations:');
    const testLocations = ['Sydney', 'Melbourne', 'Gold Coast', 'Perth', 'Adelaide'];
    
    for (const location of testLocations) {
        const state = mapLocationToStateCode(location);
        console.log(\`\${location} → \${state}\`);
    }
    "
}

# Function to get webhook URL
get_webhook_url() {
    echo "🌐 Getting webhook URLs..."
    
    # For local testing, the webhook URL would be:
    echo "📍 Eventbrite Webhook URL: http://localhost:5678/webhook/eventbrite-webhook"
    echo "Note: For production, use your public domain instead of localhost"
}

# Main deployment script
main() {
    echo "🎭 Stand Up Sydney - Brevo Sync Workflow Deployment"
    echo "=================================================="
    
    # Check N8N connection
    if ! check_n8n_connection; then
        exit 1
    fi
    
    # Setup credentials info
    setup_credentials
    
    echo ""
    echo "⏱️  Waiting 10 seconds for you to review credential requirements..."
    sleep 10
    
    # Deploy workflows
    echo "🚀 Starting workflow deployment..."
    
    success_count=0
    total_workflows=2
    
    # Deploy Humanitix to Brevo sync workflow
    if deploy_workflow "/root/agents/docs/n8n-workflows/humanitix-to-brevo-sync.json" "Humanitix → Brevo Sync"; then
        ((success_count++))
    fi
    
    echo ""
    
    # Deploy Eventbrite to Brevo sync workflow  
    if deploy_workflow "/root/agents/docs/n8n-workflows/eventbrite-to-brevo-sync.json" "Eventbrite → Brevo Sync"; then
        ((success_count++))
    fi
    
    echo ""
    echo "📊 Deployment Summary:"
    echo "Success: $success_count/$total_workflows workflows"
    
    if [ $success_count -eq $total_workflows ]; then
        echo "🎉 All workflows deployed successfully!"
        
        # Test state mapping
        test_state_mapping
        
        # Show webhook URLs
        get_webhook_url
        
        echo ""
        echo "✅ Deployment complete! Next steps:"
        echo "1. Configure API credentials in N8N UI"
        echo "2. Set up Eventbrite webhook to point to your N8N instance"
        echo "3. Monitor workflow executions in N8N dashboard"
        
        return 0
    else
        echo "⚠️  Some workflows failed to deploy"
        return 1
    fi
}

# Run the main function
main "$@"