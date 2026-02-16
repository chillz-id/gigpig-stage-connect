#!/usr/bin/env node

/**
 * Import FEVER Ticket Sales
 *
 * Imports historical FEVER sales data from CSV exports into manual_ticket_entries.
 * Uses VALIDATED tickets only (what you actually get paid on).
 *
 * Usage:
 *   node scripts/import-fever-sales.js
 *
 * CSV Files:
 *   - iD Comedy Club - FEVER SALES sales_per_event_date__start_time_and_ticket_type_*.csv
 *   - Magic Mic Comedy - FEVER SALES sales_per_event_date__start_time_and_ticket_type_*.csv
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

// Configuration
const DOCS_DIR = path.join(process.cwd(), 'docs');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FEVER_PARTNER_ID = '155dfe4f-7132-4f23-8179-1389a667b0dd';
const COMMISSION_RATE = 20.00;

// Show title patterns to match
const SHOW_PATTERNS = {
  'iD Comedy Club': ['%ID Comedy%', '%iD Comedy%'],
  'Magic Mic Comedy': ['%Magic Mic%'],
  'Off The Record': ['%Off The Record%']
};

const stats = {
  filesProcessed: 0,
  rowsRead: 0,
  rowsWithValidated: 0,
  eventsMatched: 0,
  eventsUnmatched: 0,
  entriesInserted: 0,
  entriesSkipped: 0,
  errors: []
};

const unmatchedDates = [];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Parse FEVER date format: "February 4, 2022, 7:30 PM" → { date: "2022-02-04", time: "19:30" }
 */
function parseFeverDate(dateStr) {
  if (!dateStr) return null;

  try {
    // Parse "February 4, 2022, 7:30 PM"
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return {
      date: `${year}-${month}-${day}`,
      dateObj: date
    };
  } catch {
    return null;
  }
}

/**
 * Find matching event by date and show type
 */
async function findMatchingEvent(dateStr, showType) {
  const parsed = parseFeverDate(dateStr);
  if (!parsed) return null;

  const patterns = SHOW_PATTERNS[showType] || [];

  for (const pattern of patterns) {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date')
      .ilike('title', pattern)
      .gte('event_date', `${parsed.date}T00:00:00`)
      .lt('event_date', `${parsed.date}T23:59:59`)
      .limit(1);

    if (error) {
      console.error(`  Error querying events: ${error.message}`);
      return null;
    }

    if (data && data.length > 0) {
      return data[0];
    }
  }

  return null;
}

/**
 * Check if entry already exists
 */
async function entryExists(eventId, entryDate) {
  const { data, error } = await supabase
    .from('manual_ticket_entries')
    .select('id')
    .eq('event_id', eventId)
    .eq('partner_id', FEVER_PARTNER_ID)
    .eq('entry_date', entryDate)
    .limit(1);

  if (error) return false;
  return data && data.length > 0;
}

/**
 * Insert manual ticket entry
 */
