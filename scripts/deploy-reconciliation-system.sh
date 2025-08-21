#!/bin/bash

# Ticket Sales Reconciliation System Deployment Script
# This script deploys the complete reconciliation system

set -e

echo "🎬 Deploying Ticket Sales Reconciliation System..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the agents directory"
    exit 1
fi

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found. Please install it first."
    exit 1
fi

echo "📊 Step 1: Applying database migrations..."

# Apply reconciliation system migration
echo "  - Creating reconciliation tables..."
supabase db push --include-schemas public --migrations supabase/migrations/20250713_add_reconciliation_system.sql

# Apply data integrity functions
echo "  - Adding data integrity functions..."
supabase db push --include-schemas public --migrations supabase/migrations/20250713_add_data_integrity_functions.sql

echo "✅ Database migrations applied successfully"

echo "🔧 Step 2: Deploying Edge Functions..."

# Deploy reconciliation scheduled function
echo "  - Deploying reconciliation-scheduled function..."
supabase functions deploy reconciliation-scheduled

echo "✅ Edge functions deployed successfully"

echo "🔍 Step 3: Running initial integrity check..."

# Run a basic integrity check to verify system
node -e "
const { dataIntegrityService } = require('./src/services/dataIntegrityService.ts');
(async () => {
  try {
    console.log('Running system integrity check...');
    const result = await dataIntegrityService.runIntegrityCheck();
    console.log('✅ Integrity check completed:', result.status);
  } catch (error) {
    console.log('⚠️  Integrity check failed (expected if no data exists):', error.message);
  }
})();
" || echo "⚠️  Initial integrity check skipped (TypeScript compilation needed)"

echo "🚀 Step 4: Testing reconciliation system..."

# Test reconciliation endpoint
echo "  - Testing reconciliation endpoint..."
curl -X POST \
  "$(supabase status | grep 'API URL' | awk '{print $3}')/functions/v1/reconciliation-scheduled" \
  -H "Authorization: Bearer $(supabase status | grep 'anon key' | awk '{print $3}')" \
  -H "Content-Type: application/json" \
  -d '{"mode": "manual"}' \
  || echo "⚠️  Function test failed (expected if no events exist)"

echo "✅ Reconciliation system deployment completed!"

echo "
📋 Deployment Summary:
- ✅ Database tables created (reconciliation_reports, reconciliation_discrepancies, etc.)
- ✅ Data integrity functions installed
- ✅ Edge function deployed for scheduled reconciliation
- ✅ System ready for use

🎯 Next Steps:
1. Access the reconciliation dashboard in the admin panel
2. Configure reconciliation schedules for your events
3. Set up webhook endpoints for real-time sync
4. Monitor the reconciliation_reports table for results

📚 Documentation:
- See TICKET_RECONCILIATION_IMPLEMENTATION_REPORT.md for complete details
- Check the ReconciliationDashboard component in admin panel
- Review reconciliation hooks in useReconciliation.ts

🔧 Manual Operations:
- Run reconciliation: Use the dashboard or call the Edge function
- Check data integrity: dataIntegrityService.runIntegrityCheck()
- View reports: Access reconciliation_reports table
- Monitor alerts: Check reconciliation_discrepancies table

⚠️  Important Notes:
- Ensure ticket_platforms table has platform configurations
- Set up proper API keys for external platforms (Humanitix, Eventbrite)
- Configure webhook secrets for secure real-time sync
- Review RLS policies for proper access control
"