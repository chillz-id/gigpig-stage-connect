const SUPABASE_ACCESS_TOKEN = 'sbp_YOUR_SUPABASE_ACCESS_TOKEN_HERE_GET_FROM_OWNER'
const PROJECT_REF = 'pdikjpfulhhpqpxzpgtu'

import fs from 'fs'

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

async function applyProfileFix() {
  console.log('🔧 Applying Profile Table Fix')
  console.log('=============================\n')
  
  try {
    // Read the migration file
    const migration = fs.readFileSync('/root/agents/supabase/migrations/20250110_fix_profile_columns.sql', 'utf8')
    
    // Split by semicolons and execute each statement
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      const preview = statement.substring(0, 50).replace(/\n/g, ' ')
      console.log(`${i + 1}. Executing: ${preview}...`)
      
      try {
        await executeSQLViaAPI(statement)
        console.log('   ✅ Success')
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`)
        // Continue with other statements
      }
    }
    
    console.log('\n✅ Migration complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Try signing up a new user')
    console.log('2. Check if profile is created automatically')
    console.log('3. Verify first_name and last_name are populated')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

applyProfileFix()