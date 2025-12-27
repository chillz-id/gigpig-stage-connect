#!/usr/bin/env node

/**
 * Backfill Session Tags
 *
 * This script updates all existing Humanitix sessions to trigger the auto-tagging
 * function, which will populate the tags array with city and day-of-week tags.
 *
 * Usage:
 *   node scripts/backfill-session-tags.js
 *
 * Environment variables required:
 *   - SUPABASE_URL (or defaults to production URL)
 *   - SUPABASE_SERVICE_ROLE_KEY (or defaults to production key)
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

const BATCH_SIZE = 100; // Update 100 sessions at a time

/**
 * Main backfill function
 */
async function backfillSessionTags() {
  console.log('🚀 Starting session tags backfill...\n');

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get total count of sessions
  console.log('📊 Counting sessions...');
  const { count, error: countError } = await supabase
    .from('sessions_htx')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Failed to count sessions:', countError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${count} sessions to tag\n`);

  if (count === 0) {
    console.log('✨ No sessions to tag. Exiting.');
    return;
  }

  // Process sessions in batches
  let totalProcessed = 0;
  let totalErrors = 0;
  const startTime = Date.now();

  for (let offset = 0; offset < count; offset += BATCH_SIZE) {
    const batchNum = Math.floor(offset / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(count / BATCH_SIZE);
    const progress = `[${batchNum}/${totalBatches}]`;

    console.log(`${progress} Processing batch starting at offset ${offset}...`);

    try {
      // Fetch batch of sessions
      const { data: sessions, error: fetchError } = await supabase
        .from('sessions_htx')
        .select('id, source_id, timezone, start_date_local, tags')
        .range(offset, offset + BATCH_SIZE - 1);

      if (fetchError) {
        console.error(`   ❌ Failed to fetch batch:`, fetchError.message);
        totalErrors += BATCH_SIZE;
        continue;
      }

      if (!sessions || sessions.length === 0) {
        console.log(`   ⚠️  No sessions in batch, skipping`);
        continue;
      }

      console.log(`   📦 Fetched ${sessions.length} sessions`);

      // Update each session to trigger auto-tagging
      // We'll update each session individually to trigger the BEFORE UPDATE trigger
      let successCount = 0;
      for (const session of sessions) {
        const { error } = await supabase
          .from('sessions_htx')
          .update({ tags: session.tags || [] })
          .eq('id', session.id);

        if (error) {
          console.error(`     ⚠️  Failed to update session ${session.source_id}:`, error.message);
        } else {
          successCount++;
        }
      }

      const updateError = successCount < sessions.length ? new Error(`Only ${successCount}/${sessions.length} updated`) : null;

      if (updateError) {
        console.error(`   ❌ Failed to update batch:`, updateError.message);
        totalErrors += sessions.length;
      } else {
        console.log(`   ✅ Updated ${sessions.length} sessions`);
        totalProcessed += sessions.length;
      }

    } catch (error) {
      console.error(`   ❌ Error processing batch:`, error.message);
      totalErrors += BATCH_SIZE;
    }

    console.log('');
  }

  // Calculate duration
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('📊 BACKFILL SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Sessions processed: ${totalProcessed}/${count}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('═══════════════════════════════════════════\n');

  // Verify results
  console.log('🔍 Verifying results...');

  // Check how many sessions have tags
  const { data: taggedSessions, error: verifyError } = await supabase
    .from('sessions_htx')
    .select('tags')
    .not('tags', 'is', null)
    .neq('tags', '{}');

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
  } else {
    console.log(`✅ ${taggedSessions?.length || 0} sessions now have tags`);

    // Sample a few tagged sessions to show what was generated
    const { data: samples, error: sampleError } = await supabase
      .from('sessions_htx')
      .select('source_id, timezone, start_date_local, tags')
      .not('tags', 'is', null)
      .neq('tags', '{}')
      .limit(5);

    if (!sampleError && samples && samples.length > 0) {
      console.log('\n📋 Sample tagged sessions:');
      samples.forEach((session, i) => {
        console.log(`   ${i + 1}. ${session.source_id}:`);
        console.log(`      Timezone: ${session.timezone}`);
        console.log(`      Start: ${session.start_date_local}`);
        console.log(`      Tags: [${session.tags.join(', ')}]`);
      });
    }
  }

  console.log('\n🎉 Backfill complete!');
}

// Run the backfill
backfillSessionTags().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
