#!/usr/bin/env node

// Xero Integration Test with Authentication
// Tests the full integration with proper authentication

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkXeroTables() {
  console.log('\n🔍 Checking Xero Database Tables\n');

  const tables = [
    'xero_integrations',
    'xero_invoices',
    'xero_webhook_events',
    'invoices',
    'invoice_items',
    'invoice_recipients',
    'invoice_payments'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Accessible (${count || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

async function checkXeroColumns() {
  console.log('\n📋 Checking Required Columns\n');

  // Check if profiles table has xero_contact_id
  try {
    const { data: profileSample } = await supabase
      .from('profiles')
      .select('id, name, email, xero_contact_id')
      .limit(1);

    if (profileSample) {
      console.log('✅ profiles table has contact tracking support');
    }
  } catch (err) {
    console.log('❌ profiles.xero_contact_id: Column may not exist');
  }

  // Check invoice columns
  try {
    const { data: invoiceSample } = await supabase
      .from('invoices')
      .select('id, invoice_number, xero_invoice_id, last_synced_at')
      .limit(1);

    if (invoiceSample !== null) {
      console.log('✅ invoices table has Xero sync columns');
    }
  } catch (err) {
    console.log('❌ invoices Xero columns: May not exist');
  }
}

async function testXeroIntegration() {
  console.log('\n🔗 Testing Xero Integration Status\n');

  try {
    // Check for active integrations
    const { data: integrations, error } = await supabase
      .from('xero_integrations')
      .select('*')
      .eq('connection_status', 'active');

    if (error) {
      console.log(`❌ Integration check failed: ${error.message}`);
    } else if (integrations && integrations.length > 0) {
      console.log(`✅ Found ${integrations.length} active Xero integration(s)`);
      integrations.forEach(int => {
        console.log(`   - Tenant: ${int.tenant_name || 'Unknown'}`);
        console.log(`   - Last sync: ${int.last_sync_at || 'Never'}`);
      });
    } else {
      console.log('ℹ️ No active Xero integrations found');
    }
  } catch (err) {
    console.log(`❌ Integration query failed: ${err.message}`);
  }
}

async function createTestData() {
  console.log('\n🧪 Creating Test Data\n');

  try {
    // Create a test invoice
    const testInvoice = {
      invoice_number: `TEST-XERO-${Date.now()}`,
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'draft',
      subtotal: 100.00,
      tax_amount: 10.00,
      total_amount: 110.00,
      currency: 'AUD',
      notes: 'Test invoice for Xero integration testing'
    };

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert(testInvoice)
      .select()
      .single();

    if (error) {
      console.log(`❌ Failed to create test invoice: ${error.message}`);
    } else {
      console.log(`✅ Created test invoice: ${invoice.invoice_number}`);
      
      // Create invoice items
      const { error: itemError } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoice.id,
          description: 'Comedy Show - Test Event',
          quantity: 1,
          unit_price: 100.00,
          total_price: 100.00
        });

      if (!itemError) {
        console.log('✅ Created test invoice item');
      }

      // Create recipient
      const { error: recipientError } = await supabase
        .from('invoice_recipients')
        .insert({
          invoice_id: invoice.id,
          recipient_name: 'Test Promoter',
          recipient_email: 'test@standupsydney.com',
          recipient_type: 'promoter'
        });

      if (!recipientError) {
        console.log('✅ Created test invoice recipient');
      }

      return invoice.id;
    }
  } catch (err) {
    console.log(`❌ Test data creation failed: ${err.message}`);
  }
}

async function cleanupTestData(invoiceId) {
  if (!invoiceId) return;

  console.log('\n🧹 Cleaning up test data\n');

  try {
    // Delete in reverse order of foreign key dependencies
    await supabase.from('invoice_recipients').delete().eq('invoice_id', invoiceId);
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
    await supabase.from('xero_invoices').delete().eq('invoice_id', invoiceId);
    await supabase.from('invoices').delete().eq('id', invoiceId);
    
    console.log('✅ Test data cleaned up');
  } catch (err) {
    console.log(`⚠️ Cleanup warning: ${err.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Xero Integration Database Test\n');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Service Key: ${SUPABASE_SERVICE_KEY ? '✓ Set' : '✗ Not Set'}\n`);

  await checkXeroTables();
  await checkXeroColumns();
  await testXeroIntegration();
  
  const testInvoiceId = await createTestData();
  if (testInvoiceId) {
    await cleanupTestData(testInvoiceId);
  }

  console.log('\n✨ Test complete!');
}

runTests().catch(error => {
  console.error('\n💥 Test failed:', error);
  process.exit(1);
});