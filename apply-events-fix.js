import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://pdikjpfulhhpqpxzpgtu.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyEventsFix() {
  console.log('🔧 Applying Events System Fix...\n');

  try {
    // Read the SQL file
    const sql = fs.readFileSync('./fix-events-system.sql', 'utf8');
    
    // Split into individual statements (basic splitting, might need refinement)
    const statements = sql
      .split(/;(?=\s*(?:--|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|DO|GRANT))/i)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'; // Re-add semicolon
      const preview = statement.substring(0, 100).replace(/\n/g, ' ');
      
      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          console.error(`❌ Error: ${error.message}`);
          errorCount++;
        } else {
          console.log('✅ Success');
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);

    // Verify critical tables
    console.log('\n🔍 Verifying critical tables...');
    const tablesToCheck = [
      'event_templates',
      'recurring_events',
      'recurring_event_instances',
      'webhook_events',
      'event_ticket_sync',
      'venues'
    ];

    for (const table of tablesToCheck) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Exists and accessible`);
      }
    }

    // Check event table columns
    console.log('\n🔍 Checking events table columns...');
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (!eventError && eventData && eventData.length > 0) {
      const columns = Object.keys(eventData[0]);
      console.log('Current columns:', columns.join(', '));
      
      // Check for new columns
      const newColumns = ['date', 'venue_name', 'organizer_id', 'image_url', 'ticket_url', 'is_template', 'template_name'];
      const foundColumns = newColumns.filter(col => columns.includes(col));
      console.log(`✅ Found new columns: ${foundColumns.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Alternative approach using direct SQL execution
async function applyEventsFixDirect() {
  console.log('🔧 Applying Events System Fix (Direct SQL)...\n');

  try {
    const sql = fs.readFileSync('./fix-events-system.sql', 'utf8');
    
    // Execute the entire SQL file at once
    const { data, error } = await supabase.rpc('execute_sql', {
      query: sql
    });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }

    console.log('✅ Events system fix applied successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Try the direct approach first, fall back to statement-by-statement if needed
applyEventsFixDirect().catch(() => {
  console.log('\n📝 Direct execution failed, trying statement-by-statement approach...\n');
  applyEventsFix();
});