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

async function setupExecSqlFunction() {
  console.log('🔧 Setting up exec_sql function for database operations...')
  
  // The exec_sql function definition
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result json;
    BEGIN
      EXECUTE sql_query;
      RETURN json_build_object('success', true, 'message', 'Query executed successfully');
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
    END;
    $$;
  `
  
  try {
    // First, test if we can connect to the database
    console.log('🔍 Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (testError) {
      throw new Error(`Connection test failed: ${testError.message}`)
    }
    console.log('✅ Database connection successful')
    
    // Try to create the exec_sql function by splitting into manageable parts
    console.log('📝 Creating exec_sql function...')
    
    // We'll need to execute this through the SQL editor or use a different approach
    // For now, let's try a simple query to see what functions exist
    const { data: functionCheck, error: functionError } = await supabase
      .rpc('exec_sql', { sql_query: 'SELECT 1 as test;' })
      .single()
    
    if (functionError) {
      if (functionError.code === 'PGRST202') {
        console.log('⚠️  exec_sql function does not exist. It needs to be created manually.')
        console.log('📋 Please execute the following SQL in the Supabase SQL Editor:')
        console.log('=' .repeat(80))
        console.log(createFunctionSQL)
        console.log('=' .repeat(80))
        
        // Try alternative approach - create via a simpler method
        console.log('\n🔄 Attempting alternative creation method...')
        
        // Write the SQL to a file for manual execution
        const { writeFileSync } = await import('fs')
        writeFileSync(
          join(__dirname, '..', 'create-exec-sql-function.sql'), 
          createFunctionSQL
        )
        console.log('📄 SQL file created at: create-exec-sql-function.sql')
        console.log('💡 Execute this file in Supabase SQL Editor to create the function')
        
        return false
      } else {
        throw functionError
      }
    } else {
      console.log('✅ exec_sql function is already available and working!')
      console.log('🧪 Test result:', functionCheck)
      return true
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    return false
  }
}

// Run the setup
setupExecSqlFunction().then(success => {
  if (success) {
    console.log('\n🎉 exec_sql function is ready for use!')
    console.log('💡 You can now run performance migration scripts.')
  } else {
    console.log('\n⚠️  exec_sql function needs to be created manually.')
    console.log('📋 Follow the instructions above to create it in Supabase SQL Editor.')
  }
})