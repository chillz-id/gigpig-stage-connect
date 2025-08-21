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

async function applyProfileNameFix() {
  console.log('🔧 Applying Profile Name Fix')
  console.log('============================\n')
  
  try {
    // 1. Update the handle_new_user function
    console.log('1️⃣ Updating handle_new_user function...')
    const functionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
          -- Create profile with ALL fields from signup form
          INSERT INTO public.profiles (
              id,
              email,
              name,
              first_name,
              last_name,
              phone,
              created_at,
              updated_at
          )
          VALUES (
              new.id,
              new.email,
              COALESCE(
                  new.raw_user_meta_data->>'name',
                  new.raw_user_meta_data->>'full_name',
                  split_part(new.email, '@', 1)
              ),
              new.raw_user_meta_data->>'first_name',  -- Extract first_name from metadata
              new.raw_user_meta_data->>'last_name',   -- Extract last_name from metadata
              new.raw_user_meta_data->>'mobile',      -- Extract mobile as phone
              now(),
              now()
          )
          ON CONFLICT (id) DO UPDATE SET
              -- Update if profile exists but fields are missing
              first_name = COALESCE(profiles.first_name, EXCLUDED.first_name),
              last_name = COALESCE(profiles.last_name, EXCLUDED.last_name),
              phone = COALESCE(profiles.phone, EXCLUDED.phone),
              updated_at = now();
          
          -- Handle roles from metadata
          IF new.raw_user_meta_data->>'roles' IS NOT NULL THEN
              -- Parse roles array from metadata
              INSERT INTO public.user_roles (user_id, role)
              SELECT 
                  new.id,
                  role_value::text
              FROM jsonb_array_elements_text((new.raw_user_meta_data->'roles')::jsonb) as role_value
              WHERE role_value IN ('comedian', 'promoter', 'admin', 'photographer', 'videographer', 'member')
              ON CONFLICT (user_id, role) DO NOTHING;
          ELSIF new.raw_user_meta_data->>'role' IS NOT NULL THEN
              -- Handle single role
              INSERT INTO public.user_roles (user_id, role)
              VALUES (
                  new.id,
                  (new.raw_user_meta_data->>'role')::text
              )
              ON CONFLICT (user_id, role) DO NOTHING;
          ELSE
              -- Default to member role if no role specified
              INSERT INTO public.user_roles (user_id, role)
              VALUES (new.id, 'member')
              ON CONFLICT (user_id, role) DO NOTHING;
          END IF;
          
          RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
    await executeSQLViaAPI(functionSQL)
    console.log('✅ Function updated successfully\n')
    
    // 2. Recreate the trigger
    console.log('2️⃣ Recreating trigger...')
    await executeSQLViaAPI('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;')
    await executeSQLViaAPI(`
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `)
    console.log('✅ Trigger recreated successfully\n')
    
    // 3. Check current status
    console.log('3️⃣ Checking current profile status...')
    const profileStatus = await executeSQLViaAPI(`
      SELECT 
          COUNT(*) as total_profiles,
          COUNT(CASE WHEN first_name IS NOT NULL THEN 1 END) as with_first_name,
          COUNT(CASE WHEN last_name IS NOT NULL THEN 1 END) as with_last_name,
          COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,
          COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as with_name
      FROM public.profiles;
    `)
    
    if (profileStatus.data && profileStatus.data.length > 0) {
      const stats = profileStatus.data[0]
      console.log('Profile Statistics:')
      console.log(`- Total profiles: ${stats.total_profiles}`)
      console.log(`- With first_name: ${stats.with_first_name}`)
      console.log(`- With last_name: ${stats.with_last_name}`)
      console.log(`- With phone: ${stats.with_phone}`)
      console.log(`- With name: ${stats.with_name}`)
    }
    
    console.log('\n✅ Profile name fix applied successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Test new user signup to verify names transfer correctly')
    console.log('2. Check that profile page displays first/last names')
    
  } catch (error) {
    console.error('❌ Error applying fix:', error.message)
  }
}

applyProfileNameFix()