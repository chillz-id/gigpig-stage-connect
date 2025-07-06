// Script to apply Supabase migration
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Supabase client with service role key for admin access
const supabaseUrl = 'https://pdikjpfulhhpqpxzpgtu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250706120000_update_smart_matching_with_time.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('Applying migration: Smart Event Matching with Time...')
    
    // Note: Supabase doesn't expose direct SQL execution via the JS client
    // You'll need to use one of the other methods
    console.log('\nMigration SQL loaded. Please apply it using one of these methods:')
    console.log('\n1. Supabase Dashboard SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu/sql')
    console.log('\n2. Copy the migration to your clipboard:')
    console.log('   cat', migrationPath, '| pbcopy')
    console.log('\n3. If you have psql installed locally:')
    console.log('   psql "postgresql://postgres.pdikjpfulhhpqpxzpgtu:Stand-up123!@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres" -f', migrationPath)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

applyMigration()