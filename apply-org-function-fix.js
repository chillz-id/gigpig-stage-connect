#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('Service Key:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

console.log('🔧 Updating get_user_organizations function...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sqlFile = path.join(__dirname, 'supabase/migrations/20251020_update_get_user_organizations.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Execute using raw SQL
(async () => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // Try direct execution if exec_sql doesn't exist
      console.log('Trying direct execution...');
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Function updated successfully (via REST API)');
    } else {
      console.log('✅ Function updated successfully');
      console.log('Result:', data);
    }
  } catch (err) {
    console.error('❌ Failed to update function:', err.message);
    process.exit(1);
  }
})();
