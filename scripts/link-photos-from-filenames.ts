/**
 * One-time script to link photos to photographers and venues based on filename patterns
 *
 * Patterns detected:
 * - 240424_MagicMicComedy_@BYRAVYNA-11.jpg → date, event, photographer
 * - iD Comedy Kinselas 12.09.22-65.jpg → event, venue, date
 * - MMC070421-1.jpg → event abbreviation, date
 * - _LBH7428.jpg → photographer initials
 *
 * Usage: npx tsx scripts/link-photos-from-filenames.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Need:');
  console.error('  - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Known photographers with their IDs
const PHOTOGRAPHERS: Record<string, string> = {
  'byravyna': '4454c651-3e22-4815-9656-31ca72883a5f',    // By Ravyna
  '@byravyna': '4454c651-3e22-4815-9656-31ca72883a5f',   // By Ravyna
  'lbh': 'dc937c3e-5b5e-4415-a37b-d3d58322fd04',         // Lachlan B Harmer
  '_lbh': 'dc937c3e-5b5e-4415-a37b-d3d58322fd04',        // Lachlan B Harmer (with underscore prefix)
  'milad': '54e52045-71b1-4ab3-b34c-7088bf823245',       // Milad K Studio
  'ness': '69176707-2416-4e5c-9114-5f3a30842eb2',        // Ness Studios
};

// Event name patterns
const EVENT_PATTERNS: Record<string, string> = {
  'magicmic': 'Magic Mic Comedy',
  'magic mic': 'Magic Mic Comedy',
  'mmc': 'Magic Mic Comedy',
  'idcomedy': 'iD Comedy',
  'id comedy': 'iD Comedy',
};

// Venue name patterns
const VENUE_PATTERNS: Record<string, string> = {
  'kinselas': 'Kinselas',
};

interface ParsedFilename {
  photographerId: string | null;
  eventName: string | null;
  venueName: string | null;
  sessionDate: Date | null;
}

interface Stats {
  total: number;
  photographerLinked: number;
  eventLinked: number;
  venueLinked: number;
  dateExtracted: number;
  errors: number;
}

/**
 * Parse a date from filename in various formats
 */
function parseDate(filename: string): Date | null {
  // Format: YYMMDD (e.g., 240424 = 2024-04-24)
  const yymmddMatch = filename.match(/(\d{2})(\d{2})(\d{2})(?:_|-|\.)/);
  if (yymmddMatch) {
    const [, yy, mm, dd] = yymmddMatch;
    const year = parseInt(yy, 10);
    const month = parseInt(mm, 10);
    const day = parseInt(dd, 10);

    // Validate and determine if it's YYMMDD or DDMMYY
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      // Likely YYMMDD
      const fullYear = year >= 50 ? 1900 + year : 2000 + year;
      return new Date(fullYear, month - 1, day);
    } else if (day >= 1 && day <= 12 && month >= 1 && month <= 31) {
      // Likely DDMMYY (swap day and month)
      const fullYear = year >= 50 ? 1900 + year : 2000 + year;
      return new Date(fullYear, day - 1, month);
    }
  }

  // Format: DD.MM.YY (e.g., 12.09.22 = 2022-09-12)
  const dotMatch = filename.match(/(\d{1,2})\.(\d{1,2})\.(\d{2})/);
  if (dotMatch) {
    const [, dd, mm, yy] = dotMatch;
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = parseInt(yy, 10);
    const fullYear = year >= 50 ? 1900 + year : 2000 + year;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(fullYear, month - 1, day);
    }
  }

  return null;
}

/**
 * Parse filename to extract photographer, event, venue, and date
 */
function parseFilename(filename: string): ParsedFilename {
  const lowerFilename = filename.toLowerCase();
  const result: ParsedFilename = {
    photographerId: null,
    eventName: null,
    venueName: null,
    sessionDate: null,
  };

  // Check for photographer patterns
  for (const [pattern, photographerId] of Object.entries(PHOTOGRAPHERS)) {
    if (lowerFilename.includes(pattern)) {
      result.photographerId = photographerId;
      break;
    }
  }

  // Special case: _LBH prefix (Lachlan B Harmer)
  if (lowerFilename.startsWith('_lbh')) {
    result.photographerId = PHOTOGRAPHERS['lbh'];
  }

  // Check for event patterns
  for (const [pattern, eventName] of Object.entries(EVENT_PATTERNS)) {
    if (lowerFilename.includes(pattern.replace(/ /g, ''))) {
      result.eventName = eventName;
      break;
    }
    if (lowerFilename.includes(pattern)) {
      result.eventName = eventName;
      break;
    }
  }

  // Check for venue patterns
  for (const [pattern, venueName] of Object.entries(VENUE_PATTERNS)) {
    if (lowerFilename.includes(pattern)) {
      result.venueName = venueName;
      break;
    }
  }

  // Parse date
  result.sessionDate = parseDate(filename);

  return result;
}

/**
 * Get or create a venue profile
 */
