#!/usr/bin/env node
// Apply spot confirmation migrations directly using Supabase client

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
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
  
  // Check current table structure
  console.log('📋 Checking current event_spots table structure...');
  
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable, column_default')
    .eq('table_name', 'event_spots')
    .eq('table_schema', 'public')
    .order('ordinal_position');
    
  if (columnsError) {
    console.log(`❌ Error checking columns: ${columnsError.message}`);
    return false;
  }
  
  console.log('Current event_spots columns:');
  columns.forEach(col => {
    console.log(`  - ${col.column_name}: ${col.data_type}`);
  });
  
  // Check if confirmation fields already exist
  const confirmationFields = ['confirmation_status', 'confirmation_deadline', 'confirmed_at', 'declined_at'];
  const existingFields = columns.filter(col => confirmationFields.includes(col.column_name));
  
  if (existingFields.length === confirmationFields.length) {
    console.log('✅ Confirmation fields already exist');
  } else {
    console.log('📝 Adding confirmation fields...');
    
    // Try to add fields one by one
    const alterStatements = [
      'ALTER TABLE public.event_spots ADD COLUMN IF NOT EXISTS confirmation_status TEXT DEFAULT \'pending\'',
      'ALTER TABLE public.event_spots ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMPTZ',
      'ALTER TABLE public.event_spots ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ',
      'ALTER TABLE public.event_spots ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ'
    ];
    
    for (const statement of alterStatements) {
      try {
        const { error } = await supabase.rpc('sql', { query: statement });
        if (error) {
          console.log(`⚠️  Error executing: ${statement}`);
          console.log(`   Error: ${error.message}`);
        }
      } catch (e) {
        console.log(`⚠️  Exception executing: ${statement}`);
        console.log(`   Exception: ${e.message}`);
      }
    }
  }
  
  // Verify table was updated
  console.log('\n🔍 Verifying table was updated...');
  
  const { data: updatedColumns, error: updatedError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'event_spots')
    .eq('table_schema', 'public')
    .in('column_name', confirmationFields);
    
  if (updatedError) {
    console.log(`❌ Error checking updated columns: ${updatedError.message}`);
    return false;
  }
  
  console.log('Confirmation fields found:');
  updatedColumns.forEach(col => {
    console.log(`  ✅ ${col.column_name}: ${col.data_type}`);
  });
  
  if (updatedColumns.length === confirmationFields.length) {
    console.log('✅ All confirmation fields are present');
    return true;
  } else {
    console.log('❌ Some confirmation fields are missing');
    return false;
  }
}

// Execute the migrations
applyMigrations()
  .then(success => {
    if (success) {
      console.log('\n🎉 Spot confirmation migrations applied successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Migration process failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Migration error:', error);
    process.exit(1);
  });