async function insertEntry(eventId, ticketCount, grossRevenue, entryDate, reference) {
  const { data, error } = await supabase
    .from('manual_ticket_entries')
    .insert({
      event_id: eventId,
      partner_id: FEVER_PARTNER_ID,
      ticket_count: ticketCount,
      gross_revenue: grossRevenue,
      commission_rate: COMMISSION_RATE,
      entry_date: entryDate,
      notes: 'Imported from FEVER export (validated tickets)',
      reference_id: reference
    })
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

/**
 * Process a single CSV file
 */
async function processCSVFile(filePath, showType) {
  console.log(`\nProcessing: ${path.basename(filePath)}`);
  console.log(`  Show type: ${showType}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  stats.filesProcessed++;

  for (const row of records) {
    stats.rowsRead++;

    const eventDate = row['Event Date'];
    const ticketsValidated = parseInt(row['Tickets validated'] || '0', 10);
    const avgGrossPerTicket = parseFloat(row['Avg. gross per ticket'] || '0');

    // Skip rows with no validated tickets
    if (ticketsValidated <= 0) {
      continue;
    }

    stats.rowsWithValidated++;

    // Calculate gross revenue based on validated tickets
    const grossRevenue = ticketsValidated * avgGrossPerTicket;

    // Find matching event
    const event = await findMatchingEvent(eventDate, showType);

    if (!event) {
      stats.eventsUnmatched++;
      unmatchedDates.push({
        date: eventDate,
        showType,
        validated: ticketsValidated,
        gross: grossRevenue
      });
      continue;
    }

    stats.eventsMatched++;

    // Parse entry date
    const parsed = parseFeverDate(eventDate);
    if (!parsed) continue;

    // Check for existing entry
    const exists = await entryExists(event.id, parsed.date);
    if (exists) {
      stats.entriesSkipped++;
      continue;
    }

    // Insert entry
    try {
      const reference = `${path.basename(filePath)}:${eventDate}`;
      await insertEntry(event.id, ticketsValidated, grossRevenue, parsed.date, reference);
      stats.entriesInserted++;
      console.log(`  + ${event.title} (${parsed.date}): ${ticketsValidated} validated, $${grossRevenue}`);
    } catch (error) {
      stats.errors.push({ eventDate, error: error.message });
      console.error(`  ! Error inserting: ${error.message}`);
    }
  }
}

/**
 * Find FEVER CSV files
 */
function findFeverCSVFiles() {
  const files = [];

  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`Docs directory not found: ${DOCS_DIR}`);
    return files;
  }

  const entries = fs.readdirSync(DOCS_DIR);

  for (const entry of entries) {
    if (!entry.endsWith('.csv')) continue;

    const fullPath = path.join(DOCS_DIR, entry);

    if (entry.includes('iD Comedy Club') && entry.includes('FEVER')) {
      files.push({ path: fullPath, showType: 'iD Comedy Club' });
    } else if (entry.includes('Magic Mic') && entry.includes('FEVER')) {
      files.push({ path: fullPath, showType: 'Magic Mic Comedy' });
    } else if (entry.includes('Off The Record') && entry.includes('FEVER')) {
      files.push({ path: fullPath, showType: 'Off The Record' });
    }
  }

  return files;
}

async function main() {
  console.log('=== FEVER Sales Import ===');
  console.log(`Partner ID: ${FEVER_PARTNER_ID}`);
  console.log(`Commission Rate: ${COMMISSION_RATE}%`);
  console.log('Using VALIDATED tickets only (what you get paid on)\n');

  if (!SUPABASE_KEY) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
    process.exit(1);
  }

  const files = findFeverCSVFiles();

  if (files.length === 0) {
    console.error('No FEVER CSV files found in agents/docs/');
    process.exit(1);
  }

  console.log(`Found ${files.length} FEVER CSV file(s):`);
  files.forEach(f => console.log(`  - ${path.basename(f.path)}`));

  for (const file of files) {
    await processCSVFile(file.path, file.showType);
  }

  // Print summary
  console.log('\n=== Import Summary ===');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Rows read: ${stats.rowsRead}`);
  console.log(`Rows with validated tickets: ${stats.rowsWithValidated}`);
  console.log(`Events matched: ${stats.eventsMatched}`);
  console.log(`Events unmatched: ${stats.eventsUnmatched}`);
  console.log(`Entries inserted: ${stats.entriesInserted}`);
  console.log(`Entries skipped (duplicate): ${stats.entriesSkipped}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (unmatchedDates.length > 0) {
    console.log('\n=== Unmatched Dates ===');
    console.log('These FEVER dates had validated tickets but no matching event in database:');
    unmatchedDates.slice(0, 20).forEach(u => {
      console.log(`  ${u.date} (${u.showType}): ${u.validated} validated, $${u.gross}`);
    });
    if (unmatchedDates.length > 20) {
      console.log(`  ... and ${unmatchedDates.length - 20} more`);
    }
  }

  if (stats.errors.length > 0) {
    console.log('\n=== Errors ===');
    stats.errors.forEach(e => {
      console.log(`  ${e.eventDate}: ${e.error}`);
    });
  }
}

main().catch(console.error);
