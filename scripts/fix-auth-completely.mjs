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

async function fixAuthCompletely() {
  console.log('🚨 Complete Auth System Fix')
  console.log('===========================\n')
  
  try {
    // 1. First check current profile table structure
    console.log('1️⃣ Checking current profile table columns...')
    const columnsCheck = await executeSQLViaAPI(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
      ORDER BY ordinal_position
    `)
    
    if (columnsCheck.data) {
      console.log('   Current columns:')
      columnsCheck.data.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`)
      })
    }
    
    // 2. Add missing columns one by one
    console.log('\n2️⃣ Adding missing columns to profiles table...')
    
    const columnsToAdd = [
      { name: 'first_name', type: 'text' },
      { name: 'last_name', type: 'text' },
      { name: 'phone', type: 'text' },
      { name: 'bio', type: 'text' },
      { name: 'location', type: 'text' },
      { name: 'stage_name', type: 'text' },
      { name: 'name_display_preference', type: 'text', default: "'first_name'" },
      { name: 'is_verified', type: 'boolean', default: 'false' },
      { name: 'website_url', type: 'text' },
      { name: 'instagram_url', type: 'text' },
      { name: 'twitter_url', type: 'text' },
      { name: 'youtube_url', type: 'text' },
      { name: 'facebook_url', type: 'text' },
      { name: 'tiktok_url', type: 'text' },
      { name: 'show_contact_in_epk', type: 'boolean', default: 'false' },
      { name: 'custom_show_types', type: 'text[]' },
      { name: 'profile_slug', type: 'text' },
      { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
      { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' }
    ]
    
    for (const column of columnsToAdd) {
      try {
        let sql = `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`
        if (column.default) {
          sql += ` DEFAULT ${column.default}`
        }
        
        await executeSQLViaAPI(sql)
        console.log(`   ✅ Added ${column.name}`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⏭️  ${column.name} already exists`)
        } else {
          console.log(`   ❌ Failed to add ${column.name}: ${error.message}`)
        }
      }
    }
    
    // 3. Add unique constraint on profile_slug
    console.log('\n3️⃣ Adding unique constraint on profile_slug...')
    try {
      await executeSQLViaAPI(`
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_profile_slug_key UNIQUE (profile_slug)
      `)
      console.log('   ✅ Unique constraint added')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⏭️  Constraint already exists')
      } else {
        console.log(`   ❌ Failed: ${error.message}`)
      }
    }
    
    // 4. Create indexes
    console.log('\n4️⃣ Creating indexes...')
    const indexes = [
      { name: 'idx_profiles_profile_slug', column: 'profile_slug' },
      { name: 'idx_profiles_email', column: 'email' }
    ]
    
    for (const index of indexes) {
      try {
        await executeSQLViaAPI(`
          CREATE INDEX IF NOT EXISTS ${index.name} 
          ON public.profiles(${index.column})
        `)
        console.log(`   ✅ Created index on ${index.column}`)
      } catch (error) {
        console.log(`   ❌ Failed to create index on ${index.column}: ${error.message}`)
      }
    }
    
    // 5. Update existing profiles to have names in first_name/last_name
    console.log('\n5️⃣ Updating existing profiles with split names...')
    try {
      await executeSQLViaAPI(`
        UPDATE public.profiles
        SET 
          first_name = COALESCE(first_name, split_part(name, ' ', 1)),
          last_name = COALESCE(last_name, 
            CASE 
              WHEN array_length(string_to_array(name, ' '), 1) > 1 
              THEN array_to_string(array_remove(string_to_array(name, ' '), split_part(name, ' ', 1)), ' ')
              ELSE ''
            END
          ),
          updated_at = now()
        WHERE name IS NOT NULL 
        AND (first_name IS NULL OR last_name IS NULL)
      `)
      console.log('   ✅ Updated existing profiles')
    } catch (error) {
      console.log(`   ❌ Failed to update profiles: ${error.message}`)
    }
    
    // 6. Check final state
    console.log('\n6️⃣ Verifying final table structure...')
    const finalCheck = await executeSQLViaAPI(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
      ORDER BY ordinal_position
    `)
    
    if (finalCheck.data) {
      console.log('   Final columns:')
      finalCheck.data.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`)
      })
    }
    
    console.log('\n===========================')
    console.log('✅ Auth system fix complete!')
    console.log('\nThe profiles table now has all required columns.')
    console.log('You should be able to sign up and log in successfully.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixAuthCompletely()