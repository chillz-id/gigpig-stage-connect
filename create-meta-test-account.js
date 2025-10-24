import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestAccount() {
  console.log('Creating Meta test account...');

  try {
    // Create user with admin API (bypasses trigger issues)
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'test@gigpigs.app',
      password: 'Testing890-',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Test Comedian',
        first_name: 'Test',
        last_name: 'Comedian',
        role: 'comedian'
      }
    });

    if (userError) {
      console.error('❌ Error creating user:', userError);
      return;
    }

    console.log('✅ User created and email auto-confirmed');
    console.log('User ID:', userData.user.id);

    console.log('\n🎉 Meta test account ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: test@gigpigs.app');
    console.log('Password: Testing890-');
    console.log('Role: Comedian');
    console.log('Status: Email confirmed ✓');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestAccount();
