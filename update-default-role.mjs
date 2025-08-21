import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'pdikjpfulhhpqpxzpgtu';

async function executeSQLViaManagementAPI(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to execute SQL: ${error}`);
  }

  return await response.json();
}

async function updateDefaultRole() {
  console.log('🔧 Updating default role to "member"...\n');

  try {
    console.log('1. Updating handle_new_user function...');
    const updateFunctionSQL = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Try to create profile
    BEGIN
        INSERT INTO public.profiles (
            id,
            email,
            created_at,
            updated_at
        ) VALUES (
            new.id,
            new.email,
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;
    EXCEPTION
        WHEN others THEN
            -- Log but don't fail
            RAISE WARNING 'Could not create profile for user %: %', new.id, SQLERRM;
    END;
    
    -- Try to create default role as 'member'
    BEGIN
        INSERT INTO public.user_roles (
            user_id,
            role,
            created_at
        ) VALUES (
            new.id,
            'member',  -- Changed from 'comedian' to 'member'
            now()
        ) ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION
        WHEN others THEN
            -- Log but don't fail
            RAISE WARNING 'Could not create role for user %: %', new.id, SQLERRM;
    END;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;

    await executeSQLViaManagementAPI(updateFunctionSQL);
    console.log('✓ Function updated');

    console.log('\n✅ Default role updated to "member"!');
    console.log('\nThis makes more sense because:');
    console.log('- Users might be audience members/customers first');
    console.log('- They can upgrade to comedian/promoter roles later');
    console.log('- It matches the frontend default behavior');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateDefaultRole();