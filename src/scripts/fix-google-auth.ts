import { supabase } from '../integrations/supabase/client';
import fs from 'fs';

async function fixGoogleAuth() {
  console.log('🔧 Fixing Google Authentication...\n');
  
  const sql = fs.readFileSync('./fix-google-auth.sql', 'utf8');
  
  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    console.log('Executing:', statement.substring(0, 50) + '...');
    
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });
      
      if (error) {
        console.error('Error:', error);
      } else {
        console.log('✅ Success\n');
      }
    } catch (err) {
      console.error('Failed:', err);
    }
  }
  
  console.log('🎉 Google Auth fix complete!');
}

fixGoogleAuth();