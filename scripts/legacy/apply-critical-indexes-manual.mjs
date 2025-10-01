import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Function to execute SQL via the REST API directly
async function executeSQL(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql_query: sql })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    throw new Error(`SQL execution failed: ${error.message}`)
  }
}

async function checkTableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0)
    return !error
  } catch (e) {
    return false
  }
}

async function applyCriticalIndexes() {
  console.log('🚀 Stand Up Sydney - Applying Critical Performance Indexes')
  console.log('=========================================================')
  
  try {
    // Test database connection
    console.log('\n🔍 Testing database connection...')
    const { data: profiles, error: connectionError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (connectionError) {
      throw new Error(`Connection failed: ${connectionError.message}`)
    }
    console.log('✅ Database connection successful')

    // Define critical indexes with table validation
    const criticalIndexes = [
      {
        name: 'profiles_email',
        table: 'profiles',
        description: 'Email lookup for authentication',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email ON profiles(email);'
      },
      {
        name: 'profiles_verified', 
        table: 'profiles',
        description: 'Verified user filtering',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);'
      },
      {
        name: 'events_promoter',
        table: 'events', 
        description: 'Promoter event queries',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_promoter_id ON events(promoter_id);'
      },
      {
        name: 'events_date',
        table: 'events',
        description: 'Date-based event filtering', 
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_event_date ON events(event_date);'
      },
      {
        name: 'applications_comedian',
        table: 'applications',
        description: 'Comedian application history',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_comedian_id ON applications(comedian_id);'
      },
      {
        name: 'applications_event',
        table: 'applications', 
        description: 'Event application lists',
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_event_id ON applications(event_id);'
      },
      {
        name: 'notifications_user',
        table: 'notifications',
        description: 'User notification queries', 
        sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);'
      }
    ]

    console.log(`\n🎯 Attempting to create ${criticalIndexes.length} critical indexes...\n`)

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (let i = 0; i < criticalIndexes.length; i++) {
      const index = criticalIndexes[i]
      console.log(`[${i + 1}/${criticalIndexes.length}] ${index.name} (${index.description})`)

      // Check if table exists
      const tableExists = await checkTableExists(index.table)
      if (!tableExists) {
        console.log(`⚠️  Table ${index.table} does not exist, skipping...`)
        skipCount++
        continue
      }

      try {
        // Try creating the index using direct SQL execution
        // First, let's try without the exec_sql function
        
        // Since we can't use exec_sql, let's try a simpler approach
        // We'll create a SQL file and recommend manual execution
        
        console.log('⚠️  Creating index requires manual execution in Supabase SQL Editor')
        console.log(`   SQL: ${index.sql}`)
        
        // For now, we'll log this as requiring manual action
        skipCount++
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`)
        errorCount++
      }
    }

    console.log('\n=======================================================')
    console.log(`✅ Successfully created: ${successCount}`)
    console.log(`⚠️  Require manual creation: ${skipCount}`)
    console.log(`❌ Failed: ${errorCount}`)

    if (skipCount > 0) {
      console.log('\n📋 MANUAL ACTION REQUIRED:')
      console.log('The following indexes need to be created manually in the Supabase SQL Editor:')
      console.log('=' .repeat(80))
      
      criticalIndexes.forEach((index, i) => {
        console.log(`-- ${i + 1}. ${index.description}`)
        console.log(index.sql)
        console.log('')
      })
      
      console.log('=' .repeat(80))
      console.log('💡 Copy and paste each CREATE INDEX statement into the Supabase SQL Editor')
      console.log('🔗 Access SQL Editor at: https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu/sql')
    }

    // Test some queries to show current performance characteristics
    console.log('\n📊 Testing current query performance...')
    
    try {
      console.log('🔍 Testing profile email lookup...')
      const start1 = Date.now()
      const { data: emailTest, error: emailError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('email', 'info@standupsydney.com')
        .single()
      const duration1 = Date.now() - start1
      
      if (!emailError) {
        console.log(`✅ Profile email lookup completed in ${duration1}ms`)
      }

      console.log('🔍 Testing profile count...')
      const start2 = Date.now()  
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      const duration2 = Date.now() - start2
      
      if (!countError) {
        console.log(`✅ Profile count (${count} profiles) completed in ${duration2}ms`)
      }
      
    } catch (queryError) {
      console.log('⚠️  Query performance test failed:', queryError.message)
    }

    console.log('\n✨ Critical index setup process complete!')
    console.log('💡 Remember to execute the manual SQL statements in the Supabase dashboard.')

  } catch (error) {
    console.error('\n❌ Process failed:', error.message)
    process.exit(1)
  }
}

// Run the process
applyCriticalIndexes()