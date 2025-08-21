import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pdikjpfulhhpqpxzpgtu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkInvoiceSystem() {
  console.log('🧾 Checking Invoice System Structure...\n');

  try {
    // 1. Check invoices table structure
    console.log('1️⃣ Checking Invoices Table:');
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);
    
    if (!invoiceError) {
      if (invoiceData && invoiceData.length > 0) {
        const columns = Object.keys(invoiceData[0]);
        console.log('✅ Invoices table exists');
        console.log('Columns:', columns.join(', '));
        console.log('\nSample data:', JSON.stringify(invoiceData[0], null, 2));
      } else {
        console.log('⚠️ Invoices table exists but is empty');
        // Still check structure via query
        const { data: schemaData } = await supabase.rpc('get_table_columns', {
          table_name: 'invoices'
        }).single();
        if (schemaData) {
          console.log('Table structure:', schemaData);
        }
      }
    } else {
      console.log(`❌ Error accessing invoices: ${invoiceError.message}`);
    }

    // 2. Check invoice_items table
    console.log('\n2️⃣ Checking Invoice Items Table:');
    const { data: itemsData, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .limit(1);
    
    if (!itemsError) {
      if (itemsData && itemsData.length > 0) {
        const columns = Object.keys(itemsData[0]);
        console.log('✅ Invoice items table exists');
        console.log('Columns:', columns.join(', '));
      } else {
        console.log('⚠️ Invoice items table exists but is empty');
      }
    } else {
      console.log(`❌ Error accessing invoice_items: ${itemsError.message}`);
    }

    // 3. Check invoice_payment_links table
    console.log('\n3️⃣ Checking Invoice Payment Links Table:');
    const { data: paymentLinksData, error: paymentLinksError } = await supabase
      .from('invoice_payment_links')
      .select('*')
      .limit(1);
    
    if (!paymentLinksError) {
      console.log('✅ Invoice payment links table exists');
      if (paymentLinksData && paymentLinksData.length > 0) {
        const columns = Object.keys(paymentLinksData[0]);
        console.log('Columns:', columns.join(', '));
      }
    } else {
      console.log(`❌ Error accessing invoice_payment_links: ${paymentLinksError.message}`);
    }

    // 4. Check payment_links table
    console.log('\n4️⃣ Checking Payment Links Table:');
    const { data: plData, error: plError } = await supabase
      .from('payment_links')
      .select('*')
      .limit(1);
    
    if (!plError) {
      console.log('✅ Payment links table exists');
      if (plData && plData.length > 0) {
        const columns = Object.keys(plData[0]);
        console.log('Columns:', columns.join(', '));
      }
    } else {
      console.log(`❌ Error accessing payment_links: ${plError.message}`);
    }

    // 5. Check xero_integrations table
    console.log('\n5️⃣ Checking Xero Integrations Table:');
    const { data: xeroData, error: xeroError } = await supabase
      .from('xero_integrations')
      .select('*')
      .limit(1);
    
    if (!xeroError) {
      console.log('✅ Xero integrations table exists');
      if (xeroData && xeroData.length > 0) {
        const columns = Object.keys(xeroData[0]);
        console.log('Columns:', columns.join(', '));
      }
    } else {
      console.log(`❌ Error accessing xero_integrations: ${xeroError.message}`);
    }

    // 6. Test invoice relationships
    console.log('\n6️⃣ Testing Invoice Relationships:');
    
    // Test invoice -> profile relationship
    const { error: invProfileError } = await supabase
      .from('invoices')
      .select(`
        *,
        profile:profiles(id, email, first_name, last_name),
        event:events(id, title, date)
      `)
      .limit(1);
    
    if (!invProfileError) {
      console.log('✅ Invoice -> profiles/events relationships working');
    } else {
      console.log(`❌ Invoice relationships error: ${invProfileError.message}`);
    }

    // 7. Check for invoice-related functions
    console.log('\n7️⃣ Checking Invoice-Related Functions:');
    const functions = [
      'calculate_invoice_total',
      'generate_invoice_number',
      'update_invoice_status'
    ];
    
    for (const func of functions) {
      try {
        // Try to call the function with dummy params to see if it exists
        const { error } = await supabase.rpc(func, {});
        if (error && error.message.includes('not exist')) {
          console.log(`❌ Function ${func} does not exist`);
        } else {
          console.log(`✅ Function ${func} exists`);
        }
      } catch (e) {
        console.log(`❌ Function ${func} check failed`);
      }
    }

    // 8. Check invoice statistics
    console.log('\n8️⃣ Invoice Statistics:');
    const { data: invoiceCount } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true });
    
    console.log(`Total invoices: ${invoiceCount || 0}`);

    // Check invoice statuses
    const { data: statusData } = await supabase
      .from('invoices')
      .select('status')
      .not('status', 'is', null);
    
    if (statusData && statusData.length > 0) {
      const statuses = [...new Set(statusData.map(inv => inv.status))];
      console.log('Invoice statuses in use:', statuses.join(', '));
    }

    // 9. Check for critical invoice columns
    console.log('\n9️⃣ Checking Critical Invoice Columns:');
    const requiredColumns = [
      'id', 'invoice_number', 'status', 'issue_date', 'due_date',
      'subtotal', 'tax_amount', 'total_amount', 'profile_id',
      'event_id', 'created_at', 'updated_at'
    ];
    
    // Get actual columns if we have data
    if (invoiceData && invoiceData.length > 0) {
      const actualColumns = Object.keys(invoiceData[0]);
      const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`❌ Missing critical columns: ${missingColumns.join(', ')}`);
      } else {
        console.log('✅ All critical columns present');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkInvoiceSystem();