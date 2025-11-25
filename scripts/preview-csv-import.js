#!/usr/bin/env node

/**
 * Preview Eventbrite CSV Import
 *
 * This script previews what changes will be made when importing CSV data,
 * showing side-by-side comparisons of current vs. new values.
 *
 * Usage:
 *   node scripts/preview-csv-import.js
 *
 * Output:
 *   - Preview report categorizing: New orders, Venue additions, Event data additions
 *   - Sample diffs showing exactly what will change
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

// Configuration
const ORDERS_CSV_PATH = '/root/agents/docs/testing/Cross-Event_(953_Events)_Orders_276710097137_20251120_110156_412.csv';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

const SAMPLE_SIZE = 5; // Show first N examples in each category

const preview = {
  newOrders: [],
  venueAdditions: [],
  eventDataAdditions: [],
  noChanges: 0,
  total: 0
};

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

const combineDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  try {
    // CSV has date like "2022-01-29" and time like "19:30:00"
    const combined = `${dateStr}T${timeStr || '00:00:00'}`;
    return new Date(combined).toISOString();
  } catch {
    return null;
  }
};

// Compare CSV row with DB record
const compareOrder = (csvRow, dbRecord) => {
  const changes = {
    hasChanges: false,
    fields: []
  };

  // Check venue_name
  const csvVenue = csvRow['Event location'] ? csvRow['Event location'].trim() : null;
  const dbVenue = dbRecord?.venue_name || null;

  if (csvVenue && csvVenue !== dbVenue) {
    changes.hasChanges = true;
    changes.fields.push({
      field: 'venue_name',
      before: dbVenue || '(null)',
      after: csvVenue
    });
  }

  // Check event_name
  const csvEventName = csvRow['Event name'] ? csvRow['Event name'].trim() : null;
  const dbEventName = dbRecord?.event_name || null;

  if (csvEventName && csvEventName !== dbEventName) {
    changes.hasChanges = true;
    changes.fields.push({
      field: 'event_name',
      before: dbEventName || '(null)',
      after: csvEventName
    });
  }

  // Check event_start_date
  const csvEventDate = combineDateTime(csvRow['Event start date'], csvRow['Event start time']);
  const dbEventDate = dbRecord?.event_start_date || null;

  if (csvEventDate && csvEventDate !== dbEventDate) {
    changes.hasChanges = true;
    changes.fields.push({
      field: 'event_start_date',
      before: dbEventDate || '(null)',
      after: csvEventDate
    });
  }

  // Check event_timezone
  const csvTimezone = csvRow['Event timezone'] ? csvRow['Event timezone'].trim() : null;
  const dbTimezone = dbRecord?.event_timezone || null;

  if (csvTimezone && csvTimezone !== dbTimezone) {
    changes.hasChanges = true;
    changes.fields.push({
      field: 'event_timezone',
      before: dbTimezone || '(null)',
      after: csvTimezone
    });
  }

  return changes;
};

// Generate preview report
const generatePreview = () => {
  console.log('\n\n═══════════════════════════════════════════');
  console.log('📋 IMPORT PREVIEW');
  console.log('═══════════════════════════════════════════\n');

  console.log('SUMMARY:');
  console.log(`  Total orders in CSV: ${preview.total}`);
  console.log(`  New orders (not in DB): ${preview.newOrders.length}`);
  console.log(`  Orders gaining venue data: ${preview.venueAdditions.length}`);
  console.log(`  Orders gaining event data: ${preview.eventDataAdditions.length}`);
  console.log(`  No changes needed: ${preview.noChanges}\n`);

  // New orders
  if (preview.newOrders.length > 0) {
    console.log(`🆕 NEW ORDERS (${preview.newOrders.length} total, showing first ${Math.min(SAMPLE_SIZE, preview.newOrders.length)}):\n`);
    preview.newOrders.slice(0, SAMPLE_SIZE).forEach(order => {
      console.log(`  Order ID: ${order.orderId}`);
      console.log(`  Event: ${order.eventName || '(no name)'}`);
      console.log(`  Venue: ${order.venue || '(no venue)'}`);
      console.log(`  Date: ${order.eventDate || '(no date)'}`);
      console.log(`  Amount: $${(order.netSales / 100).toFixed(2)}\n`);
    });
  }

  // Venue additions
  if (preview.venueAdditions.length > 0) {
    console.log(`📍 VENUE ADDITIONS (${preview.venueAdditions.length} total, showing first ${Math.min(SAMPLE_SIZE, preview.venueAdditions.length)}):\n`);
    preview.venueAdditions.slice(0, SAMPLE_SIZE).forEach(change => {
      console.log(`  Order ID: ${change.orderId}`);
      console.log(`  Event: ${change.eventName}`);
      change.changes.forEach(c => {
        console.log(`  ${c.field}: "${c.before}" → "${c.after}"`);
      });
      console.log('');
    });
  }

  // Event data additions
  if (preview.eventDataAdditions.length > 0) {
    console.log(`📅 EVENT DATA ADDITIONS (${preview.eventDataAdditions.length} total, showing first ${Math.min(SAMPLE_SIZE, preview.eventDataAdditions.length)}):\n`);
    preview.eventDataAdditions.slice(0, SAMPLE_SIZE).forEach(change => {
      console.log(`  Order ID: ${change.orderId}`);
      console.log(`  Event: ${change.eventName}`);
      change.changes.forEach(c => {
        const beforeDisplay = c.before === '(null)' ? c.before : `"${c.before}"`;
        const afterDisplay = `"${c.after}"`;
        console.log(`  ${c.field}: ${beforeDisplay} → ${afterDisplay}`);
      });
      console.log('');
    });
  }

  console.log('═══════════════════════════════════════════\n');

  // Calculate expected venue coverage
  const currentVenueCount = preview.total - preview.venueAdditions.length - preview.newOrders.filter(o => o.venue).length;
  const newVenueCount = currentVenueCount + preview.venueAdditions.length + preview.newOrders.filter(o => o.venue).length;
  const newCoverage = (newVenueCount / preview.total) * 100;

  console.log('📊 EXPECTED OUTCOME:');
  console.log(`  Venue coverage after import: ${newVenueCount}/${preview.total} (${newCoverage.toFixed(1)}%)\n`);

  console.log('✅ Ready to import! Run: npm run import:csv\n');
};

// Main preview function
async function previewImport() {
  console.log('🔍 Generating import preview...\n');

  // Check file exists
  if (!fs.existsSync(ORDERS_CSV_PATH)) {
    console.error(`❌ Orders CSV not found: ${ORDERS_CSV_PATH}`);
    process.exit(1);
  }

  // Parse CSV
  console.log('📖 Reading CSV...');
  const orders = parseCSV(ORDERS_CSV_PATH);
  console.log(`✅ Loaded ${orders.length} orders from CSV\n`);

  // Fetch existing orders from database
  console.log('🔍 Fetching existing orders from database...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: existingOrders, error } = await supabase
    .from('orders_eventbrite')
    .select('source_id, venue_name, event_name, event_start_date, event_timezone');

  if (error) {
    console.error('❌ Failed to fetch existing orders:', error.message);
    process.exit(1);
  }

  const dbMap = new Map(existingOrders.map(o => [o.source_id, o]));
  console.log(`✅ Found ${existingOrders.length} existing orders in database\n`);

  // Compare each CSV row with DB
  console.log('📊 Analyzing changes...');
  preview.total = orders.length;

  orders.forEach(csvRow => {
    const orderId = csvRow['Order ID'];
    const dbRecord = dbMap.get(orderId);

    if (!dbRecord) {
      // New order
      preview.newOrders.push({
        orderId,
        eventName: csvRow['Event name'],
        venue: csvRow['Event location'],
        eventDate: combineDateTime(csvRow['Event start date'], csvRow['Event start time']),
        netSales: parseAmount(csvRow['Net sales']) || 0
      });
    } else {
      // Existing order - check for changes
      const comparison = compareOrder(csvRow, dbRecord);

      if (comparison.hasChanges) {
        const hasVenueChange = comparison.fields.some(f => f.field === 'venue_name');
        const hasEventDataChange = comparison.fields.some(f =>
          f.field === 'event_name' || f.field === 'event_start_date' || f.field === 'event_timezone'
        );

        if (hasVenueChange) {
          preview.venueAdditions.push({
            orderId,
            eventName: csvRow['Event name'] || dbRecord.event_name || '(unknown)',
            changes: comparison.fields
          });
        } else if (hasEventDataChange) {
          preview.eventDataAdditions.push({
            orderId,
            eventName: csvRow['Event name'] || dbRecord.event_name || '(unknown)',
            changes: comparison.fields
          });
        }
      } else {
        preview.noChanges++;
      }
    }
  });

  console.log('✅ Analysis complete\n');

  // Generate and display preview
  generatePreview();
}

// Run preview
previewImport().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
