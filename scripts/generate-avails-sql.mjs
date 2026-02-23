#!/usr/bin/env node
/**
 * Reads comedian-avails.json and generates SQL INSERT statements
 * for the directory_availability table.
 *
 * Usage: node scripts/generate-avails-sql.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const avails = JSON.parse(readFileSync(resolve(__dirname, '../docs/comedian-avails.json'), 'utf8'));

// Canonical event mapping: pick ONE event per (date, show_type)
// Priority: series_id set > status='open' > lowercase 'iD' title
const canonicalEvents = {
  // Feb 2026
  'Carousel:2026-02-06': '15031fc7-d486-4369-bc13-8f9fb004a2e9',
  'Carousel:2026-02-07': '1f39eefe-aa3b-4798-a71d-c3e4780d902e',
  'Magic Mic Comedy:2026-02-11': '82762293-c1e4-4b91-a212-5137c4b08eeb', // has series_id
  'Carousel:2026-02-13': 'ae624644-b2bc-482f-8026-6d4316d0a246', // has series_id
  'Carousel:2026-02-14': '56bcc25b-3815-4c16-9045-72f21020b3ac', // has series_id
  'Magic Mic Comedy:2026-02-18': 'ebf9801d-ce70-4571-a4aa-2f7ff9191792', // has series_id
  'Carousel:2026-02-20': 'b41ddcb7-adb7-40c2-aece-bfb57c490d72', // has series_id
  'Carousel:2026-02-21': '949e8c5c-214f-4c9f-a887-c9b12522a142',
  'Magic Mic Comedy:2026-02-25': '3d028f68-4e76-4001-99df-2417877dc82b',
  'Carousel:2026-02-27': '0b121250-3ff4-40c8-8d09-915a3bfa5ce6',
  'Carousel:2026-02-28': '24aae3a0-c478-4ec8-98b1-b1eeafd7941f',
  // Mar 2026
  'Magic Mic Comedy:2026-03-04': '6b5680ca-c996-407d-aa37-d5034a7fc9b9', // has series_id
  'Carousel:2026-03-06': '59d03be4-6b5c-4f57-8238-f9f48e57718f',
  'Carousel:2026-03-07': '881cf20a-a2b9-4633-b0f6-1f1da41990d4',
  'Magic Mic Comedy:2026-03-11': '5f14a7ae-3abf-4f73-9348-0ee912775e52',
  'Carousel:2026-03-13': 'acedf981-ac68-469f-a5a5-663e86b158ca',
  'Carousel:2026-03-14': 'c3aa1b71-0aac-4c32-9f97-489f076577c7',
  'Magic Mic Comedy:2026-03-18': '7133e88c-e27e-40d3-a264-3c846ebc84e8',
  'Carousel:2026-03-20': '86df89cb-eda3-40f8-a475-bc1deda65dcd',
  'Carousel:2026-03-21': '90654d4a-a861-40e7-bb11-cefddce84617',
  'Magic Mic Comedy:2026-03-25': '23138f28-122b-4adf-9b90-9793295c4e3c',
  'Carousel:2026-03-27': 'f6ff13b2-7046-4ef4-94ca-c50e934fb90a',
  'Carousel:2026-03-28': '82c54c77-bd95-4e42-8d6b-963fff826a04',
};

// Also need Magic Mic Comedy 2026-02-04 (completed)
canonicalEvents['Magic Mic Comedy:2026-02-04'] = 'faaf3724-ed06-4f48-a45c-90c5b958ce4d';

// Build VALUES rows: (email, date, show_name)
const rows = [];
let skipped = 0;
for (const comedian of avails) {
  for (const avail of comedian.avails) {
    const key = `${avail.show}:${avail.date}`;
    const eventId = canonicalEvents[key];
    if (!eventId) {
      console.error(`No event found for ${key} (${comedian.name})`);
      skipped++;
      continue;
    }
    rows.push({
      email: comedian.email.toLowerCase().trim(),
      date: avail.date,
      show: avail.show,
      eventId,
    });
  }
}

console.log(`Total rows: ${rows.length}, Skipped: ${skipped}`);

// Generate SQL in batches of 100
const BATCH_SIZE = 100;
const batches = [];
for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE);
  const values = batch.map(r =>
    `('${r.email}', '${r.date}', '${r.show}', '${r.eventId}')`
  ).join(',\n  ');

  const sql = `
WITH raw_avails(email, available_date, show_name, event_id) AS (
  VALUES
  ${values}
)
INSERT INTO directory_availability (directory_profile_id, event_id, available_date, show_name, source)
SELECT
  dp.id,
  ra.event_id::uuid,
  ra.available_date::date,
  ra.show_name,
  'google_forms'
FROM raw_avails ra
JOIN directory_profiles dp ON LOWER(dp.email) = ra.email
ON CONFLICT (directory_profile_id, available_date, show_name) DO NOTHING;`;

  batches.push(sql);
}

// Write all batches to a file
const output = batches.join('\n\n-- BATCH SEPARATOR --\n\n');
writeFileSync(resolve(__dirname, '../docs/avails-import.sql'), output, 'utf8');
console.log(`Generated ${batches.length} SQL batches in docs/avails-import.sql`);

// Also write individual batch files for MCP execution
for (let i = 0; i < batches.length; i++) {
  writeFileSync(
    resolve(__dirname, `../docs/avails-batch-${i + 1}.sql`),
    batches[i],
    'utf8'
  );
}
console.log(`Wrote ${batches.length} individual batch files`);
