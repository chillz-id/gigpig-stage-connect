/**
 * Directory Import Service
 *
 * Handles CSV import for directory profiles and folder-based photo uploads.
 * Follows patterns from CRM import-service.ts.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ImportDirectoryProfileRow,
  DirectoryImportResult,
  DirectoryImportValidation,
  DirectoryImportBatch,
  DirectoryProfileInsert,
  DirectoryProfileType,
  FolderMatch,
  FolderFile,
  PhotoUploadResult,
  ImportError,
} from '@/types/directory';
import {
  createDirectoryProfile,
  updateDirectoryProfile,
  getDirectoryProfileByEmail,
  uploadDirectoryPhoto,
  generateSlug,
} from './directory-service';

// ============================================================================
// CSV Parsing
// ============================================================================

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

/**
 * Parse CSV file into structured data
 */
export async function parseCSV(file: File): Promise<ParsedCSV> {
  const csvContent = await file.text();
  return parseCSVContent(csvContent);
}

/**
 * Parse CSV string into structured data
 */
export function parseCSVContent(csvContent: string): ParsedCSV {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0] ?? '');

  // Parse data rows
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i] ?? '');
    rows.push(values);
  }

  return { headers, rows };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// ============================================================================
// Column Mapping
// ============================================================================

// Standard column mappings for common CSV formats
const COLUMN_MAPPINGS: Record<string, keyof ImportDirectoryProfileRow> = {
  // Stage name variations
  'stage_name': 'stage_name',
  'stage name': 'stage_name',
  'stagename': 'stage_name',
  'name': 'stage_name',
  'comedian': 'stage_name',
  'performer': 'stage_name',
  'artist': 'stage_name',

  // Email variations
  'email': 'email',
  'e-mail': 'email',
  'email address': 'email',
  'emailaddress': 'email',

  // Legal name
  'legal_name': 'legal_name',
  'legal name': 'legal_name',
  'legalname': 'legal_name',
  'full name': 'legal_name',
  'real name': 'legal_name',

  // First/Last name (combined into legal_name during import)
  'first_name': 'first_name',
  'first name': 'first_name',
  'firstname': 'first_name',
  'given name': 'first_name',
  'last_name': 'last_name',
  'last name': 'last_name',
  'lastname': 'last_name',
  'surname': 'last_name',
  'family name': 'last_name',

  // Bio variations
  'short_bio': 'short_bio',
  'short bio': 'short_bio',
  'shortbio': 'short_bio',
  'bio': 'short_bio',
  'description': 'short_bio',
  'about': 'short_bio',

  'long_bio': 'long_bio',
  'long bio': 'long_bio',
  'longbio': 'long_bio',
  'full bio': 'long_bio',

  // Pronouns
  'pronouns': 'pronouns',

  // Location
  'origin_city': 'origin_city',
  'origin city': 'origin_city',
  'city': 'origin_city',
  'location': 'origin_city',

  'origin_country': 'origin_country',
  'origin country': 'origin_country',
  'country': 'origin_country',

  // Contact
  'website': 'website',
  'site': 'website',
  'url': 'website',

  'booking_email': 'booking_email',
  'booking email': 'booking_email',
  'bookingemail': 'booking_email',

  // Social links
  'instagram_url': 'instagram_url',
  'instagram': 'instagram_url',
  'ig': 'instagram_url',
  'insta': 'instagram_url',

  'tiktok_url': 'tiktok_url',
  'tiktok': 'tiktok_url',
  'tik tok': 'tiktok_url',

  'youtube_url': 'youtube_url',
  'youtube': 'youtube_url',
  'yt': 'youtube_url',

  'facebook_url': 'facebook_url',
  'facebook': 'facebook_url',
  'fb': 'facebook_url',

  'twitter_url': 'twitter_url',
  'twitter': 'twitter_url',
  'x': 'twitter_url',

  // Tags
  'tags': 'tags',
  'categories': 'tags',
  'genres': 'tags',
  'style': 'tags',

  // Financial (stored in metadata.financial)
  'abn': 'abn',
  'australian business number': 'abn',
};

/**
 * Auto-detect column mappings from CSV headers
 */
export function detectColumnMappings(
  headers: string[]
): Record<string, keyof ImportDirectoryProfileRow> {
  const mappings: Record<string, keyof ImportDirectoryProfileRow> = {};

  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    const mapping = COLUMN_MAPPINGS[normalizedHeader];
    if (mapping) {
      mappings[header] = mapping;
    }
  });

  return mappings;
}

