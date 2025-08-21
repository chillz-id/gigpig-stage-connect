import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read environment variables
const SUPABASE_ACCESS_TOKEN = 'sbp_YOUR_SUPABASE_ACCESS_TOKEN_HERE_GET_FROM_OWNER'
const PROJECT_REF = 'pdikjpfulhhpqpxzpgtu'

async function executeSQLViaAPI(sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    }
  )
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${error}`)
  }
  
  return await response.json()
}

async function applyMigration() {
  console.log('🎭 Stand Up Sydney - Applying Invoice Migration via Supabase API')
  console.log('=============================================================')
  
  try {
    // Read the migration file
    const migrationSQL = readFileSync(
      join(__dirname, '..', 'supabase', 'migrations', '20250709200000_fix_invoice_schema_mismatches.sql'),
      'utf8'
    )
    
    // Execute the entire migration as one statement
    console.log('\n📝 Executing migration...\n')
    
    const result = await executeSQLViaAPI(migrationSQL)
    
    console.log('✅ Migration applied successfully!')
    console.log('Result:', JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    
    // If the full migration fails, try breaking it down
    console.log('\n🔧 Attempting to apply migration in parts...\n')
    
    // Try just the critical parts first
    const criticalParts = [
      // Create webhook_logs table
      `CREATE TABLE IF NOT EXISTS public.webhook_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL,
        signature TEXT,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed BOOLEAN DEFAULT FALSE,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      
      // Add invoice columns
      `ALTER TABLE public.invoices 
       ADD COLUMN IF NOT EXISTS invoice_type TEXT NOT NULL DEFAULT 'other' CHECK (invoice_type IN ('promoter', 'comedian', 'other')),
       ADD COLUMN IF NOT EXISTS tax_treatment TEXT DEFAULT 'inclusive' CHECK (tax_treatment IN ('inclusive', 'exclusive', 'none')),
       ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),
       ADD COLUMN IF NOT EXISTS terms TEXT;`,
      
      // Add invoice_items columns
      `ALTER TABLE public.invoice_items
       ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),
       ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
       ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2),
       ADD COLUMN IF NOT EXISTS item_order INTEGER DEFAULT 0;`,
      
      // Update invoice_items data
      `UPDATE public.invoice_items 
       SET subtotal = COALESCE(rate, 0) * COALESCE(quantity, 1)
       WHERE subtotal IS NULL;`,
      
      `UPDATE public.invoice_items 
       SET total_price = COALESCE(subtotal, 0) + COALESCE(tax_amount, 0)
       WHERE total_price IS NULL;`
    ]
    
    for (let i = 0; i < criticalParts.length; i++) {
      try {
        console.log(`Applying part ${i + 1}/${criticalParts.length}...`)
        await executeSQLViaAPI(criticalParts[i])
        console.log('✅ Success')
      } catch (partError) {
        console.log('⚠️  Error:', partError.message)
      }
    }
  }
}

// Run the migration
applyMigration()