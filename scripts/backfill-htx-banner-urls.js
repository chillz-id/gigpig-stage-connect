#!/usr/bin/env node

/**
 * Backfill Humanitix Event Banner URLs
 *
 * This script extracts banner image URLs from the raw JSONB field
 * and populates the banner_image_url column in events_htx table.
 *
 * The data already exists in raw->'bannerImage'->'url', we just need
 * to extract it into the denormalized column for easier querying.
 *
 * Usage:
 *   node scripts/backfill-htx-banner-urls.js
 *   npm run backfill:htx:banners
 *
 * Output:
 *   - Progress tracking with real-time updates
 *   - Success/error counts
 *   - Final coverage statistics
 */

import { createClient } from '@supabase/supabase-js';
import ora from 'ora';
import chalk from 'chalk';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

const BATCH_SIZE = 100;

const stats = {
  total: 0,
  processed: 0,
  updated: 0,
  skipped: 0,
  errors: 0
};

// Main backfill function
async function backfillBannerUrls() {
  console.log(chalk.blue.bold('\n🖼️  Humanitix Banner URL Backfill\n'));

  const spinner = ora('Initializing Supabase client...').start();

  // Initialize Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  spinner.text = 'Fetching events with missing banner URLs...';

  // Query events where:
  // 1. raw->'bannerImage'->'url' exists (has banner in raw data)
  // 2. banner_image_url is null (not yet extracted)
  const { data: events, error: fetchError } = await supabase
    .from('events_htx')
    .select('source_id, raw')
    .not('raw->bannerImage->url', 'is', null)
    .is('banner_image_url', null);

  if (fetchError) {
    spinner.fail(chalk.red('Failed to fetch events'));
    console.error(fetchError);
    process.exit(1);
  }

  stats.total = events.length;

  if (stats.total === 0) {
    spinner.succeed(chalk.green('No events need banner URL extraction'));
    console.log(chalk.gray('\nAll events already have banner URLs extracted.\n'));
    return;
  }

  spinner.succeed(chalk.green(`Found ${stats.total} events to process\n`));

  // Extract banner URLs and prepare updates
  const updates = [];

  for (const event of events) {
    try {
      const bannerUrl = event.raw?.bannerImage?.url;

      if (bannerUrl && typeof bannerUrl === 'string') {
        updates.push({
          source_id: event.source_id,
          banner_image_url: bannerUrl
        });
      } else {
        stats.skipped++;
      }
    } catch (error) {
      console.error(chalk.yellow(`⚠️  Error extracting banner for ${event.source_id}:`, error.message));
      stats.errors++;
    }
  }

  if (updates.length === 0) {
    console.log(chalk.yellow('No valid banner URLs found to update.\n'));
    return;
  }

  console.log(chalk.cyan(`📦 Updating ${updates.length} events in batches of ${BATCH_SIZE}...\n`));

  // Update in batches
  const updateSpinner = ora('Processing batch 1...').start();

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(updates.length / BATCH_SIZE);

    updateSpinner.text = `Processing batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, updates.length)} of ${updates.length})`;

    try {
      // Build UPDATE query for batch
      // We need to update each event individually due to different banner URLs
      for (const update of batch) {
        const { error: updateError } = await supabase
          .from('events_htx')
          .update({ banner_image_url: update.banner_image_url })
          .eq('source_id', update.source_id);

        if (updateError) {
          throw updateError;
        }

        stats.updated++;
        stats.processed++;
      }
    } catch (error) {
      updateSpinner.fail(chalk.red(`Batch ${batchNum} failed`));
      console.error(error);
      stats.errors++;
    }
  }

  updateSpinner.succeed(chalk.green('All batches processed\n'));

  // Summary
  console.log(chalk.blue.bold('═══════════════════════════════════════════'));
  console.log(chalk.blue.bold('📊 BACKFILL SUMMARY'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════\n'));

  console.log(`${chalk.cyan('Total events found:')} ${stats.total}`);
  console.log(`${chalk.green('Successfully updated:')} ${stats.updated}`);
  console.log(`${chalk.yellow('Skipped (invalid URL):')} ${stats.skipped}`);
  console.log(`${chalk.red('Errors:')} ${stats.errors}\n`);

  // Verify coverage
  const verifySpinner = ora('Verifying banner URL coverage...').start();

  const { count: totalCount, error: totalError } = await supabase
    .from('events_htx')
    .select('source_id', { count: 'exact', head: true });

  const { count: withBannerCount, error: bannerError } = await supabase
    .from('events_htx')
    .select('source_id', { count: 'exact', head: true })
    .not('banner_image_url', 'is', null);

  if (totalError || bannerError) {
    verifySpinner.fail(chalk.red('Verification failed'));
    console.error(totalError || bannerError);
  } else {
    const coverage = (withBannerCount / totalCount) * 100;
    verifySpinner.succeed(chalk.green(`Banner URL coverage: ${withBannerCount}/${totalCount} (${coverage.toFixed(1)}%)`));
  }

  console.log(chalk.blue.bold('\n═══════════════════════════════════════════\n'));

  if (stats.errors > 0) {
    console.log(chalk.yellow('⚠️  Some errors occurred. Check logs above for details.\n'));
  } else {
    console.log(chalk.green('✅ Backfill complete!\n'));
  }
}

// Run backfill
backfillBannerUrls().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});
