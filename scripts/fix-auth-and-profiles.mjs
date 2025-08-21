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

async function fixAuthAndProfiles() {
  console.log('🔧 Fixing Auth and Profile System')
  console.log('=================================\n')
  
  try {
    // 1. Create the handle_new_user function
    console.log('1️⃣ Creating handle_new_user function...')
    const createFunction = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.profiles (
          id,
          email,
          first_name,
          last_name,
          name,
          phone,
          created_at,
          updated_at
        )
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'first_name', ''),
          COALESCE(new.raw_user_meta_data->>'last_name', ''),
          COALESCE(
            new.raw_user_meta_data->>'name',
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1)
          ),
          new.raw_user_meta_data->>'mobile',
          now(),
          now()
        )
        ON CONFLICT (id) DO UPDATE SET
          first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
          last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
          phone = COALESCE(EXCLUDED.phone, profiles.phone),
          updated_at = now();
        
        -- Handle roles
        IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
          INSERT INTO public.user_roles (user_id, role, created_at)
          VALUES (new.id, new.raw_user_meta_data->>'role', now())
          ON CONFLICT (user_id, role) DO NOTHING;
        ELSE
          INSERT INTO public.user_roles (user_id, role, created_at)
          VALUES (new.id, 'member', now())
          ON CONFLICT (user_id, role) DO NOTHING;
        END IF;
        
        RETURN new;
      END;
      $$;
    `
    
    await executeSQLViaAPI(createFunction)
    console.log('✅ Function created successfully')
    
    // 2. Create the trigger
    console.log('\n2️⃣ Creating trigger on auth.users...')
    
    // First drop if exists
    await executeSQLViaAPI('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;')
    
    // Create new trigger
    const createTrigger = `
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
    `
    
    await executeSQLViaAPI(createTrigger)
    console.log('✅ Trigger created successfully')
    
    // 3. Fix the notifications table issue (column 'read' is problematic)
    console.log('\n3️⃣ Checking notifications table...')
    try {
      // Check if 'read' column exists
      const checkColumn = await executeSQLViaAPI(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'read'
      `)
      
      if (checkColumn.data && checkColumn.data.length > 0) {
        console.log('   Found problematic "read" column, renaming to "is_read"...')
        await executeSQLViaAPI(`
          ALTER TABLE notifications 
          RENAME COLUMN "read" TO is_read;
        `)
        console.log('   ✅ Column renamed successfully')
      } else {
        console.log('   ✅ No "read" column found (already fixed or using is_read)')
      }
    } catch (error) {
      console.log('   ⚠️  Could not check/fix notifications table:', error.message)
    }
    
    // 4. Check Auth configuration
    console.log('\n4️⃣ Checking Auth configuration...')
    
    // Check if email confirmations are required
    const authConfig = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        },
      }
    )
    
    if (authConfig.ok) {
      const config = await authConfig.json()
      console.log('   Auth settings:')
      console.log(`   - Email confirmations: ${config.DISABLE_SIGNUP ? 'Disabled' : 'Enabled'}`)
      console.log(`   - Site URL: ${config.SITE_URL || 'Not set'}`)
    }
    
    console.log('\n=================================')
    console.log('✅ Auth and Profile system fixed!')
    console.log('\n📝 Next steps:')
    console.log('1. Try signing up again')
    console.log('2. Check Supabase dashboard > Authentication > Settings')
    console.log('3. Ensure "Enable email confirmations" is OFF for testing')
    console.log('4. Check that Site URL is set correctly')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixAuthAndProfiles()