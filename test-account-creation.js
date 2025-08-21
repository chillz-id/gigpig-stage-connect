const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3NjYyMDcsImV4cCI6MjA1MTM0MjIwN30.Z7I-6j1v04ccYkvIGR5EITb0P8rjtYVo8HPjYqPX_kU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAccountCreation() {
  console.log('Testing account creation flow...\n');

  // Generate a unique test email
  const timestamp = Date.now();
  const testEmail = `test_comedian_${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // 1. Test signup
    console.log('1. Testing signup with email:', testEmail);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError) {
      console.error('Signup error:', signUpError);
      return;
    }

    console.log('✓ Signup successful');
    console.log('User ID:', signUpData.user?.id);
    console.log('Email:', signUpData.user?.email);

    // 2. Check if profile was created automatically
    console.log('\n2. Checking if profile was created...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile not found:', profileError);
      console.log('\nThis indicates the profile creation trigger is not working!');
    } else {
      console.log('✓ Profile found:', profile);
    }

    // 3. Check auth.users table directly using service key
    console.log('\n3. Checking auth.users table...');
    // Note: This requires service key, which we don't have in frontend context
    
    // 4. Try to manually create profile
    if (!profile) {
      console.log('\n4. Attempting to manually create profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          email: signUpData.user.email,
          name: 'Test Comedian',
          role: 'comedian',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create profile:', createError);
      } else {
        console.log('✓ Profile created manually:', newProfile);
      }
    }

    // 5. Test sign out
    console.log('\n5. Signing out...');
    await supabase.auth.signOut();
    console.log('✓ Signed out successfully');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testAccountCreation();