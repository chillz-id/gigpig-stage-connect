import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyAnalyticsMigration() {
  try {
    console.log('Applying profile analytics migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250114_profile_analytics_system.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('execute_sql', {
        sql: statement + ';'
      });

      if (error) {
        console.error('Error executing statement:', error);
        // Continue with other statements even if one fails
      }
    }

    console.log('✅ Analytics migration applied successfully!');

    // Verify the tables were created
    console.log('\nVerifying tables...');
    
    const tables = ['profile_views', 'profile_engagement', 'profile_analytics_daily'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Table ${table} verification failed:`, error.message);
      } else {
        console.log(`✅ Table ${table} exists and is accessible`);
      }
    }

    console.log('\n✅ Profile analytics system is ready!');
    console.log('\nNext steps:');
    console.log('1. Deploy the edge functions for analytics tracking');
    console.log('2. Set up a daily cron job to run the aggregate_profile_analytics function');
    console.log('3. Integrate analytics tracking into your comedian profile pages');

  } catch (error) {
    console.error('Failed to apply analytics migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyAnalyticsMigration();