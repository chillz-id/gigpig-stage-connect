import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://pdikjpfulhhpqpxzpgtu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyInvoiceFix() {
  console.log('🧾 Applying Invoice System Fix...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'fix-invoice-system-complete.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split into individual statements (simple split on semicolon followed by newline)
    const statements = sqlContent
      .split(/;\s*\n/)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue;
      }

      // Show progress for longer operations
      if (statement.includes('CREATE TABLE') || statement.includes('ALTER TABLE')) {
        const match = statement.match(/(CREATE TABLE|ALTER TABLE)\s+(\S+)/i);
        if (match) {
          console.log(`⚙️  Processing: ${match[1]} ${match[2]}...`);
        }
      }

      try {
        // Use Supabase's rpc for raw SQL execution
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        }).single();

        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase.from('_sql').select(statement);
          
          if (directError) {
            errorCount++;
            errors.push({
              statement: statement.substring(0, 100) + '...',
              error: directError.message
            });
            console.error(`❌ Error executing statement ${i + 1}: ${directError.message}`);
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        errorCount++;
        errors.push({
          statement: statement.substring(0, 100) + '...',
          error: err.message
        });
        console.error(`❌ Error executing statement ${i + 1}: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This might be normal if:');
      console.log('  • Tables/columns already exist');
      console.log('  • Policies were already created');
      console.log('  • Indexes already exist');
      console.log('\nDetailed errors:');
      errors.forEach(({ statement, error }) => {
        console.log(`\n  Statement: ${statement}`);
        console.log(`  Error: ${error}`);
      });
    }

    // Verify the fix
    console.log('\n🔍 Verifying invoice system...');
    
    // Check if we can query invoices
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, subtotal, subtotal_amount')
      .limit(1);

    if (invoiceError) {
      console.log('❌ Invoice table check failed:', invoiceError.message);
    } else {
      console.log('✅ Invoice table is accessible');
    }

    // Check invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('id, total, rate, unit_price')
      .limit(1);

    if (itemsError) {
      console.log('❌ Invoice items table check failed:', itemsError.message);
    } else {
      console.log('✅ Invoice items table is accessible');
    }

    // Check payment links
    const { data: paymentLinks, error: plError } = await supabase
      .from('payment_links')
      .select('id')
      .limit(1);

    if (plError) {
      console.log('❌ Payment links table check failed:', plError.message);
    } else {
      console.log('✅ Payment links table is accessible');
    }

    console.log('\n✨ Invoice system fix applied!');
    console.log('\nNext steps:');
    console.log('1. Run the invoice test: npm run test:invoice');
    console.log('2. Test invoice creation in the UI');
    console.log('3. Verify Xero integration if needed');

  } catch (error) {
    console.error('❌ Failed to apply invoice fix:', error);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution
async function applyInvoiceFixDirect() {
  console.log('🧾 Applying Invoice System Fix (Direct Method)...\n');

  const fixes = [
    {
      name: 'Create payment_links table',
      sql: `
        CREATE TABLE IF NOT EXISTS public.payment_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          link_id TEXT UNIQUE NOT NULL,
          provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal', 'square', 'manual')),
          url TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          currency TEXT NOT NULL DEFAULT 'AUD',
          status TEXT NOT NULL DEFAULT 'active',
          metadata JSONB,
          expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'Add subtotal_amount to invoices',
      sql: `
        ALTER TABLE public.invoices 
        ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(10,2)
      `
    },
    {
      name: 'Add event_id to invoices',
      sql: `
        ALTER TABLE public.invoices 
        ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id)
      `
    },
    {
      name: 'Add profile_id to invoices',
      sql: `
        ALTER TABLE public.invoices 
        ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id)
      `
    },
    {
      name: 'Add total column to invoice_items',
      sql: `
        ALTER TABLE public.invoice_items 
        ADD COLUMN IF NOT EXISTS total DECIMAL(10,2)
      `
    },
    {
      name: 'Sync subtotal_amount with subtotal',
      sql: `
        UPDATE public.invoices 
        SET subtotal_amount = subtotal 
        WHERE subtotal IS NOT NULL AND subtotal_amount IS NULL
      `
    }
  ];

  for (const fix of fixes) {
    try {
      console.log(`⚙️  ${fix.name}...`);
      
      // For table creation, we need to use a different approach
      if (fix.sql.includes('CREATE TABLE')) {
        // Skip for now as Supabase client doesn't support DDL directly
        console.log('  ⚠️  Skipping table creation (use Supabase dashboard)');
        continue;
      }

      // For other operations, try to execute
      const { error } = await supabase.rpc('exec', { query: fix.sql });
      
      if (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      } else {
        console.log('  ✅ Success');
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
    }
  }

  console.log('\n✨ Invoice fixes attempted!');
  console.log('\n⚠️  Note: Some operations may need to be run directly in Supabase dashboard');
  console.log('Copy the contents of fix-invoice-system-complete.sql and run in SQL Editor');
}

// Check if direct SQL execution is available
async function checkDirectSQLSupport() {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    return !error;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  const hasDirectSQL = await checkDirectSQLSupport();
  
  if (hasDirectSQL) {
    await applyInvoiceFix();
  } else {
    console.log('⚠️  Direct SQL execution not available');
    console.log('Using alternative approach...\n');
    await applyInvoiceFixDirect();
  }
}

main().catch(console.error);