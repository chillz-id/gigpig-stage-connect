#!/usr/bin/env node

/**
 * Backfill Humanitix Venue Coordinates
 *
 * This script geocodes venue addresses using Google Geocoding API
 * and populates the venue_lat_lng column in events_htx table.
 *
 * Unlike banner URLs, venue coordinates are NOT in the Humanitix raw data.
 * We geocode the venue address to get lat/lng for map display.
 *
 * Usage:
 *   node scripts/backfill-htx-venue-coordinates.js
 *   npm run backfill:htx:coordinates
 *
 * Requirements:
 *   - VITE_GOOGLE_MAPS_API_KEY environment variable
 *   - Geocoding API enabled in Google Cloud Console
 *
 * Output:
 *   - Progress tracking with real-time updates
 *   - Success/error counts
 *   - Final coverage statistics
 */

import { createClient } from '@supabase/supabase-js';
import ora from 'ora';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';
const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

const BATCH_SIZE = 50;
const RATE_LIMIT_DELAY = 200; // ms between requests (5 requests/second)

const stats = {
  total: 0,
  processed: 0,
  geocoded: 0,
  skipped: 0,
  errors: 0,
  apiErrors: 0
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Geocode an address using Google Geocoding API
async function geocodeAddress(addressComponents) {
  const { venue_name, venue_address, venue_city, venue_country } = addressComponents;

  // Build geocoding query
  const addressParts = [
    venue_name,
    venue_address,
    venue_city,
    venue_country
  ].filter(Boolean);

  if (addressParts.length === 0) {
    return null;
  }

  const address = addressParts.join(', ');

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', address);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    } else if (data.status === 'ZERO_RESULTS') {
      return null; // No results found for this address
    } else {
      throw new Error(`Geocoding API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
  } catch (error) {
    throw new Error(`Geocoding failed: ${error.message}`);
  }
}

// Main backfill function
async function backfillVenueCoordinates() {
  console.log(chalk.blue.bold('\n📍 Humanitix Venue Coordinates Backfill\n'));

  // Validate Google Maps API key
  if (!GOOGLE_MAPS_API_KEY) {
    console.error(chalk.red('❌ Missing VITE_GOOGLE_MAPS_API_KEY environment variable'));
    console.log(chalk.yellow('\nPlease set VITE_GOOGLE_MAPS_API_KEY in your .env file.\n'));
    process.exit(1);
  }

  const spinner = ora('Initializing Supabase client...').start();

  // Initialize Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  spinner.text = 'Fetching events with missing coordinates...';

  // Query events where:
  // 1. Has venue data (venue_name or venue_address exists)
  // 2. venue_lat_lng is null (not yet geocoded)
  const { data: events, error: fetchError } = await supabase
    .from('events_htx')
    .select('source_id, venue_name, venue_address, venue_city, venue_country')
    .is('venue_lat_lng', null)
    .or('venue_name.not.is.null,venue_address.not.is.null');

  if (fetchError) {
    spinner.fail(chalk.red('Failed to fetch events'));
    console.error(fetchError);
    process.exit(1);
  }

  stats.total = events.length;

  if (stats.total === 0) {
    spinner.succeed(chalk.green('No events need geocoding'));
    console.log(chalk.gray('\nAll events with venue data already have coordinates.\n'));
    return;
  }

  spinner.succeed(chalk.green(`Found ${stats.total} events to process\n`));

  console.log(chalk.yellow(`⚠️  Geocoding ${stats.total} addresses using Google Geocoding API`));
  console.log(chalk.yellow(`   Rate limit: ${1000 / RATE_LIMIT_DELAY} requests/second`));
  console.log(chalk.yellow(`   Estimated time: ${Math.ceil((stats.total * RATE_LIMIT_DELAY) / 1000 / 60)} minutes\n`));

  // Process in batches with rate limiting
  const geocodeSpinner = ora('Geocoding addresses...').start();

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(events.length / BATCH_SIZE);

    geocodeSpinner.text = `Batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, events.length)} of ${events.length})`;

    for (const event of batch) {
      try {
        // Geocode the venue address
        const coordinates = await geocodeAddress({
          venue_name: event.venue_name,
          venue_address: event.venue_address,
          venue_city: event.venue_city,
          venue_country: event.venue_country
        });

        if (coordinates) {
          // Update venue_lat_lng as JSONB array [lat, lng]
          const { error: updateError } = await supabase
            .from('events_htx')
            .update({
              venue_lat_lng: [coordinates.lat, coordinates.lng]
            })
            .eq('source_id', event.source_id);

          if (updateError) {
            throw updateError;
          }

          stats.geocoded++;
        } else {
          stats.skipped++;
        }

        stats.processed++;

        // Rate limiting
        await sleep(RATE_LIMIT_DELAY);

      } catch (error) {
        if (error.message.includes('Geocoding API error')) {
          stats.apiErrors++;
        }
        console.log(chalk.yellow(`\n⚠️  ${event.source_id}: ${error.message}`));
        stats.errors++;
        stats.processed++;
      }
    }
  }

  geocodeSpinner.succeed(chalk.green('Geocoding complete\n'));

  // Summary
  console.log(chalk.blue.bold('═══════════════════════════════════════════'));
  console.log(chalk.blue.bold('📊 BACKFILL SUMMARY'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════\n'));

  console.log(`${chalk.cyan('Total events found:')} ${stats.total}`);
  console.log(`${chalk.green('Successfully geocoded:')} ${stats.geocoded}`);
  console.log(`${chalk.yellow('Skipped (no results):')} ${stats.skipped}`);
  console.log(`${chalk.red('Errors:')} ${stats.errors}`);
  console.log(`${chalk.red('API errors:')} ${stats.apiErrors}\n`);

  // Verify coverage
  const verifySpinner = ora('Verifying coordinate coverage...').start();

  const { count: totalCount, error: totalError } = await supabase
    .from('events_htx')
    .select('source_id', { count: 'exact', head: true });

  const { count: withCoordinatesCount, error: coordinatesError } = await supabase
    .from('events_htx')
    .select('source_id', { count: 'exact', head: true })
    .not('venue_lat_lng', 'is', null);

  if (totalError || coordinatesError) {
    verifySpinner.fail(chalk.red('Verification failed'));
    console.error(totalError || coordinatesError);
  } else {
    const coverage = (withCoordinatesCount / totalCount) * 100;
    verifySpinner.succeed(chalk.green(`Venue coordinate coverage: ${withCoordinatesCount}/${totalCount} (${coverage.toFixed(1)}%)`));
  }

  console.log(chalk.blue.bold('\n═══════════════════════════════════════════\n'));

  if (stats.errors > 0) {
    console.log(chalk.yellow('⚠️  Some errors occurred. You may want to re-run the script to retry failed geocoding.\n'));
  } else {
    console.log(chalk.green('✅ Backfill complete!\n'));
  }

  // Google API usage reminder
  console.log(chalk.gray(`💡 Tip: Google Geocoding API free tier: 40,000 requests/month`));
  console.log(chalk.gray(`   This run used ~${stats.processed} requests\n`));
}

// Run backfill
backfillVenueCoordinates().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});
