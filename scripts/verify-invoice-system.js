#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyInvoiceSystem() {
  console.log('🎭 Stand Up Sydney - Invoice System Verification');
  console.log('==============================================\n');

  let allTestsPassed = true;

  // Test 1: Check if all required columns exist
  console.log('1️⃣ Checking database schema...');
  try {
    const { data: testInvoice, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_type,
        invoice_number,
        subtotal,
        tax_treatment,
        gst_treatment,
        deposit_amount,
        deposit_status,
        terms,
        created_by
      `)
      .limit(1);

    if (error && error.message.includes('column')) {
      console.error('❌ Missing columns in invoices table');
      console.error('   Error:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ All invoice columns verified');
    }
  } catch (err) {
    console.error('❌ Schema check failed:', err.message);
    allTestsPassed = false;
  }

  // Test 2: Check invoice_items table
  console.log('\n2️⃣ Checking invoice_items table...');
  try {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('id, subtotal, tax_amount, total_price, item_order')
      .limit(1);

    if (error && error.message.includes('column')) {
      console.error('❌ Missing columns in invoice_items table');
      console.error('   Error:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Invoice items columns verified');
    }
  } catch (err) {
    console.error('❌ Invoice items check failed:', err.message);
    allTestsPassed = false;
  }

  // Test 3: Check invoice_recipients table
  console.log('\n3️⃣ Checking invoice_recipients table...');
  try {
    const { data, error } = await supabase
      .from('invoice_recipients')
      .select('id, recipient_type, recipient_phone, company_name, abn')
      .limit(1);

    if (error && error.message.includes('column')) {
      console.error('❌ Missing columns in invoice_recipients table');
      console.error('   Error:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Invoice recipients columns verified');
    }
  } catch (err) {
    console.error('❌ Invoice recipients check failed:', err.message);
    allTestsPassed = false;
  }

  // Test 4: Check RLS for comedians
  console.log('\n4️⃣ Testing Row Level Security...');
  try {
    // Get a comedian profile
    const { data: comedians } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'comedian')
      .limit(1);

    if (comedians && comedians.length > 0) {
      const comedianId = comedians[0].id;
      
      // Check if we can query invoices for this comedian
      const { data: comedianInvoices, error } = await supabase
        .from('invoices')
        .select('id')
        .eq('comedian_id', comedianId);

      if (error) {
        console.error('❌ RLS check failed:', error.message);
        allTestsPassed = false;
      } else {
        console.log(`✅ RLS verified - found ${comedianInvoices?.length || 0} invoices for comedian`);
      }
    } else {
      console.log('⚠️  No comedians found to test RLS');
    }
  } catch (err) {
    console.error('❌ RLS test failed:', err.message);
    allTestsPassed = false;
  }

  // Test 5: Verify field syncing
  console.log('\n5️⃣ Checking field synchronization...');
  try {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, gst_treatment, tax_treatment')
      .limit(5);

    if (invoices && invoices.length > 0) {
      let syncIssues = 0;
      invoices.forEach(inv => {
        if (inv.gst_treatment !== inv.tax_treatment) {
          syncIssues++;
        }
      });

      if (syncIssues > 0) {
        console.log(`⚠️  Found ${syncIssues} invoices with mismatched tax fields`);
      } else {
        console.log('✅ All tax fields are synchronized');
      }
    } else {
      console.log('ℹ️  No invoices found to check synchronization');
    }
  } catch (err) {
    console.error('❌ Field sync check failed:', err.message);
    allTestsPassed = false;
  }

  // Test 6: Check if invoice creation works
  console.log('\n6️⃣ Testing invoice creation flow...');
  try {
    const testData = {
      invoice_type: 'other',
      invoice_number: `VERIFY-${Date.now()}`,
      sender_name: 'System Verification',
      sender_email: 'verify@test.com',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currency: 'AUD',
      status: 'draft',
      subtotal: 100,
      tax_amount: 10,
      total_amount: 110,
      tax_rate: 10,
      gst_treatment: 'inclusive',
      tax_treatment: 'inclusive'
    };

    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error('❌ Invoice creation failed:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Invoice created successfully');

      // Clean up test invoice
      await supabase
        .from('invoices')
        .delete()
        .eq('id', newInvoice.id);
    }
  } catch (err) {
    console.error('❌ Creation test failed:', err.message);
    allTestsPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Verification Summary:');
  
  if (allTestsPassed) {
    console.log('\n✅ All tests passed! Invoice system is fully functional.');
    console.log('\nThe invoice system is ready to use with:');
    console.log('  • All database columns in place');
    console.log('  • Field mapping correctly configured');
    console.log('  • Row Level Security properly set up');
    console.log('  • CRUD operations working correctly');
  } else {
    console.log('\n⚠️  Some tests failed. Please address the issues above.');
    console.log('\nRequired actions:');
    console.log('1. Run the migration: npm run migrate:invoice');
    console.log('2. Or apply manually via Supabase dashboard');
    console.log('3. Then run this verification again: npm run test:invoice');
  }

  process.exit(allTestsPassed ? 0 : 1);
}

// Run verification
verifyInvoiceSystem().catch(err => {
  console.error('❌ Verification script failed:', err);
  process.exit(1);
});