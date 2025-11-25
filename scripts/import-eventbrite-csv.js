#!/usr/bin/env node

/**
 * Import Eventbrite CSV Data
 *
 * This script imports historical Eventbrite data from CSV exports into the database.
 * It enriches existing orders with venue and event data while preserving API-fetched raw data.
 *
 * Usage:
 *   node scripts/import-eventbrite-csv.js
 *
 * Output:
 *   - Progress tracking with real-time updates
 *   - Success/error counts
 *   - Final verification of venue coverage
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

// Configuration
const ORDERS_CSV_PATH = '/root/agents/docs/testing/Cross-Event_(953_Events)_Orders_276710097137_20251120_110156_412.csv';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

const BATCH_SIZE = 50; // Upsert 50 orders at a time
const RATE_LIMIT_DELAY = 200; // ms between batches

const stats = {
  total: 0,
  processed: 0,
  inserted: 0,
  updated: 0,
  errors: 0,
  venueEnrichments: 0,
  eventEnrichments: 0
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const parseCSV = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
};

const parseAmount = (amountStr) => {
  if (!amountStr) return null;
  const cleaned = String(amountStr).replace(/[$,]/g, '');
  const cents = Math.round(parseFloat(cleaned) * 100);
  return isNaN(cents) ? null : cents;
};

const combineDateTime = (dateStr, timeStr, timezone) => {
  if (!dateStr) return null;
  try {
    // CSV has date like "2022-01-29" and time like "19:30:00"
    // Combine them and treat as local time in the given timezone
    const combined = `${dateStr}T${timeStr || '00:00:00'}`;
    const date = new Date(combined);
    return date.toISOString();
  } catch {
    return null;
  }
};

// Map CSV row to database record
const mapCsvToDbRecord = (csvRow) => {
  const orderId = csvRow['Order ID'];
  if (!orderId) return null;

  // Parse financial data
  const grossSales = parseAmount(csvRow['Gross sales']);
  const netSales = parseAmount(csvRow['Net sales']);
  const serviceFee = parseAmount(csvRow['Eventbrite service fee']);
  const processingFee = parseAmount(csvRow['Eventbrite payment processing fee']);
  const tax = parseAmount(csvRow['Eventbrite tax']) || parseAmount(csvRow['Organiser tax']);

  // Combine all fees
  const totalFees = (serviceFee || 0) + (processingFee || 0);

  // Build buyer name
  const buyerName = [csvRow['Buyer first name'], csvRow['Buyer last name']]
    .filter(Boolean)
    .join(' ')
    .trim() || null;

  // Event date
  const eventStartDate = combineDateTime(
    csvRow['Event start date'],
    csvRow['Event start time'],
    csvRow['Event timezone']
  );

  return {
    source_id: orderId,
    source: 'eventbrite',
    event_source_id: csvRow['Event ID'] || null,
    session_source_id: csvRow['Event ID'] || null, // Same as event for Eventbrite

    // Financial data
    status: csvRow['Payment status'] || null,
    financial_status: csvRow['Payment status'] || null,
    gross_sales_cents: grossSales,
    net_sales_cents: netSales,
    total_cents: grossSales, // Use gross as total
    subtotal_cents: parseAmount(csvRow['Ticket revenue']),
    fees_cents: totalFees > 0 ? totalFees : null,
    taxes_cents: tax,
    discounts_cents: null, // Not in CSV
    currency: csvRow['Currency'] || null,

    // Buyer information
    purchaser_email: csvRow['Buyer email'] || null,
    purchaser_name: buyerName,

    // Timestamps
    ordered_at: csvRow['Order date'] ? new Date(csvRow['Order date']).toISOString() : null,

    // Event data (THE CRITICAL ENRICHMENT)
    event_name: csvRow['Event name'] || null,
    event_start_date: eventStartDate,
    event_timezone: csvRow['Event timezone'] || null,
    venue_name: csvRow['Event location'] || null, // 🎯 THE KEY FIELD

    // Metadata
    ingested_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// Upsert batch of orders
const upsertBatch = async (supabase, batch, batchNum, totalBatches) => {
  const { data, error } = await supabase
    .from('orders_eventbrite')
    .upsert(batch, {
      onConflict: 'source_id',
      ignoreDuplicates: false
    })
    .select('source_id');

  if (error) {
    throw error;
  }

  return data ? data.length : batch.length;
};

// Progress bar
const showProgress = (current, total, startTime) => {
  const percentage = ((current / total) * 100).toFixed(1);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  const rate = current / (elapsed || 1);
  const remaining = total - current;
  const eta = remaining / (rate || 1);

  const bar = '='.repeat(Math.floor(percentage / 2)) + '>';
  const spaces = ' '.repeat(50 - bar.length);

  process.stdout.write(`\r[${bar}${spaces}] ${percentage}% | ${current}/${total} | ${elapsed}s elapsed | ETA: ${eta.toFixed(0)}s`);
};

// Main import function
async function importCsv() {
  console.log('🚀 Starting CSV import...\n');

  // Check file exists
  if (!fs.existsSync(ORDERS_CSV_PATH)) {
    console.error(`❌ Orders CSV not found: ${ORDERS_CSV_PATH}`);
    process.exit(1);
  }

  // Parse CSV
  console.log('📖 Reading CSV...');
  const orders = parseCSV(ORDERS_CSV_PATH);
  stats.total = orders.length;
  console.log(`✅ Loaded ${stats.total} orders\n`);

  // Initialize Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get existing orders to track insertions vs updates
  console.log('🔍 Fetching existing orders...');
  const { data: existingOrders, error: fetchError } = await supabase
    .from('orders_eventbrite')
    .select('source_id, venue_name, event_name');

  if (fetchError) {
    console.error('❌ Failed to fetch existing orders:', fetchError.message);
    process.exit(1);
  }

  const existingMap = new Map(existingOrders.map(o => [o.source_id, o]));
  console.log(`✅ Found ${existingOrders.length} existing orders\n`);

  // Map CSV records
  console.log('🔄 Mapping CSV records...');
  const mappedOrders = orders.map(mapCsvToDbRecord).filter(Boolean);
  console.log(`✅ Mapped ${mappedOrders.length} valid records\n`);

  // Count enrichments
  mappedOrders.forEach(order => {
    const existing = existingMap.get(order.source_id);
    if (existing) {
      if (order.venue_name && !existing.venue_name) {
        stats.venueEnrichments++;
      }
      if (order.event_name && !existing.event_name) {
        stats.eventEnrichments++;
      }
    }
  });

  console.log('📊 Import preview:');
  console.log(`   New orders to insert: ${mappedOrders.length - existingMap.size}`);
  console.log(`   Existing orders to update: ${existingMap.size}`);
  console.log(`   Orders gaining venue data: ${stats.venueEnrichments}`);
  console.log(`   Orders gaining event data: ${stats.eventEnrichments}\n`);

  // Confirm import
  console.log('⚠️  Starting import in 3 seconds... (Ctrl+C to cancel)\n');
  await sleep(3000);

  // Process in batches
  console.log('📦 Importing data in batches...\n');
  const totalBatches = Math.ceil(mappedOrders.length / BATCH_SIZE);
  const startTime = Date.now();

  for (let i = 0; i < mappedOrders.length; i += BATCH_SIZE) {
    const batch = mappedOrders.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    try {
      const upserted = await upsertBatch(supabase, batch, batchNum, totalBatches);

      // Track insertions vs updates
      batch.forEach(order => {
        if (existingMap.has(order.source_id)) {
          stats.updated++;
        } else {
          stats.inserted++;
        }
      });

      stats.processed += upserted;
      showProgress(stats.processed, stats.total, startTime);

      // Rate limiting
      if (i + BATCH_SIZE < mappedOrders.length) {
        await sleep(RATE_LIMIT_DELAY);
      }
    } catch (error) {
      console.error(`\n❌ Batch ${batchNum} failed:`, error.message);
      stats.errors++;
    }
  }

  console.log('\n\n✅ Import complete!\n');

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('📊 IMPORT SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`Total records processed: ${stats.processed}/${stats.total}`);
  console.log(`New orders inserted: ${stats.inserted}`);
  console.log(`Existing orders updated: ${stats.updated}`);
  console.log(`Orders enriched with venue: ${stats.venueEnrichments}`);
  console.log(`Orders enriched with event data: ${stats.eventEnrichments}`);
  console.log(`Errors: ${stats.errors}`);
  console.log('═══════════════════════════════════════════\n');

  // Verify venue coverage
  console.log('🔍 Verifying venue coverage...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('orders_eventbrite')
    .select('source_id, venue_name')
    .not('venue_name', 'is', null);

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
  } else {
    const { count: totalCount, error: countError } = await supabase
      .from('orders_eventbrite')
      .select('source_id', { count: 'exact', head: true });

    if (!countError) {
      const coverage = (verifyData.length / totalCount) * 100;
      console.log(`✅ Venue coverage: ${verifyData.length}/${totalCount} (${coverage.toFixed(1)}%)\n`);

      if (coverage >= 98) {
        console.log('🎉 Target 98%+ venue coverage achieved!\n');
      }
    }
  }

  console.log('🎉 Import complete! Check CRM to verify venue data is displaying correctly.\n');
}

// Run import
importCsv().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
