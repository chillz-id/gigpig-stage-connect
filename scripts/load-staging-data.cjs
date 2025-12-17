/**
 * Load Brevo data into staging table using Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SYNC_DATA_PATH = path.join(__dirname, '../tmp/brevo-sync-data.json');

async function main() {
  console.log('Loading sync data...');
  const syncData = JSON.parse(fs.readFileSync(SYNC_DATA_PATH, 'utf-8'));
  console.log(`Loaded ${syncData.length} records`);

  // Clear existing staging data
  console.log('Clearing existing staging data...');
  const { error: deleteError } = await supabase
    .from('brevo_sync_staging')
    .delete()
    .neq('email', '');

  if (deleteError) {
    console.error('Error clearing staging:', deleteError);
  }

  // Insert in batches of 500
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < syncData.length; i += BATCH_SIZE) {
    const rawBatch = syncData.slice(i, i + BATCH_SIZE);
    // Only include columns that exist in the staging table
    const batch = rawBatch.map(r => ({
      email: r.email,
      first_name: r.first_name,
      last_name: r.last_name,
      date_of_birth: r.date_of_birth,
      marketing_opt_in: r.marketing_opt_in
    }));
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(syncData.length / BATCH_SIZE);

    console.log(`Inserting batch ${batchNum}/${totalBatches} (${batch.length} records)...`);

    const { data, error } = await supabase
      .from('brevo_sync_staging')
      .upsert(batch, { onConflict: 'email' });

    if (error) {
      console.error(`Error in batch ${batchNum}:`, error.message);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`\nInserted ${inserted} records into staging table`);

  // Verify count
  const { count, error: countError } = await supabase
    .from('brevo_sync_staging')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting:', countError);
  } else {
    console.log(`Staging table now has ${count} records`);
  }
}

main().catch(console.error);