/**
 * Get available target fields for mapping
 */
export function getAvailableTargetFields(): Array<{
  key: keyof ImportDirectoryProfileRow;
  label: string;
  required: boolean;
  description?: string;
}> {
  return [
    { key: 'stage_name', label: 'Stage Name', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'legal_name', label: 'Legal Name', required: false },
    { key: 'first_name', label: 'First Name', required: false, description: 'Combined with Last Name into Legal Name' },
    { key: 'last_name', label: 'Last Name', required: false, description: 'Combined with First Name into Legal Name' },
    { key: 'short_bio', label: 'Short Bio', required: false },
    { key: 'long_bio', label: 'Long Bio', required: false },
    { key: 'pronouns', label: 'Pronouns', required: false },
    { key: 'origin_city', label: 'City/State', required: false },
    { key: 'origin_country', label: 'Country', required: false },
    { key: 'website', label: 'Website', required: false },
    { key: 'booking_email', label: 'Booking Email', required: false },
    { key: 'instagram_url', label: 'Instagram', required: false },
    { key: 'tiktok_url', label: 'TikTok', required: false },
    { key: 'youtube_url', label: 'YouTube', required: false },
    { key: 'facebook_url', label: 'Facebook', required: false },
    { key: 'twitter_url', label: 'Twitter/X', required: false },
    { key: 'abn', label: 'ABN', required: false, description: 'Australian Business Number - stored in financial details' },
    { key: 'tags', label: 'Tags (comma-separated)', required: false },
  ];
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate and map CSV rows to import format
 */
export async function validateAndMapRows(
  headers: string[],
  rows: string[][],
  columnMappings: Record<string, string>
): Promise<DirectoryImportValidation> {
  const errors: Array<{ row: number; message: string }> = [];
  const mappedRows: ImportDirectoryProfileRow[] = [];

  // Check if stage_name column is mapped
  const hasStageNameMapping = Object.values(columnMappings).includes('stage_name');
  if (!hasStageNameMapping) {
    errors.push({ row: 0, message: 'No stage name column detected. Stage name is required for import.' });
    return { validCount: 0, skippedCount: rows.length, errorCount: 1, errors, validRows: [] };
  }

  let skipped = 0;

  rows.forEach((rowValues, index) => {
    const rowNum = index + 2; // +2 for 1-indexed and header row
    const mappedRow: ImportDirectoryProfileRow = { stage_name: '' };

    // Map values based on column mappings
    headers.forEach((header, colIndex) => {
      const importField = columnMappings[header];
      if (!importField || importField === 'ignore') return;

      const value = rowValues[colIndex]?.trim() ?? '';
      if (!value) return;

      if (importField === 'stage_name') {
        mappedRow.stage_name = value;
      } else if (importField === 'email') {
        mappedRow.email = value.toLowerCase();
      } else if (importField === 'tags') {
        mappedRow.tags = value;
      } else {
        (mappedRow as Record<string, string | undefined>)[importField] = value;
      }
    });

    // Validate stage_name
    if (!mappedRow.stage_name) {
      errors.push({ row: rowNum, message: 'Missing stage name' });
      skipped++;
    } else {
      // Validate email if provided
      if (mappedRow.email && !isValidEmail(mappedRow.email)) {
        mappedRow.email = undefined;
      }

      // Normalize social URLs
      if (mappedRow.instagram_url) {
        mappedRow.instagram_url = normalizeInstagramUrl(mappedRow.instagram_url);
      }
      if (mappedRow.tiktok_url) {
        mappedRow.tiktok_url = normalizeTikTokUrl(mappedRow.tiktok_url);
      }

      // Combine first_name + last_name into legal_name if not already set
      if (!mappedRow.legal_name && (mappedRow.first_name || mappedRow.last_name)) {
        const parts = [mappedRow.first_name, mappedRow.last_name].filter(Boolean);
        mappedRow.legal_name = parts.join(' ');
      }

      // Normalize ABN (remove spaces, validate 11 digits)
      if (mappedRow.abn) {
        const cleanAbn = mappedRow.abn.replace(/\s/g, '');
        if (/^\d{11}$/.test(cleanAbn)) {
          mappedRow.abn = cleanAbn;
        } else {
          // Invalid ABN format - clear it but don't fail the row
          mappedRow.abn = undefined;
        }
      }

      mappedRows.push(mappedRow);
    }
  });

  return {
    validCount: mappedRows.length,
    skippedCount: skipped,
    errorCount: errors.length,
    errors,
    validRows: mappedRows,
  };
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize Instagram URL/handle to full URL
 */
function normalizeInstagramUrl(input: string): string {
  if (input.startsWith('http')) return input;
  const handle = input.replace(/^@/, '');
  return `https://instagram.com/${handle}`;
}

/**
 * Normalize TikTok URL/handle to full URL
 */
function normalizeTikTokUrl(input: string): string {
  if (input.startsWith('http')) return input;
  const handle = input.replace(/^@/, '');
  return `https://tiktok.com/@${handle}`;
}

// ============================================================================
// Import Execution
// ============================================================================

/**
 * Create an import batch record
 */
export async function createImportBatch(
  name: string,
  sourceFile: string,
  totalProfiles: number,
  totalPhotos: number = 0
): Promise<DirectoryImportBatch> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('directory_import_batches')
    .insert({
      name,
      source_file: sourceFile,
      imported_by: userData?.user?.id ?? null,
      total_profiles: totalProfiles,
      total_photos: totalPhotos,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create import batch: ${error.message}`);
  }

  return data as DirectoryImportBatch;
}

/**
 * Update import batch status and stats
 */
export async function updateImportBatch(
  batchId: string,
  updates: Partial<Pick<
    DirectoryImportBatch,
    | 'status'
    | 'profiles_created'
    | 'profiles_updated'
    | 'photos_uploaded'
    | 'errors_count'
    | 'error_log'
    | 'started_at'
    | 'completed_at'
  >>
): Promise<void> {
  const { error } = await supabase
    .from('directory_import_batches')
    .update(updates)
    .eq('id', batchId);

  if (error) {
    throw new Error(`Failed to update import batch: ${error.message}`);
  }
}

/**
 * Import directory profiles from mapped rows
 */
export async function importDirectoryProfiles(
  rows: ImportDirectoryProfileRow[],
  source: string,
  onProgress?: (progress: number) => void,
  profileType: DirectoryProfileType = 'comedian_lite'
): Promise<DirectoryImportResult> {
  // Create import batch
  const batch = await createImportBatch(
    `Import from ${source}`,
    source,
    rows.length
  );

  const result: DirectoryImportResult = {
    successCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: [],
    batch_id: batch.id,
  };

  const errorLog: ImportError[] = [];

  // Start the batch
  await updateImportBatch(batch.id, {
    status: 'processing',
    started_at: new Date().toISOString(),
  });

  // Dedupe rows by stage name (keep last occurrence)
  const deduped = new Map<string, ImportDirectoryProfileRow>();
  rows.forEach(row => {
    deduped.set(row.stage_name.toLowerCase(), row);
  });
  const uniqueRows = Array.from(deduped.values());
  result.skippedCount = rows.length - uniqueRows.length;

  for (let i = 0; i < uniqueRows.length; i++) {
    const row = uniqueRows[i];
    if (!row) continue;

    try {
      // Check if profile exists by email (if provided)
      let existingProfile = null;
      if (row.email) {
        existingProfile = await getDirectoryProfileByEmail(row.email);
      }

      // Parse tags if provided
      const tags = row.tags
        ? row.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      // Build metadata object with ABN if provided
      const metadata: Record<string, unknown> = {};
      if (row.abn) {
        metadata.financial = { abn: row.abn };
      }

      const profileData: DirectoryProfileInsert = {
        stage_name: row.stage_name,
        email: row.email || null,
        legal_name: row.legal_name || null,
        short_bio: row.short_bio || null,
        long_bio: row.long_bio || null,
        pronouns: row.pronouns || null,
        origin_city: row.origin_city || null,
        origin_country: row.origin_country || 'Australia',
        website: row.website || null,
        booking_email: row.booking_email || null,
        instagram_url: row.instagram_url || null,
        tiktok_url: row.tiktok_url || null,
        youtube_url: row.youtube_url || null,
        facebook_url: row.facebook_url || null,
        twitter_url: row.twitter_url || null,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        tags,
        profile_type: profileType,
        source: 'bulk_import',
        import_batch_id: batch.id,
      };

      if (existingProfile) {
        // Update existing profile
        await updateDirectoryProfile(existingProfile.id, profileData);
      } else {
        // Create new profile
        await createDirectoryProfile(profileData);
      }
      result.successCount++;
    } catch (error) {
      result.errorCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`${row.stage_name}: ${errorMessage}`);
      errorLog.push({
        row: i + 2,
        stage_name: row.stage_name,
        email: row.email,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }

    // Report progress as percentage
    const progress = Math.round(((i + 1) / uniqueRows.length) * 100);
    onProgress?.(progress);
  }

  // Complete the batch
  await updateImportBatch(batch.id, {
    status: result.errorCount === uniqueRows.length ? 'failed' : 'completed',
    profiles_created: result.successCount,
    profiles_updated: 0,
    errors_count: result.errorCount,
    error_log: errorLog,
    completed_at: new Date().toISOString(),
  });

  return result;
}

// ============================================================================
// Folder Matching
// ============================================================================

/**
 * Match folder names to directory profiles
 */
export async function matchFoldersToProfiles(
  folders: Array<{ name: string; files: FolderFile[] }>
): Promise<FolderMatch[]> {
  // Get all directory profiles
  const { data: profiles, error } = await supabase
    .from('directory_profiles')
    .select('id, stage_name, slug');

  if (error) {
    throw new Error(`Failed to fetch profiles for matching: ${error.message}`);
  }

  const matches: FolderMatch[] = [];

  for (const folder of folders) {
    const folderSlug = generateSlug(folder.name);

    // Try to find a matching profile
    let bestMatch: { id: string; stage_name: string; confidence: FolderMatch['match_confidence'] } | null = null;

    for (const profile of profiles ?? []) {
      const profileSlug = profile.slug ?? generateSlug(profile.stage_name);

      if (folderSlug === profileSlug) {
        bestMatch = { id: profile.id, stage_name: profile.stage_name, confidence: 'exact' };
        break;
      }

      // Check for high confidence (contains full match)
      if (
        folderSlug.includes(profileSlug) ||
        profileSlug.includes(folderSlug)
      ) {
        if (!bestMatch || bestMatch.confidence === 'medium' || bestMatch.confidence === 'low') {
          bestMatch = { id: profile.id, stage_name: profile.stage_name, confidence: 'high' };
        }
      }

      // Check for medium confidence (word overlap)
      const folderWords = folderSlug.split('-').filter(Boolean);
      const profileWords = profileSlug.split('-').filter(Boolean);
      const overlap = folderWords.filter(w => profileWords.includes(w)).length;

      if (overlap >= 2 && (!bestMatch || bestMatch.confidence === 'low')) {
        bestMatch = { id: profile.id, stage_name: profile.stage_name, confidence: 'medium' };
      }
    }

    matches.push({
      folder_name: folder.name,
      profile_id: bestMatch?.id ?? null,
      profile_stage_name: bestMatch?.stage_name ?? null,
      match_confidence: bestMatch?.confidence ?? 'none',
      files: folder.files,
    });
  }

  return matches;
}

/**
 * Upload photos from matched folders
 *
 * IMPORTANT: Each FolderFile must have the `file` property set with the actual
 * File object for uploads to work. Without it, uploads will be skipped.
 */
export async function uploadPhotosFromMatches(
  matches: FolderMatch[],
  batchId: string,
  onProgress?: (processed: number, total: number, current: string) => void
): Promise<PhotoUploadResult[]> {
  const results: PhotoUploadResult[] = [];

  // Filter to only matched folders
  const matchedFolders = matches.filter(m => m.profile_id !== null);

  let totalFiles = 0;
  matchedFolders.forEach(m => {
    totalFiles += m.files.filter(f => f.is_image && f.file).length;
  });

  let processed = 0;

  for (const match of matchedFolders) {
    if (!match.profile_id) continue;

    const result: PhotoUploadResult = {
      profile_id: match.profile_id,
      stage_name: match.profile_stage_name ?? match.folder_name,
      photos_uploaded: 0,
      errors: [],
    };

    const imageFiles = match.files
      .filter(f => f.is_image && f.file) // Only files with actual File objects
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    for (let i = 0; i < imageFiles.length; i++) {
      const folderFile = imageFiles[i];
      if (!folderFile?.file) continue;

      try {
        onProgress?.(processed, totalFiles, `${match.folder_name}/${folderFile.name}`);

        // First image is primary headshot
        const isFirst = i === 0;

        // Actually upload the file to Supabase Storage
        await uploadDirectoryPhoto(match.profile_id, folderFile.file, {
          isHeadshot: true, // Treat all imported photos as potential headshots
          isPrimary: isFirst,
          displayOrder: isFirst ? 0 : i + 1,
        });

        result.photos_uploaded++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`${folderFile.name}: ${errorMessage}`);
        console.error(`[uploadPhotosFromMatches] Failed to upload ${folderFile.name}:`, error);
      }

      processed++;
    }

    results.push(result);
  }

  // Update batch with photo count
  const totalUploaded = results.reduce((sum, r) => sum + r.photos_uploaded, 0);
  await updateImportBatch(batchId, {
    photos_uploaded: totalUploaded,
  });

  return results;
}

/**
 * Upload a single photo for a profile (called from UI with actual File object)
 */
export async function uploadProfilePhoto(
  profileId: string,
  file: File,
  isFirst: boolean,
  batchId?: string
): Promise<void> {
  await uploadDirectoryPhoto(profileId, file, {
    isHeadshot: true, // Treat all imported photos as potential headshots
    isPrimary: isFirst,
    displayOrder: isFirst ? 0 : 999, // First gets priority
  });
}

// ============================================================================
// CRM Integration
// ============================================================================

/**
 * Create CRM customer profiles for directory profiles with emails
 * This links the directory to the marketing system
 */
export async function syncDirectoryToCRM(
  profileIds?: string[]
): Promise<{ synced: number; errors: number }> {
  // Get directory profiles with emails that don't have customer_profile_id
  let query = supabase
    .from('directory_profiles')
    .select('id, email, stage_name')
    .not('email', 'is', null)
    .is('customer_profile_id', null);

  if (profileIds && profileIds.length > 0) {
    query = query.in('id', profileIds);
  }

  const { data: profiles, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch profiles for CRM sync: ${error.message}`);
  }

  let synced = 0;
  let errors = 0;

  for (const profile of profiles ?? []) {
    if (!profile.email) continue;

    try {
      // Check if customer already exists
      const { data: existingEmail } = await supabase
        .from('customer_emails')
        .select('customer_id')
        .eq('email', profile.email.toLowerCase())
        .single();

      let customerId: string;

      if (existingEmail?.customer_id) {
        customerId = existingEmail.customer_id;
      } else {
        // Create new customer profile
        const { data: newCustomer, error: createError } = await supabase
          .from('customer_profiles')
          .insert({
            canonical_full_name: profile.stage_name,
            marketing_opt_in: true, // Default to opted-in for directory imports
          })
          .select('id')
          .single();

        if (createError || !newCustomer) {
          throw new Error(createError?.message ?? 'Failed to create customer');
        }

        customerId = newCustomer.id;

        // Add email to customer
        await supabase.from('customer_emails').insert({
          customer_id: customerId,
          email: profile.email.toLowerCase(),
          source: 'directory_import',
          is_primary: true,
        });
      }

      // Link directory profile to customer
      await supabase
        .from('directory_profiles')
        .update({ customer_profile_id: customerId })
        .eq('id', profile.id);

      // Add to "Directory Comedians" segment
      const { data: segment } = await supabase
        .from('segments')
        .select('id')
        .eq('slug', 'directory-comedians')
        .single();

      if (segment) {
        await supabase.from('customer_segment_links').upsert(
          {
            customer_id: customerId,
            segment_id: segment.id,
          },
          { onConflict: 'customer_id,segment_id', ignoreDuplicates: true }
        );
      }

      synced++;
    } catch {
      errors++;
    }
  }

  return { synced, errors };
}

// ============================================================================
// Export as service object
// ============================================================================

export const directoryImportService = {
  // CSV
  parseCSV,
  detectColumnMappings,
  getAvailableTargetFields,
  validateAndMapRows,

  // Import
  createImportBatch,
  updateImportBatch,
  importDirectoryProfiles,

  // Folder matching
  matchFoldersToProfiles,
  uploadPhotosFromMatches,
  uploadProfilePhoto,

  // CRM
  syncDirectoryToCRM,
};
