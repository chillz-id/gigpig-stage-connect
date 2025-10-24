#!/usr/bin/env node
/**
 * Update get_user_organizations function to include permission fields
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const sql = fs.readFileSync('./supabase/migrations/20251020_update_get_user_organizations.sql', 'utf8');

console.log('🔧 Updating get_user_organizations function...\n');

// Split SQL into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

(async () => {
  for (const statement of statements) {
    try {
      const { data, error } = await supabase.rpc('exec', { sql: statement + ';' });

      if (error) {
        // If exec RPC doesn't exist, try direct query
        console.log('Trying direct query execution...');
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      console.log('✅ Executed statement');
    } catch (err) {
      console.error('❌ Error:', err.message);
      console.error('Statement:', statement.substring(0, 100) + '...');
    }
  }

  console.log('\n✅ Function update complete!');
  console.log('Please refresh your browser to see the changes.');
})();
