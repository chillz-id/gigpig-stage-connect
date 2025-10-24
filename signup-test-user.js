import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function signupTestUser() {
  console.log('Signing up test user...');

  try {
    // Sign up with regular auth (this will trigger the profile creation automatically)
    const { data, error } = await supabase.auth.signUp({
      email: 'test@gigpigs.com',
      password: 'Testing890-',
      options: {
        data: {
          name: 'Test Comedian',
          first_name: 'Test',
          last_name: 'Comedian'
        }
      }
    });

    if (error) {
      console.error('❌ Error signing up:', error);
      return;
    }

    console.log('✅ User signed up:', data.user.id);

    // Add comedian role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: data.user.id,
        role: 'comedian'
      })
      .select()
      .single();

    if (roleError) {
      console.error('❌ Error adding comedian role:', roleError);
      // Continue anyway - might already exist
    } else {
      console.log('✅ Comedian role added');
    }

    console.log('\n🎉 Test account created successfully!');
    console.log('Email: test@gigpigs.com');
    console.log('Password: Testing890-');
    console.log('Role: Comedian');
    console.log('User ID:', data.user.id);
    console.log('\n⚠️  Note: User needs to verify email. Checking verification status...');

    // Check if email confirmation is required
    if (data.user && !data.user.email_confirmed_at) {
      console.log('⚠️  Email verification required. Using service key to confirm...');

      // Use service key to confirm email
      const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE', {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      const { data: updateData, error: updateError } = await serviceSupabase.auth.admin.updateUserById(
        data.user.id,
        { email_confirm: true }
      );

      if (updateError) {
        console.error('❌ Error confirming email:', updateError);
      } else {
        console.log('✅ Email confirmed automatically');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

signupTestUser();
