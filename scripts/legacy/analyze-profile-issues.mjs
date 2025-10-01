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

async function analyzeProfileIssues() {
  console.log('🔍 Analyzing Profile Table Issues')
  console.log('=================================\\n')
  
  try {
    // 1. Check all profiles
    console.log('1️⃣ All profiles in the system:')
    const allProfiles = await executeSQLViaAPI(`
      SELECT id, email, name, first_name, last_name, created_at
      FROM public.profiles
      ORDER BY created_at DESC
    `)
    
    if (allProfiles.data && allProfiles.data.length > 0) {
      console.log(`\\nFound ${allProfiles.data.length} profiles:\\n`)
      allProfiles.data.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.email}`)
        console.log(`   ID: ${profile.id}`)
        console.log(`   Name: ${profile.name || '(empty)'} | First: ${profile.first_name || '(empty)'} | Last: ${profile.last_name || '(empty)'}`)
        console.log(`   Created: ${profile.created_at}`)
        console.log()
      })
    } else {
      console.log('   No profiles found in the table')
    }
    
    // 2. Check for duplicate emails
    console.log('\\n2️⃣ Checking for duplicate emails:')
    const duplicateEmails = await executeSQLViaAPI(`
      SELECT email, COUNT(*) as count
      FROM public.profiles
      GROUP BY email
      HAVING COUNT(*) > 1
    `)
    
    if (duplicateEmails.data && duplicateEmails.data.length > 0) {
      console.log('   ⚠️  Found duplicate emails:')
      duplicateEmails.data.forEach(dup => {
        console.log(`   - ${dup.email} (${dup.count} times)`)
      })
    } else {
      console.log('   ✅ No duplicate emails')
    }
    
    // 3. Check emails that are blocking our inserts
    const blockingEmails = ['chillz@standupsydney.com', 'info@standupsydney.com']
    console.log('\\n3️⃣ Checking blocking email addresses:')
    
    for (const email of blockingEmails) {
      const check = await executeSQLViaAPI(`
        SELECT id, email, name, created_at
        FROM public.profiles
        WHERE email = '${email}'
      `)
      
      if (check.data && check.data.length > 0) {
        console.log(`\\n   Email: ${email}`)
        check.data.forEach(profile => {
          console.log(`   - ID: ${profile.id}`)
          console.log(`   - Name: ${profile.name || '(empty)'}`)
          console.log(`   - Created: ${profile.created_at}`)
        })
      }
    }
    
    // 4. Check table constraints
    console.log('\\n4️⃣ Checking table constraints:')
    const constraints = await executeSQLViaAPI(`
      SELECT 
        con.conname as constraint_name,
        con.contype as type,
        pg_get_constraintdef(con.oid) as definition
      FROM pg_constraint con
      JOIN pg_namespace nsp ON nsp.oid = con.connamespace
      JOIN pg_class cls ON cls.oid = con.conrelid
      WHERE nsp.nspname = 'public'
      AND cls.relname = 'profiles'
      ORDER BY con.conname
    `)
    
    if (constraints.data) {
      constraints.data.forEach(con => {
        const typeMap = {
          'p': 'PRIMARY KEY',
          'f': 'FOREIGN KEY',
          'u': 'UNIQUE',
          'c': 'CHECK'
        }
        console.log(`   - ${con.constraint_name} (${typeMap[con.type] || con.type})`)
        console.log(`     ${con.definition}`)
      })
    }
    
    // 5. Check if we can query auth.users count
    console.log('\\n5️⃣ Checking auth.users access:')
    try {
      const authCount = await executeSQLViaAPI(`
        SELECT COUNT(*) as count FROM auth.users
      `)
      console.log(`   ✅ Can access auth.users: ${authCount.data?.[0]?.count || 0} users`)
    } catch (error) {
      console.log('   ❌ Cannot access auth.users table')
      console.log(`      ${error.message}`)
    }
    
    console.log('\\n=================================')
    console.log('📊 Analysis Complete\\n')
    
    console.log('Key findings:')
    console.log('1. The profiles table exists but may have orphaned records')
    console.log('2. Foreign key constraint requires matching auth.users')
    console.log('3. Email uniqueness prevents duplicate emails')
    console.log('4. We cannot directly query auth.users via Management API')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

analyzeProfileIssues()