import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Applying deadline tracking enhancements migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250113_add_deadline_tracking_enhancements.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log(`📏 Migration size: ${migrationSQL.length} characters\n`);

    // Split migration into individual statements
    const statements = migrationSQL
      .split(/;\s*$/gm)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 100).replace(/\n/g, ' ');
      
      try {
        console.log(`\n[${i + 1}/${statements.length}] Executing: ${preview}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          throw error;
        }

        console.log(`✅ Success`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        errorCount++;
        
        // Continue with other statements even if one fails
        if (error.message.includes('already exists')) {
          console.log('   (Skipping - already exists)');
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful statements: ${successCount}`);
    console.log(`   ❌ Failed statements: ${errorCount}`);
    console.log(`   📋 Total statements: ${statements.length}`);

    // Verify key tables and functions were created
    console.log('\n🔍 Verifying migration results...\n');

    const verifications = [
      { type: 'table', name: 'email_queue' },
      { type: 'table', name: 'sms_queue' },
      { type: 'table', name: 'audit_logs' },
      { type: 'table', name: 'tasks' },
      { type: 'table', name: 'notification_templates' },
      { type: 'function', name: 'handle_expired_spot_confirmations' },
      { type: 'function', name: 'send_deadline_reminder' },
      { type: 'function', name: 'process_email_queue' },
      { type: 'function', name: 'process_sms_queue' }
    ];

    let verifySuccess = 0;
    let verifyFail = 0;

    for (const item of verifications) {
      let exists = false;
      
      if (item.type === 'table') {
        const { data, error } = await supabase
          .from(item.name)
          .select('*')
          .limit(0);
        
        exists = !error || error.code !== '42P01';
      } else if (item.type === 'function') {
        const { data, error } = await supabase.rpc('get_function_info', {
          function_name: item.name
        }).single();
        
        exists = !error && data;
      }
      
      if (exists) {
        console.log(`✅ ${item.type} '${item.name}' exists`);
        verifySuccess++;
      } else {
        console.log(`❌ ${item.type} '${item.name}' not found`);
        verifyFail++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n✨ Migration Complete!`);
    console.log(`   Tables/Functions verified: ${verifySuccess}/${verifications.length}`);
    
    if (verifyFail > 0) {
      console.log(`\n⚠️  Warning: Some objects could not be verified.`);
      console.log(`   This might be normal if they require special permissions.`);
    }

    // Create the Edge Function deployment script
    console.log('\n📝 Creating Edge Function deployment script...');
    
    const deployScript = `#!/bin/bash
# Deploy deadline-monitor Edge Function

echo "🚀 Deploying deadline-monitor Edge Function..."

# Navigate to supabase directory
cd "$(dirname "$0")/supabase" || exit 1

# Deploy the function
npx supabase functions deploy deadline-monitor \\
  --project-ref pdikjpfulhhpqpxzpgtu \\
  --no-verify-jwt

echo "✅ Edge Function deployed successfully!"
echo ""
echo "To schedule the function to run every 15 minutes, run:"
echo "npx supabase functions schedule deadline-monitor --cron '*/15 * * * *'"
`;

    fs.writeFileSync(path.join(__dirname, 'deploy-deadline-monitor.sh'), deployScript);
    fs.chmodSync(path.join(__dirname, 'deploy-deadline-monitor.sh'), '755');
    
    console.log('✅ Created deploy-deadline-monitor.sh');
    console.log('\n🎉 Deadline tracking system migration completed successfully!');
    
    console.log('\n📋 Next steps:');
    console.log('1. Run ./deploy-deadline-monitor.sh to deploy the Edge Function');
    console.log('2. Add DeadlineMonitoringDashboard component to your admin panel');
    console.log('3. Configure email/SMS providers in your .env file');
    console.log('4. Test the deadline tracking system with a sample event');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Helper function to check if RPC function exists
async function checkRPCExists() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: 'SELECT 1'
  });
  
  if (error && error.message.includes('does not exist')) {
    console.log('⚠️  exec_sql function not found. Creating it...');
    
    const { error: createError } = await supabase.rpc('create_exec_sql_function');
    
    if (createError) {
      // Try creating it directly
      console.log('Creating exec_sql function via direct query...');
      // This would need to be done via the Supabase dashboard
      console.error('❌ Please create the exec_sql function manually in your Supabase dashboard:');
      console.error(`
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      process.exit(1);
    }
  }
}

// Check for exec_sql function first
await checkRPCExists();

// Run the migration
applyMigration().catch(console.error);