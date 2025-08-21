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

async function fixProfileTrigger() {
  console.log('🔧 Fixing Profile Creation Trigger')
  console.log('==================================\n')
  
  const steps = [
    {
      name: 'Create handle_new_user function',
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger AS $$
        BEGIN
          -- Create profile
          INSERT INTO public.profiles (
            id, 
            email, 
            first_name, 
            last_name, 
            name,
            created_at, 
            updated_at
          ) VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'first_name', ''),
            COALESCE(new.raw_user_meta_data->>'last_name', ''),
            COALESCE(
              new.raw_user_meta_data->>'name',
              new.raw_user_meta_data->>'full_name',
              split_part(new.email, '@', 1)
            ),
            now(),
            now()
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
            last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
            name = COALESCE(EXCLUDED.name, profiles.name),
            updated_at = now();
          
          -- Create default role
          INSERT INTO public.user_roles (user_id, role, created_at)
          VALUES (new.id, 'member', now())
          ON CONFLICT (user_id, role) DO NOTHING;
          
          RETURN new;
        EXCEPTION
          WHEN OTHERS THEN
            -- Log error but don't fail user creation
            RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
            RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    {
      name: 'Create trigger on auth.users',
      sql: `
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
      `
    },
    {
      name: 'Grant necessary permissions',
      sql: `
        GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
        GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
      `
    },
    {
      name: 'Fix any existing orphaned users',
      sql: `
        -- Create profiles for users that don't have them
        INSERT INTO public.profiles (id, email, created_at, updated_at)
        SELECT 
          u.id,
          u.email,
          u.created_at,
          now()
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE p.id IS NULL
        ON CONFLICT (id) DO NOTHING;
        
        -- Create roles for users that don't have them
        INSERT INTO public.user_roles (user_id, role, created_at)
        SELECT 
          u.id,
          'member',
          now()
        FROM auth.users u
        LEFT JOIN public.user_roles ur ON u.id = ur.user_id
        WHERE ur.user_id IS NULL
        ON CONFLICT (user_id, role) DO NOTHING;
      `
    }
  ]
  
  let successCount = 0
  let errorCount = 0
  
  for (const step of steps) {
    console.log(`📝 ${step.name}...`)
    try {
      await executeSQLViaAPI(step.sql)
      console.log('✅ Success\n')
      successCount++
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Already exists (OK)\n')
        successCount++
      } else {
        console.log(`❌ Error: ${error.message}\n`)
        errorCount++
      }
    }
  }
  
  console.log('==================================')
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  
  // Verify the fix
  console.log('\n🔍 Verifying the fix...\n')
  
  try {
    // Check trigger
    const triggerCheck = await executeSQLViaAPI(`
      SELECT COUNT(*) as count
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND trigger_name = 'on_auth_user_created';
    `)
    
    // Check function
    const functionCheck = await executeSQLViaAPI(`
      SELECT COUNT(*) as count
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'handle_new_user';
    `)
    
    // Check orphaned users
    const orphanCheck = await executeSQLViaAPI(`
      SELECT COUNT(*) as count
      FROM auth.users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE p.id IS NULL;
    `)
    
    const triggerExists = triggerCheck.data?.[0]?.count > 0
    const functionExists = functionCheck.data?.[0]?.count > 0
    const noOrphans = orphanCheck.data?.[0]?.count === 0
    
    if (triggerExists && functionExists && noOrphans) {
      console.log('✅ Profile creation trigger is now properly configured!')
      console.log('✅ All existing users have profiles')
      console.log('\n🎉 The system is ready for new user signups!')
    } else {
      console.log('⚠️  Some issues remain:')
      if (!triggerExists) console.log('  - Trigger not created')
      if (!functionExists) console.log('  - Function not created')
      if (!noOrphans) console.log('  - Still have orphaned users')
    }
    
  } catch (error) {
    console.error('Error verifying fix:', error.message)
  }
}

fixProfileTrigger()