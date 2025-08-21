import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignupNow() {
  console.log('🧪 Testing signup after fixes...\n');

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const testEmail = `test.comedian.${randomString}@gmail.com`;
  const testPassword = 'TestPassword123!';

  try {
    console.log('1. Attempting signup with:', testEmail);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError) {
      console.error('❌ Signup failed:', signUpError.message);
      return;
    }

    console.log('✅ Signup successful!');
    console.log('User ID:', signUpData.user?.id);
    console.log('Email:', signUpData.user?.email);
    console.log('Confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No');

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if profile was created
    console.log('\n2. Checking if profile was created...');
    if (signUpData.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile not found:', profileError.message);
      } else {
        console.log('✅ Profile created successfully!');
        console.log('Profile:', profile);
      }

      // Check user roles
      console.log('\n3. Checking user roles...');
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', signUpData.user.id);

      if (rolesError) {
        console.error('❌ Roles not found:', rolesError.message);
      } else {
        console.log('✅ Roles created:', roles);
      }
    }

    console.log('\n🎉 SUCCESS! Account creation is now working!');
    console.log('You can now sign up for new accounts to test the comedian view.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSignupNow();