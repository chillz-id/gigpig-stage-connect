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

async function fixProfileNameFields() {
  console.log('🔧 Fixing profile name fields...\n');

  try {
    // 1. First add first_name and last_name columns to profiles if they don't exist
    console.log('1. Adding first_name and last_name columns to profiles...');
    await executeSQLViaManagementAPI(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS first_name TEXT,
      ADD COLUMN IF NOT EXISTS last_name TEXT,
      ADD COLUMN IF NOT EXISTS name_display_preference TEXT DEFAULT 'real';
    `);
    console.log('✓ Added columns');

    // 2. Update the handle_new_user function to extract names from metadata
    console.log('\n2. Updating handle_new_user function to save first/last names...');
    const createFunctionSQL = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Try to create profile
    BEGIN
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
                CASE 
                    WHEN new.raw_user_meta_data->>'first_name' IS NOT NULL 
                         OR new.raw_user_meta_data->>'last_name' IS NOT NULL THEN
                        TRIM(CONCAT(
                            COALESCE(new.raw_user_meta_data->>'first_name', ''), 
                            ' ', 
                            COALESCE(new.raw_user_meta_data->>'last_name', '')
                        ))
                    ELSE SPLIT_PART(new.email, '@', 1)
                END
            ),
            now(),
            now()
        ) ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            name = EXCLUDED.name;
    EXCEPTION
        WHEN others THEN
            -- Log but don't fail
            RAISE WARNING 'Could not create profile for user %: %', new.id, SQLERRM;
    END;
    
    -- Try to create role
    BEGIN
        -- Extract role from metadata, default to 'member'
        INSERT INTO public.user_roles (
            user_id,
            role,
            created_at
        ) VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'role', 'member'),
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

    await executeSQLViaManagementAPI(createFunctionSQL);
    console.log('✓ Function updated');

    // 3. Update existing profiles to populate first_name and last_name from name field
    console.log('\n3. Updating existing profiles to split name into first/last...');
    await executeSQLViaManagementAPI(`
      UPDATE public.profiles
      SET 
        first_name = CASE 
          WHEN first_name IS NULL OR first_name = '' THEN
            SPLIT_PART(name, ' ', 1)
          ELSE first_name
        END,
        last_name = CASE
          WHEN last_name IS NULL OR last_name = '' THEN
            CASE 
              WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 THEN
                SUBSTRING(name FROM LENGTH(SPLIT_PART(name, ' ', 1)) + 2)
              ELSE ''
            END
          ELSE last_name
        END
      WHERE name IS NOT NULL AND name != '';
    `);
    console.log('✓ Updated existing profiles');

    // 4. For the specific user mentioned (chillz@standupsydney.com), check their metadata
    console.log('\n4. Checking specific user metadata...');
    const checkUser = await executeSQLViaManagementAPI(`
      SELECT 
        p.id,
        p.email,
        p.first_name,
        p.last_name,
        p.name,
        u.raw_user_meta_data
      FROM public.profiles p
      LEFT JOIN auth.users u ON u.id = p.id
      WHERE p.email = 'chillz@standupsydney.com';
    `);
    
    if (checkUser && checkUser.length > 0) {
      const user = checkUser[0];
      console.log('User found:', {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.name
      });
      
      if (user.raw_user_meta_data) {
        console.log('Metadata:', user.raw_user_meta_data);
        
        // Update this specific user with metadata if available
        if (user.raw_user_meta_data.first_name || user.raw_user_meta_data.last_name) {
          console.log('\n5. Updating user with metadata values...');
          await executeSQLViaManagementAPI(`
            UPDATE public.profiles
            SET 
              first_name = '${user.raw_user_meta_data.first_name || ''}',
              last_name = '${user.raw_user_meta_data.last_name || ''}',
              name = '${user.raw_user_meta_data.name || `${user.raw_user_meta_data.first_name || ''} ${user.raw_user_meta_data.last_name || ''}`.trim()}'
            WHERE id = '${user.id}';
          `);
          console.log('✓ User updated with metadata values');
        }
      }
    }

    console.log('\n✅ Profile name fields fixed!');
    console.log('\nNext steps:');
    console.log('1. The ProfileInformation component already reads first_name and last_name');
    console.log('2. Future signups will automatically save first/last names');
    console.log('3. Existing users will have their names split appropriately');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixProfileNameFields();