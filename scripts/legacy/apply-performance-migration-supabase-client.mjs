import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY')
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Function to create exec_sql if it doesn't exist
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
    console.log('🔧 Ensuring exec_sql function exists...')
    
    // Try to create the function directly via a simple query
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'exec_sql')
      .eq('routine_schema', 'public')

    if (error) {
      console.log('⚠️  Could not check for exec_sql function:', error.message)
    }

    // Try to create the function - if it fails, we'll handle it
    const result = await supabase.rpc('exec_sql', { 
      sql_query: createFunction 
    })
    
    if (result.error && result.error.code === 'PGRST202') {
      console.log('📝 Creating exec_sql function via direct SQL execution...')
      // We need to execute this via the SQL editor or handle it differently
      return false
    }
    
    console.log('✅ exec_sql function is available')
    return true
  } catch (error) {
    console.log('⚠️  exec_sql function setup:', error.message)
    return false
  }
}

async function applyPerformanceMigration() {
  console.log('🚀 Stand Up Sydney - Performance Optimization Migration')
  console.log('=====================================================')
  console.log(`🔗 Connecting to: ${supabaseUrl}`)
  console.log(`🔑 Using service key: ${supabaseServiceKey.substring(0, 20)}...`)
  
  try {
    // First, let's verify connection by checking a known table
    console.log('\n🔍 Verifying database connection...')
    const { data: profileCheck, error: connectionError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (connectionError) {
      // If profiles doesn't exist, try events
      const { data: eventCheck, error: eventError } = await supabase
        .from('events')
        .select('id')
        .limit(1)
      
      if (eventError) {
        throw new Error(`Connection failed: ${connectionError.message}`)
      }
      console.log('✅ Connected! Events table is accessible')
    } else {
      console.log('✅ Connected! Profiles table is accessible')
    }

    // Read the migration file
    const migrationSQL = readFileSync(
      join(__dirname, '..', 'supabase', 'migrations', '20250910_performance_optimization_indexes.sql'),
      'utf8'
    )
    
    console.log('\n📝 Processing migration file...')
    
    // Try to apply critical indexes one by one using direct SQL queries
    const criticalIndexes = [
      // User authentication & profile system
      { name: 'profiles_email', sql: 'CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);' },
      { name: 'profiles_verified', sql: 'CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);' },
      
      // Event management system  
      { name: 'events_promoter', sql: 'CREATE INDEX IF NOT EXISTS idx_events_promoter_id ON events(promoter_id);' },
      { name: 'events_date', sql: 'CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);' },
      { name: 'events_status', sql: 'CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);' },
      
      // Application management system
      { name: 'applications_comedian', sql: 'CREATE INDEX IF NOT EXISTS idx_applications_comedian_id ON applications(comedian_id);' },
      { name: 'applications_event', sql: 'CREATE INDEX IF NOT EXISTS idx_applications_event_id ON applications(event_id);' },
      { name: 'applications_status', sql: 'CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);' },
      
      // Communication system
      { name: 'notifications_user', sql: 'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);' },
      { name: 'notifications_read', sql: 'CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);' },
      
      // Financial system
      { name: 'invoices_promoter', sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_promoter_id ON invoices(promoter_id);' },
      { name: 'invoices_comedian', sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_comedian_id ON invoices(comedian_id);' },
    ]
    
    console.log(`\n🎯 Applying ${criticalIndexes.length} critical performance indexes...\n`)
    
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    
    for (let i = 0; i < criticalIndexes.length; i++) {
      const index = criticalIndexes[i]
      console.log(`[${i + 1}/${criticalIndexes.length}] Creating ${index.name}...`)
      
      try {
        // Check if table exists first by trying to query it
        const tableName = index.sql.match(/ON (\w+)\(/)?.[1]
        if (tableName) {
          try {
            const { error: tableError } = await supabase
              .from(tableName)
              .select('*')
              .limit(0)
            
            if (tableError) {
              console.log(`⚠️  Table ${tableName} does not exist, skipping...`)
              skipCount++
              continue
            }
          } catch (e) {
            console.log(`⚠️  Cannot access table ${tableName}, skipping...`)
            skipCount++
            continue
          }
        }

        // Try using rpc to execute SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: index.sql
        })
        
        if (error) {
          if (error.code === 'PGRST202') {
            // exec_sql function doesn't exist, try alternative approach
            console.log('⚠️  exec_sql function not available, trying direct approach...')
            
            // For index creation, we can't use the Supabase client directly
            // We need to handle this differently
            console.log('⚠️  Skipping due to missing exec_sql function')
            skipCount++
          } else if (error.message?.includes('already exists')) {
            console.log('✅ Already exists')
            successCount++
          } else {
            throw error
          }
        } else {
          console.log('✅ Created successfully')
          successCount++
        }
      } catch (error) {
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate')) {
          console.log('✅ Already exists')
          successCount++
        } else {
          console.log(`❌ Error: ${error.message}`)
          errorCount++
        }
      }
    }
    
    console.log('\n=================================================')
    console.log(`✅ Successful indexes: ${successCount}`)
    console.log(`⚠️  Skipped indexes: ${skipCount}`)
    console.log(`❌ Failed indexes: ${errorCount}`)
    
    // Try to check what indexes actually exist using RPC
    console.log('\n🔍 Checking existing indexes...')
    try {
      const { data: indexResult, error: indexError } = await supabase.rpc('exec_sql', {
        sql_query: `
          SELECT indexname, tablename 
          FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND indexname LIKE 'idx_%' 
          ORDER BY tablename;
        `
      })

      if (indexError) {
        console.log('⚠️  Could not retrieve index list via RPC:', indexError.message)
      } else if (indexResult && indexResult.success) {
        console.log('📊 Index check completed via RPC')
      }
    } catch (indexError) {
      console.log('⚠️  Could not retrieve index list:', indexError.message)
    }

    console.log('\n✨ Performance migration process complete!')
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some indexes failed to create. This may be due to:')
      console.log('   - Missing tables in the current database schema')
      console.log('   - Insufficient permissions')
      console.log('   - Database connection issues')
      console.log('\n💡 Recommendation: Check the Supabase dashboard for manual index creation if needed.')
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run the migration
applyPerformanceMigration()