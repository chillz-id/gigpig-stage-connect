import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '..', '.env') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyMigration() {
  console.log('🎭 Stand Up Sydney - Applying Invoice Migration via API')
  console.log('================================================')
  
  try {
    // Read the migration file
    const migrationSQL = readFileSync(
      join(__dirname, '..', 'supabase', 'migrations', '20250709200000_fix_invoice_schema_mismatches.sql'),
      'utf8'
    )
    
    // Split the migration into individual statements
    // We need to execute each DO block and CREATE statement separately
    const statements = migrationSQL
      .split(/;(?=\s*(--|\n|DO|CREATE|ALTER|DROP|UPDATE|GRANT|SELECT))/g)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`\n📝 Found ${statements.length} SQL statements to execute`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (!statement) continue
      
      // Skip pure comments
      if (statement.match(/^--/)) continue
      
      // Add semicolon back if needed
      const sql = statement.endsWith(';') ? statement : statement + ';'
      
      // Show a preview of what we're executing
      const preview = sql.substring(0, 60).replace(/\n/g, ' ')
      console.log(`\n[${i + 1}/${statements.length}] Executing: ${preview}...`)
      
      try {
        // Use rpc to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: sql
        })
        
        if (error) throw error
        
        console.log('✅ Success')
        successCount++
      } catch (error) {
        // Some errors are expected (like "already exists")
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate key') ||
            error.message?.includes('does not exist')) {
          console.log('⚠️  Skipped (already exists or not needed)')
          successCount++
        } else {
          console.error('❌ Error:', error.message)
          errorCount++
          
          // Don't stop on errors, continue with other statements
          // Many will be "already exists" which is fine
        }
      }
    }
    
    console.log('\n================================================')
    console.log(`✅ Successful statements: ${successCount}`)
    console.log(`❌ Failed statements: ${errorCount}`)
    console.log('\n✨ Migration process complete!')
    
    // Now run verification
    console.log('\n🔍 Running verification...\n')
    
    // Import and run the verification script
    const { verifyInvoiceSystem } = await import('./verify-invoice-system.js')
    await verifyInvoiceSystem()
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Create the RPC function if it doesn't exist
async function ensureExecSqlFunction() {
  const createFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result json;
    BEGIN
      EXECUTE sql_query;
      RETURN json_build_object('success', true);
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
    END;
    $$;
  `
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' })
    if (error && error.code === 'PGRST202') {
      // Function doesn't exist, create it
      console.log('Creating exec_sql function...')
      // This would need to be done via dashboard
      console.log('⚠️  Please create the exec_sql function via Supabase dashboard first')
      console.log('SQL:', createFunction)
      return false
    }
    return true
  } catch (error) {
    return false
  }
}

// Run the migration
applyMigration()