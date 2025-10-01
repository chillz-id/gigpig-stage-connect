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

async function recreateAuthTrigger() {
  console.log('🔧 Recreating Auth Trigger')
  console.log('==========================\n')
  
  try {
    // 1. Drop existing trigger
    console.log('1️⃣ Dropping existing trigger...')
    try {
      await executeSQLViaAPI(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`)
      console.log('   ✅ Trigger dropped')
    } catch (error) {
      console.log('   ⚠️  Could not drop trigger:', error.message)
    }
    
    // 2. Drop existing function
    console.log('\n2️⃣ Dropping existing function...')
    try {
      await executeSQLViaAPI(`DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE`)
      console.log('   ✅ Function dropped')
    } catch (error) {
      console.log('   ⚠️  Could not drop function:', error.message)
    }
    
    // 3. Create the function
    console.log('\n3️⃣ Creating handle_new_user function...')
    const createFunction = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for new user
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
      CASE 
        WHEN new.raw_user_meta_data->>'first_name' IS NOT NULL OR new.raw_user_meta_data->>'last_name' IS NOT NULL
        THEN TRIM(CONCAT(COALESCE(new.raw_user_meta_data->>'first_name', ''), ' ', COALESCE(new.raw_user_meta_data->>'last_name', '')))
        ELSE split_part(new.email, '@', 1)
      END
    ),
    new.raw_user_meta_data->>'phone',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = now();
  
  -- Create default role if not specified
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (new.id, new.raw_user_meta_data->>'role'::text, now())
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (new.id, 'member', now())
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$`
    
    await executeSQLViaAPI(createFunction)
    console.log('   ✅ Function created')
    
    // 4. Create the trigger
    console.log('\n4️⃣ Creating trigger on auth.users...')
    await executeSQLViaAPI(`
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user()
    `)
    console.log('   ✅ Trigger created')
    
    // 5. Verify trigger exists
    console.log('\n5️⃣ Verifying trigger...')
    const triggerCheck = await executeSQLViaAPI(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'auth'
      AND trigger_name = 'on_auth_user_created'
    `)
    
    if (triggerCheck.data && triggerCheck.data.length > 0) {
      console.log('   ✅ Trigger verified:')
      triggerCheck.data.forEach(t => {
        console.log(`      - ${t.trigger_name} on ${t.event_object_table} (${t.event_manipulation})`)
      })
    } else {
      console.log('   ❌ Trigger not found in information_schema!')
    }
    
    // 6. Create profiles for existing users without them
    console.log('\n6️⃣ Creating profiles for existing users...')
    const existingUsers = [
      { id: 'cc8e6620-8dc5-4c25-bf71-ee7383eefcaa', email: 'chillz.id@gmail.com', name: 'Comedian Test' },
      { id: '2fc4f578-7216-447a-87f6-7bf9f4c9bd96', email: 'chillz@standupsydney.com', name: 'Chillz Skinner' },
      { id: 'dd37906f-aa40-443e-930c-22d661e68c4f', email: 'test.comedian.2gud@gmail.com', name: 'Test Comedian' },
      { id: '0ba37563-a90b-4843-a4b2-f08f162a68a3', email: 'info@standupsydney.com', name: 'Stand Up Sydney' }
    ]
    
    for (const user of existingUsers) {
      try {
        const firstName = user.name.split(' ')[0] || ''
        const lastName = user.name.split(' ').slice(1).join(' ') || ''
        
        await executeSQLViaAPI(`
          INSERT INTO public.profiles (
            id, email, name, first_name, last_name, created_at, updated_at
          ) VALUES (
            '${user.id}',
            '${user.email}',
            '${user.name}',
            '${firstName}',
            '${lastName}',
            now(),
            now()
          )
          ON CONFLICT (id) DO UPDATE SET
            name = COALESCE(EXCLUDED.name, profiles.name),
            first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
            last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
            updated_at = now()
        `)
        console.log(`   ✅ Profile ensured for ${user.email}`)
        
        // Also ensure role
        await executeSQLViaAPI(`
          INSERT INTO public.user_roles (user_id, role, created_at)
          VALUES ('${user.id}', 'member', now())
          ON CONFLICT (user_id, role) DO NOTHING
        `)
      } catch (error) {
        console.log(`   ⚠️  Could not create profile for ${user.email}: ${error.message}`)
      }
    }
    
    console.log('\n==========================')
    console.log('✅ Auth trigger recreated!')
    console.log('\nThe system should now:')
    console.log('1. Create profiles automatically for new signups')
    console.log('2. Have profiles for all existing users')
    console.log('3. Work properly for login and signup')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

recreateAuthTrigger()