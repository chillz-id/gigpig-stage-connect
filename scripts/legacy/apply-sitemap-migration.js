#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import ora from 'ora';
import chalk from 'chalk';

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('Error: Supabase configuration not found in environment variables'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  const spinner = ora('Applying sitemap migration...').start();
  
  try {
    // Read migration file
    const migrationPath = resolve(process.cwd(), 'supabase/migrations/20250114_add_sitemap_metadata.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    spinner.text = 'Executing migration statements...';
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.startsWith('--') || statement.length === 0) continue;
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      }).single();
      
      if (error) {
        // If the error is about existing objects, that's okay
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }
    
    spinner.succeed(chalk.green('✅ Sitemap migration applied successfully!'));
    
    // Verify the table was created
    spinner.start('Verifying migration...');
    
    const { data, error: verifyError } = await supabase
      .from('sitemap_metadata')
      .select('*');
    
    if (verifyError) {
      spinner.warn(chalk.yellow('⚠ Could not verify migration'));
      console.log(chalk.dim(`   ${verifyError.message}`));
    } else {
      spinner.succeed(chalk.green('✅ Migration verified successfully!'));
      console.log(chalk.dim(`   Found ${data.length} metadata entries`));
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to apply migration'));
    console.error(chalk.red(`\nError: ${error.message}`));
    
    // If we can't use exec_sql, provide manual instructions
    if (error.message.includes('exec_sql')) {
      console.log(chalk.yellow('\n💡 Alternative: Apply the migration manually:'));
      console.log(chalk.dim('   1. Go to your Supabase dashboard'));
      console.log(chalk.dim('   2. Navigate to SQL Editor'));
      console.log(chalk.dim('   3. Copy and run the migration from:'));
      console.log(chalk.cyan('      supabase/migrations/20250114_add_sitemap_metadata.sql'));
    }
    
    process.exit(1);
  }
}

// Run the migration
applyMigration();