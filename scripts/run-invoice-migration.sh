#!/bin/bash

# This script runs the invoice migration using Supabase CLI
# Make sure you have Supabase CLI installed and are in the project directory

echo "🎭 Stand Up Sydney - Running Invoice Migration"
echo "============================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Not in the correct directory. Please run from /root/agents/"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "📋 Migration to apply: 20250709200000_fix_invoice_schema_mismatches.sql"
echo ""
echo "This migration will:"
echo "  ✓ Add missing columns to invoices table (invoice_type, tax_treatment, deposit fields)"
echo "  ✓ Add missing columns to invoice_items table (subtotal, tax_amount, total, item_order)"
echo "  ✓ Add missing columns to invoice_recipients table (recipient_type, recipient_abn, company_name)"
echo "  ✓ Add missing columns to invoice_payments table (status, is_deposit, recorded_by)"
echo "  ✓ Update Row Level Security policies for comedian access"
echo "  ✓ Sync gst_treatment with tax_treatment values"
echo ""

# Run the migration
echo "🚀 Running migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run test:invoice  (to verify the system)"
    echo "2. Check the invoice management UI at /invoices"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    echo ""
    echo "Alternative: You can manually apply the migration via Supabase Dashboard:"
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of: supabase/migrations/20250709200000_fix_invoice_schema_mismatches.sql"
    echo "4. Click 'Run'"
fi