import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProfileTriggerViaAPI() {
  console.log('🔧 Creating profile trigger via Supabase API...\n');

  try {
    // Since we can't run arbitrary SQL via the JS client,
    // let's create a simple workaround using Edge Functions or RPC
    
    // First, let's check if we need to use a different approach
    console.log('⚠️  The Supabase JS client cannot execute arbitrary SQL directly.');
    console.log('You need to use one of these methods:\n');
    
    console.log('OPTION 1: Supabase Dashboard (Recommended)');
    console.log('1. Go to https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu/sql/new');
    console.log('2. Paste and run this SQL:\n');
    
    const triggerSQL = `
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  
  -- Create default role
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (new.id, 'comedian', now())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test the trigger
SELECT 'Trigger created successfully!' as message;`;

    console.log(triggerSQL);
    
    console.log('\nOPTION 2: Using psql command line:');
    console.log(`psql "${supabaseUrl.replace('https://', 'postgresql://postgres:').replace('.supabase.co', '.supabase.co:5432/postgres')}?password=${supabaseServiceKey}" -c "${triggerSQL.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`);
    
    console.log('\nOPTION 3: Manual workaround - Check on every login:');
    console.log('Add this to your AuthContext after successful login:\n');
    
    const workaroundCode = `
// In AuthContext.tsx, after successful login:
const ensureProfileExists = async (user) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();
  
  if (!profile) {
    // Create profile
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Create role
    await supabase.from('user_roles').insert({
      user_id: user.id,
      role: 'comedian',
      created_at: new Date().toISOString()
    });
  }
};`;

    console.log(workaroundCode);

  } catch (error) {
    console.error('Error:', error);
  }
}

createProfileTriggerViaAPI();