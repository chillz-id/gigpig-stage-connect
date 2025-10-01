import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read environment variables from process.env
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_SERVICE_KEY
const PROJECT_REF = 'pdikjpfulhhpqpxzpgtu'

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable not set')
  process.exit(1)
}

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

async function applyPerformanceMigration() {
  console.log('🚀 Stand Up Sydney - Applying Performance Optimization Migration')
  console.log('================================================================')
  
  try {
    // Read the migration file
    const migrationSQL = readFileSync(
      join(__dirname, '..', 'supabase', 'migrations', '20250910_performance_optimization_indexes.sql'),
      'utf8'
    )
    
    console.log('\n📝 Executing performance optimization migration...\n')
    
    // Execute the entire migration as one statement
    const result = await executeSQLViaAPI(migrationSQL)
    
    console.log('✅ Performance Migration applied successfully!')
    console.log('Result:', JSON.stringify(result, null, 2))
    
    // Validate the migration was successful
    console.log('\n🔍 Validating migration results...\n')
    
    const validationResult = await executeSQLViaAPI(
      'SELECT * FROM validate_performance_indexes();'
    )
    
    console.log('✅ Validation Results:')
    console.log(JSON.stringify(validationResult, null, 2))
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    
    // If the full migration fails, try applying critical indexes one by one
    console.log('\n🔧 Attempting to apply critical indexes individually...\n')
    
    const criticalIndexes = [
      // User authentication & profile system
      'CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);',
      'CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);',
      
      // Event management system  
      'CREATE INDEX IF NOT EXISTS idx_events_promoter_id ON events(promoter_id);',
      'CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);',
      'CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);',
      
      // Application management system
      'CREATE INDEX IF NOT EXISTS idx_applications_comedian_id ON applications(comedian_id);',
      'CREATE INDEX IF NOT EXISTS idx_applications_event_id ON applications(event_id);',
      'CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);',
      
      // Communication system
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);',
      
      // Financial system
      'CREATE INDEX IF NOT EXISTS idx_invoices_promoter_id ON invoices(promoter_id);',
      'CREATE INDEX IF NOT EXISTS idx_invoices_comedian_id ON invoices(comedian_id);',
      'CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);',
    ]
    
    for (let i = 0; i < criticalIndexes.length; i++) {
      try {
        console.log(`Creating index ${i + 1}/${criticalIndexes.length}...`)
        await executeSQLViaAPI(criticalIndexes[i])
        console.log('✅ Success')
      } catch (indexError) {
        console.log('⚠️  Error:', indexError.message)
      }
    }
    
    // Try creating the monitoring views
    console.log('\n📊 Creating monitoring views...\n')
    
    const monitoringViews = [
      `CREATE OR REPLACE VIEW performance_index_usage AS
      SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC;`,
      
      `CREATE OR REPLACE VIEW performance_table_usage AS
      SELECT 
          schemaname,
          tablename,
          seq_scan as sequential_scans,
          seq_tup_read as sequential_tuples_read,
          idx_scan as index_scans,
          idx_tup_fetch as index_tuples_fetched,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY seq_scan + idx_scan DESC;`
    ]
    
    for (let view of monitoringViews) {
      try {
        await executeSQLViaAPI(view)
        console.log('✅ Monitoring view created')
      } catch (viewError) {
        console.log('⚠️  View creation error:', viewError.message)
      }
    }
  }
}

// Run the migration
applyPerformanceMigration()