async function getOrCreateVenue(venueName: string): Promise<string | null> {
  // First, check if venue already exists
  const { data: existing } = await supabase
    .from('directory_profiles')
    .select('id')
    .eq('stage_name', venueName)
    .eq('profile_type', 'venue')
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new venue profile
  const slug = venueName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const { data: newVenue, error } = await supabase
    .from('directory_profiles')
    .insert({
      stage_name: venueName,
      slug,
      profile_type: 'venue',
      source: 'manual',
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Failed to create venue ${venueName}:`, error.message);
    return null;
  }

  console.log(`  Created venue profile: ${venueName} (${newVenue.id})`);
  return newVenue.id;
}

/**
 * Link a photo to a photographer
 */
async function linkPhotographer(mediaId: string, photographerId: string): Promise<boolean> {
  // Check if link already exists
  const { data: existing } = await supabase
    .from('directory_media_profiles')
    .select('id')
    .eq('media_id', mediaId)
    .eq('profile_id', photographerId)
    .eq('role', 'photographer')
    .single();

  if (existing) {
    return false; // Already linked
  }

  const { error } = await supabase
    .from('directory_media_profiles')
    .insert({
      media_id: mediaId,
      profile_id: photographerId,
      role: 'photographer',
      is_primary_subject: false,
      can_use_for_promo: true,
    });

  if (error) {
    console.error(`  Failed to link photographer for ${mediaId}:`, error.message);
    return false;
  }

  return true;
}

/**
 * Link a photo to an event/venue/date
 */
async function linkEvent(
  mediaId: string,
  eventName: string | null,
  venueId: string | null,
  venueName: string | null,
  sessionDate: Date | null
): Promise<boolean> {
  // Check if link already exists
  const { data: existing } = await supabase
    .from('directory_media_events')
    .select('id')
    .eq('media_id', mediaId)
    .single();

  if (existing) {
    return false; // Already linked
  }

  const { error } = await supabase
    .from('directory_media_events')
    .insert({
      media_id: mediaId,
      session_name: eventName,
      venue_id: venueId,
      venue_name: venueName,
      session_date: sessionDate?.toISOString(),
    });

  if (error) {
    console.error(`  Failed to link event for ${mediaId}:`, error.message);
    return false;
  }

  return true;
}

async function main() {
  console.log('=== Link Photos from Filenames ===\n');

  // Fetch all photos with pagination (Supabase default limit is 1000)
  let allPhotos: Array<{ id: string; file_name: string }> = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data: batch, error: fetchError } = await supabase
      .from('directory_media')
      .select('id, file_name')
      .order('created_at', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      console.error('Failed to fetch photos:', fetchError.message);
      process.exit(1);
    }

    if (!batch || batch.length === 0) break;
    allPhotos = allPhotos.concat(batch);
    offset += batchSize;

    if (batch.length < batchSize) break;
  }

  const photos = allPhotos;
  console.log(`Found ${photos.length} photos to process\n`);

  const stats: Stats = {
    total: photos.length,
    photographerLinked: 0,
    eventLinked: 0,
    venueLinked: 0,
    dateExtracted: 0,
    errors: 0,
  };

  // Cache for venue IDs
  const venueCache: Record<string, string | null> = {};

  // Process each photo
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (!photo) continue;

    const filename = photo.file_name;
    const parsed = parseFilename(filename);

    // Link photographer if found
    if (parsed.photographerId) {
      const linked = await linkPhotographer(photo.id, parsed.photographerId);
      if (linked) {
        stats.photographerLinked++;
      }
    }

    // Get or create venue if found
    let venueId: string | null = null;
    if (parsed.venueName) {
      if (!(parsed.venueName in venueCache)) {
        venueCache[parsed.venueName] = await getOrCreateVenue(parsed.venueName);
      }
      venueId = venueCache[parsed.venueName] ?? null;
      if (venueId) {
        stats.venueLinked++;
      }
    }

    // Link event/venue/date if any info found
    if (parsed.eventName || venueId || parsed.venueName || parsed.sessionDate) {
      const linked = await linkEvent(
        photo.id,
        parsed.eventName,
        venueId,
        parsed.venueName,
        parsed.sessionDate
      );
      if (linked) {
        stats.eventLinked++;
        if (parsed.sessionDate) {
          stats.dateExtracted++;
        }
      }
    }

    // Progress indicator
    if ((i + 1) % 100 === 0 || i === photos.length - 1) {
      console.log(`Processed ${i + 1}/${photos.length} photos...`);
    }
  }

  // Print summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total photos processed:    ${stats.total}`);
  console.log(`Photographers linked:      ${stats.photographerLinked}`);
  console.log(`Events linked:             ${stats.eventLinked}`);
  console.log(`Venues linked:             ${stats.venueLinked}`);
  console.log(`Dates extracted:           ${stats.dateExtracted}`);
  console.log(`Errors:                    ${stats.errors}`);

  // Verify final state
  console.log('\n=== VERIFICATION ===');

  const { data: photographerCount } = await supabase
    .from('directory_media_profiles')
    .select('id', { count: 'exact' })
    .eq('role', 'photographer');

  const { data: eventCount } = await supabase
    .from('directory_media_events')
    .select('id', { count: 'exact' });

  console.log(`Total photographer links in DB: ${photographerCount?.length ?? 0}`);
  console.log(`Total event links in DB: ${eventCount?.length ?? 0}`);
}

main()
  .then(() => {
    console.log('\n✅ Script complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });
