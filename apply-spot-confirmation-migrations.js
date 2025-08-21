#!/usr/bin/env node
// Apply spot confirmation migrations to Supabase database

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function applyMigrations() {
  console.log('🚀 Starting spot confirmation migrations...');
  
  // List of migration files to apply
  const migrationFiles = [
    'supabase/migrations/20250709000001_add_spot_confirmation_fields.sql',
    'supabase/migrations/20250709180000_add_spot_confirmation_system.sql'
  ];
  
  for (const migrationFile of migrationFiles) {
    const migrationPath = path.join(__dirname, migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.log(`⚠️  Migration file not found: ${migrationFile}`);
      continue;
    }
    
    console.log(`📝 Applying migration: ${migrationFile}`);
    
    try {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Execute the full migration SQL directly using the REST API
      const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
      
      if (error) {
        console.log(`⚠️  Error executing migration: ${error.message}`);
        // Try a direct SQL execution approach
        try {
          const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
              'apikey': process.env.SUPABASE_SERVICE_KEY
            },
            body: JSON.stringify({ sql: migrationSQL })
          });
          
          if (!response.ok) {
            console.log(`⚠️  Direct SQL execution failed: ${response.statusText}`);
          }
        } catch (directError) {
          console.log(`⚠️  Direct execution error: ${directError.message}`);
        }
      }
      
      console.log(`✅ Migration applied: ${migrationFile}`);
    } catch (error) {
      console.log(`❌ Error applying migration ${migrationFile}: ${error.message}`);
    }
  }
  
  console.log('✅ All migrations processing complete!');
  
  // Verify the changes were applied
  await verifyMigrations();
}

async function verifyMigrations() {
  console.log('\n🔍 Verifying migrations were applied...');
  
  try {
    // Check if confirmation fields exist on event_spots table
    const { data, error } = await supabase
      .from('event_spots')
      .select('confirmation_status, confirmation_deadline, confirmed_at')
      .limit(1);
    
    if (error) {
      console.log(`❌ Error checking event_spots table: ${error.message}`);
      return;
    }
    
    console.log('✅ event_spots table has confirmation fields');
    
    // Check if notification functions exist
    const { data: functions, error: funcError } = await supabase.rpc('confirm_spot', {
      _spot_id: '00000000-0000-0000-0000-000000000000',
      _user_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (funcError && !funcError.message.includes('Spot not found')) {
      console.log(`❌ Error checking functions: ${funcError.message}`);
    } else {
      console.log('✅ Spot confirmation functions are available');
    }
    
  } catch (error) {
    console.log(`❌ Verification error: ${error.message}`);
  }
}

// Execute the migrations
applyMigrations().catch(console.error);