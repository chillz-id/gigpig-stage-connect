#!/usr/bin/env node
// Check current database structure

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

async function checkDatabase() {
  console.log('🔍 Checking database structure...');
  
  try {
    // Check event_spots table
    const { data: eventSpots, error: eventSpotsError } = await supabase
      .from('event_spots')
      .select('*')
      .limit(1);
    
    if (eventSpotsError) {
      console.log(`❌ Error checking event_spots: ${eventSpotsError.message}`);
    } else {
      console.log('✅ event_spots table exists');
      if (eventSpots.length > 0) {
        console.log('   Sample row columns:', Object.keys(eventSpots[0]));
      }
    }
    
    // Check accessible tables
    console.log('\n📋 Checking accessible tables...');
    
    const tables = ['events', 'profiles', 'notifications', 'applications'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: accessible`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database check error:', error);
  }
}

checkDatabase()
  .then(() => {
    console.log('\n🎉 Database check complete!');
  })
  .catch(error => {
    console.error('❌ Check error:', error);
  });