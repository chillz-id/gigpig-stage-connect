import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('Creating test user...');

  try {
    // Create auth user with admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@gigpigs.com',
      password: 'Testing890-',
      email_confirm: true,
      user_metadata: {
        name: 'Test Comedian',
        first_name: 'Test',
        last_name: 'Comedian'
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'test@gigpigs.com',
        name: 'Test Comedian',
        first_name: 'Test',
        last_name: 'Comedian',
        display_name: 'Test Comedian',
        is_verified: false
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      return;
    }

    console.log('✅ Profile created');

    // Add comedian role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'comedian'
      })
      .select()
      .single();

    if (roleError) {
      console.error('❌ Error adding comedian role:', roleError);
      return;
    }

    console.log('✅ Comedian role added');
    console.log('\n🎉 Test account created successfully!');
    console.log('Email: test@gigpigs.com');
    console.log('Password: Testing890-');
    console.log('Role: Comedian');
    console.log('User ID:', authData.user.id);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestUser();
