const SUPABASE_ACCESS_TOKEN = 'sbp_YOUR_SUPABASE_ACCESS_TOKEN_HERE_GET_FROM_OWNER'
const PROJECT_REF = 'pdikjpfulhhpqpxzpgtu'

async function checkAndFixEmailConfirmation() {
  console.log('🔧 Checking and Fixing Email Confirmation Settings')
  console.log('================================================\n')
  
  try {
    // 1. Get current auth configuration
    console.log('1️⃣ Fetching current auth configuration...')
    const authConfigResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        },
      }
    )
    
    if (!authConfigResponse.ok) {
      throw new Error(`Failed to fetch auth config: ${authConfigResponse.statusText}`)
    }
    
    const currentConfig = await authConfigResponse.json()
    console.log('\n📋 Current Auth Settings:')
    console.log(`   - Enable email confirmations: ${currentConfig.ENABLE_SIGNUP_EMAIL_CONFIRMATIONS === true ? 'YES' : 'NO'}`)
    console.log(`   - Site URL: ${currentConfig.SITE_URL || 'Not set'}`)
    console.log(`   - Redirect URLs: ${currentConfig.URI_ALLOW_LIST || 'Not set'}`)
    
    if (currentConfig.ENABLE_SIGNUP_EMAIL_CONFIRMATIONS === true) {
      console.log('\n⚠️  Email confirmations are ENABLED!')
      console.log('   This requires users to confirm their email before their account is created.')
      console.log('   For testing, it\'s recommended to disable this.\n')
      
      console.log('2️⃣ Disabling email confirmations for testing...')
      
      // Update the configuration
      const updateResponse = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ENABLE_SIGNUP_EMAIL_CONFIRMATIONS: false,
            SITE_URL: currentConfig.SITE_URL || 'http://localhost:8080',
            URI_ALLOW_LIST: currentConfig.URI_ALLOW_LIST || 'http://localhost:8080/*,http://localhost:3000/*'
          })
        }
      )
      
      if (!updateResponse.ok) {
        const error = await updateResponse.text()
        throw new Error(`Failed to update auth config: ${error}`)
      }
      
      console.log('✅ Email confirmations DISABLED successfully!')
      console.log('   Users will now be created immediately upon signup.\n')
    } else {
      console.log('\n✅ Email confirmations are already disabled.')
    }
    
    // 3. Check for any users waiting confirmation
    console.log('\n3️⃣ Checking for users waiting email confirmation...')
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: `
            SELECT id, email, email_confirmed_at, created_at 
            FROM auth.users 
            WHERE email_confirmed_at IS NULL
            ORDER BY created_at DESC
            LIMIT 10
          `
        })
      }
    )
    
    if (response.ok) {
      const result = await response.json()
      if (result.data && result.data.length > 0) {
        console.log(`\n⚠️  Found ${result.data.length} unconfirmed users:`)
        result.data.forEach(user => {
          console.log(`   - ${user.email} (created: ${user.created_at})`)
        })
        console.log('\n   These users need to confirm their email or be manually confirmed.')
      } else {
        console.log('   ✅ No unconfirmed users found.')
      }
    }
    
    console.log('\n=================================================')
    console.log('✅ Auth configuration check complete!\n')
    console.log('📝 Next steps:')
    console.log('1. Try signing up again - users should be created immediately')
    console.log('2. If you still have issues, check the Supabase dashboard')
    console.log('3. For production, remember to re-enable email confirmations')
    console.log('\n⚠️  IMPORTANT: Email confirmations are now DISABLED.')
    console.log('   This is fine for testing but should be re-enabled for production!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Manual Fix Instructions:')
    console.log('1. Go to Supabase Dashboard > Authentication > Settings')
    console.log('2. Under "Email Auth", uncheck "Enable email confirmations"')
    console.log('3. Save the changes')
    console.log('4. Try signing up again')
  }
}

checkAndFixEmailConfirmation()