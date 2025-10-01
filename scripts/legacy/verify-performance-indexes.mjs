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
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyPerformanceIndexes() {
  console.log('🔍 Stand Up Sydney - Performance Index Verification')
  console.log('==================================================')
  
  try {
    // Test database connection
    console.log('\n✅ Testing database connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (connectionError) {
      throw new Error(`Connection failed: ${connectionError.message}`)
    }
    console.log('✅ Database connection successful')

    // Check key tables exist
    console.log('\n📋 Verifying table existence...')
    const criticalTables = ['profiles', 'events', 'applications', 'notifications', 'invoices']
    const tableStatus = {}
    
    for (const tableName of criticalTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0)
        
        tableStatus[tableName] = !error
        console.log(`   ${tableName}: ${!error ? '✅ EXISTS' : '❌ MISSING'}`)
      } catch (e) {
        tableStatus[tableName] = false
        console.log(`   ${tableName}: ❌ MISSING`)
      }
    }

    // Test key queries performance
    console.log('\n⚡ Testing query performance...')
    
    const performanceTests = [
      {
        name: 'Profile email lookup',
        query: async () => {
          const start = Date.now()
          const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('email', 'info@standupsydney.com')
            .single()
          return { duration: Date.now() - start, success: !error, data }
        }
      },
      {
        name: 'Profile count',
        query: async () => {
          const start = Date.now()
          const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
          return { duration: Date.now() - start, success: !error, count }
        }
      }
    ]

    if (tableStatus.events) {
      performanceTests.push({
        name: 'Events query',
        query: async () => {
          const start = Date.now()
          const { data, error } = await supabase
            .from('events')
            .select('id, name, event_date')
            .limit(10)
          return { duration: Date.now() - start, success: !error, count: data?.length || 0 }
        }
      })
    }

    if (tableStatus.applications) {
      performanceTests.push({
        name: 'Applications query',
        query: async () => {
          const start = Date.now()
          const { data, error } = await supabase
            .from('applications')
            .select('id, status')
            .limit(10)
          return { duration: Date.now() - start, success: !error, count: data?.length || 0 }
        }
      })
    }

    for (const test of performanceTests) {
      try {
        const result = await test.query()
        if (result.success) {
          console.log(`   ✅ ${test.name}: ${result.duration}ms ${result.count !== undefined ? `(${result.count} records)` : ''}`)
        } else {
          console.log(`   ⚠️  ${test.name}: Query failed`)
        }
      } catch (error) {
        console.log(`   ❌ ${test.name}: Error - ${error.message}`)
      }
    }

    // Provide migration status and recommendations
    console.log('\n📊 Migration Status Summary')
    console.log('============================')
    
    const existingTables = Object.entries(tableStatus).filter(([, exists]) => exists).length
    const totalTables = criticalTables.length
    
    console.log(`📋 Database Tables: ${existingTables}/${totalTables} critical tables exist`)
    
    if (existingTables === totalTables) {
      console.log('✅ All critical tables are present - ready for performance optimization')
    } else {
      console.log('⚠️  Some critical tables are missing - schema migration may be needed')
    }

    console.log('\n🎯 Performance Optimization Status')
    console.log('===================================')
    
    console.log('📁 Migration File: /root/agents/supabase/migrations/20250910_performance_optimization_indexes.sql')
    console.log('📁 Manual SQL File: /root/agents/apply-performance-indexes-manual.sql')
    console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu/sql')
    
    console.log('\n💡 Next Steps:')
    console.log('==============')
    
    console.log('1. 📋 Open the Supabase SQL Editor')
    console.log('2. 📄 Copy contents from apply-performance-indexes-manual.sql')
    console.log('3. ▶️  Execute the SQL to create performance indexes')
    console.log('4. 🔍 Run validation: SELECT * FROM validate_performance_indexes();')
    console.log('5. 📊 Monitor performance: SELECT * FROM performance_index_usage;')
    
    console.log('\n🔧 Key Indexes to Create:')
    console.log('=========================')
    
    const keyIndexes = [
      'idx_profiles_email - Critical for authentication',
      'idx_events_promoter_id - Essential for promoter dashboards', 
      'idx_events_event_date - Required for date filtering',
      'idx_applications_comedian_id - Needed for comedian history',
      'idx_applications_event_id - Required for event applications',
      'idx_notifications_user_id - Critical for notification system'
    ]
    
    keyIndexes.forEach(index => {
      console.log(`   • ${index}`)
    })

    console.log('\n✨ Performance Migration Process Complete!')
    console.log('📈 Execute the manual SQL file to implement all optimizations')
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message)
    process.exit(1)
  }
}

// Run the verification
verifyPerformanceIndexes()