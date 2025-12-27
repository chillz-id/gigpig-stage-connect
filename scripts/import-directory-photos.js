#!/usr/bin/env node

/**
 * Import Directory Photos
 *
 * Scans comedian photo folders and imports them into the directory system:
 * - Matches folder names to existing directory_profiles by slug
 * - Creates new profiles for folders without a match (photo-only profiles)
 * - Uploads photos to Supabase directory-media storage
 * - Auto-tags photos from filename patterns (event, date, venue)
 * - Sets first image as primary headshot
 *
 * Usage:
 *   node scripts/import-directory-photos.js [options]
 *
 * Options:
 *   --photos-dir=/path    Directory containing comedian folders (default: /root/comedian-photos/Comedians)
 *   --dry-run             Preview what would happen without making changes
 *   --limit=N             Only process N profiles (for testing)
 *   --skip-existing       Skip profiles that already have photos
 *   --single=FolderName   Process only a single folder
 *
 * Examples:
 *   node scripts/import-directory-photos.js --dry-run
 *   node scripts/import-directory-photos.js --limit=5
 *   node scripts/import-directory-photos.js --single="Aaron Chen"
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

const DEFAULT_PHOTOS_DIR = '/root/comedian-photos/Comedians';
const STORAGE_BUCKET = 'directory-media';
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Statistics
const stats = {
  folders_found: 0,
  profiles_matched: 0,
  profiles_created: 0,
  photos_uploaded: 0,
  photos_skipped: 0,
  errors: [],
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a URL-safe slug from a name
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract tags from filename patterns
 * Examples:
 * - "MMC070421-110.jpg" → ['magic-mic-comedy', '2021-04']
 * - "iD Comedy Kinselas 12.09.22-65.jpg" → ['id-comedy', 'kinselas', '2022-09']
 * - "240424_MagicMicComedy_@BYRAVYNA-11.jpg" → ['magic-mic-comedy', '2024-04']
 */
function extractTagsFromFilename(filename) {
  const tags = [];
  const lowerFilename = filename.toLowerCase();

  // Event/Venue patterns
  const eventPatterns = [
    { pattern: /mmc/i, tag: 'magic-mic-comedy' },
    { pattern: /magic\s*mic\s*comedy/i, tag: 'magic-mic-comedy' },
    { pattern: /id\s*comedy/i, tag: 'id-comedy' },
    { pattern: /kinselas/i, tag: 'kinselas' },
    { pattern: /comedy\s*store/i, tag: 'comedy-store' },
    { pattern: /laugh\s*garage/i, tag: 'laugh-garage' },
    { pattern: /fringe/i, tag: 'fringe-festival' },
    { pattern: /enmore/i, tag: 'enmore-theatre' },
    { pattern: /byravyna/i, tag: 'byravyna' },
  ];

  for (const { pattern, tag } of eventPatterns) {
    if (pattern.test(filename)) {
      tags.push(tag);
    }
  }

  // Date extraction patterns
  // Format: DDMMYY or DD.MM.YY
  const datePatterns = [
    /(\d{2})\.(\d{2})\.(\d{2})/,  // 12.09.22 → Sep 2022
    /(\d{2})(\d{2})(\d{2})-/,      // 070421- → Apr 2021
    /(\d{2})(\d{2})(\d{2})_/,      // 240424_ → Apr 2024
  ];

  for (const pattern of datePatterns) {
    const match = filename.match(pattern);
    if (match) {
      // Determine if it's DDMMYY or YYMMDD format
      const [, part1, part2, part3] = match;
      let year, month;

      // If first part is > 31, it's probably YYMMDD
      if (parseInt(part1) > 31) {
        year = parseInt(part1);
        month = parseInt(part2);
      } else {
        // Assume DDMMYY
        month = parseInt(part2);
        year = parseInt(part3);
      }

      // Validate month
      if (month >= 1 && month <= 12) {
        // Convert 2-digit year to 4-digit
        const fullYear = year < 50 ? 2000 + year : 1900 + year;
        const monthStr = month.toString().padStart(2, '0');
        tags.push(`${fullYear}-${monthStr}`);
      }
      break;
    }
  }

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'image/jpeg';
}

/**
 * Check if a file is an image
 */
function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = {
    photosDir: DEFAULT_PHOTOS_DIR,
    dryRun: false,
    limit: null,
    skipExisting: false,
    single: null,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--skip-existing') {
      args.skipExisting = true;
    } else if (arg.startsWith('--photos-dir=')) {
      args.photosDir = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      args.limit = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--single=')) {
      args.single = arg.split('=')[1];
    }
  }

  return args;
}

// ============================================================================
// Database Functions
// ============================================================================

/**
 * Find existing profile by slug
 */
async function findProfileBySlug(supabase, slug) {
  const { data, error } = await supabase
    .from('directory_profiles')
    .select('id, stage_name, slug, email')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Create a new directory profile (photo-only, no email)
 */
async function createProfile(supabase, stageName, slug) {
  const { data, error } = await supabase
    .from('directory_profiles')
    .insert({
      stage_name: stageName,
      slug: slug,
      source: 'bulk_import',
      tags: ['photo-only'],
    })
    .select('id, stage_name, slug')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Check if profile already has photos
 */
async function profileHasPhotos(supabase, profileId) {
  const { count, error } = await supabase
    .from('directory_media')
    .select('id', { count: 'exact', head: true })
    .eq('directory_profile_id', profileId);

  if (error) {
    throw error;
  }

  return count > 0;
}

/**
 * Create a media record for an uploaded photo
 */
async function createMediaRecord(supabase, record) {
  const { data, error } = await supabase
    .from('directory_media')
    .insert(record)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update profile's primary headshot URL
 */
async function updateProfileHeadshot(supabase, profileId, url) {
  const { error } = await supabase
    .from('directory_profiles')
    .update({ primary_headshot_url: url })
    .eq('id', profileId);

  if (error) {
    throw error;
  }
}

// ============================================================================
// Main Import Logic
// ============================================================================

/**
 * Process a single comedian folder
 */
async function processFolder(supabase, folderPath, folderName, args) {
  const slug = generateSlug(folderName);
  const result = {
    folder: folderName,
    profile_id: null,
    photos_uploaded: 0,
    errors: [],
    action: null,
  };

  try {
    // Find or create profile
    let profile = await findProfileBySlug(supabase, slug);

    if (profile) {
      result.action = 'matched';
      result.profile_id = profile.id;

      // Check if profile already has photos
      if (args.skipExisting) {
        const hasPhotos = await profileHasPhotos(supabase, profile.id);
        if (hasPhotos) {
          result.action = 'skipped-has-photos';
          return result;
        }
      }
    } else {
      // Create new profile (photo-only)
      if (!args.dryRun) {
        profile = await createProfile(supabase, folderName, slug);
        result.profile_id = profile.id;
      }
      result.action = 'created';
      stats.profiles_created++;
    }

    // Get all image files in folder
    const files = fs.readdirSync(folderPath)
      .filter(isImageFile)
      .sort(); // Sort alphabetically so first is consistent

    if (files.length === 0) {
      result.action = 'no-images';
      return result;
    }

    let primaryHeadshotUrl = null;

    // Process each image
    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const filePath = path.join(folderPath, filename);
      const isFirst = i === 0;

      try {
        const fileStats = fs.statSync(filePath);
        const tags = extractTagsFromFilename(filename);

        // Add position tags
        if (isFirst) {
          tags.push('headshot', 'primary');
        }

        if (args.dryRun) {
          console.log(chalk.gray(`    Would upload: ${filename} [${tags.join(', ')}]`));
          result.photos_uploaded++;
          continue;
        }

        // Read file
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = getMimeType(filename);

        // Generate storage path
        const timestamp = Date.now();
        const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const folder = isFirst ? 'headshots' : 'gallery';
        const storagePath = `${profile.id}/${folder}/${timestamp}-${safeFilename}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, fileBuffer, {
            contentType: mimeType,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(storagePath);

        const publicUrl = urlData.publicUrl;

        // Create media record
        await createMediaRecord(supabase, {
          directory_profile_id: profile.id,
          storage_path: storagePath,
          public_url: publicUrl,
          file_name: filename,
          file_type: mimeType,
          file_size: fileStats.size,
          media_type: 'photo',
          is_headshot: isFirst,
          is_primary: isFirst,
          display_order: i,
          tags: tags,
          source_filename: filename,
        });

        // Track primary headshot
        if (isFirst) {
          primaryHeadshotUrl = publicUrl;
        }

        result.photos_uploaded++;
        stats.photos_uploaded++;

      } catch (err) {
        const errMsg = `Error uploading ${filename}: ${err.message}`;
        result.errors.push(errMsg);
        stats.errors.push({ folder: folderName, file: filename, error: err.message });
      }
    }

    // Update profile's primary headshot URL
    if (primaryHeadshotUrl && !args.dryRun) {
      await updateProfileHeadshot(supabase, profile.id, primaryHeadshotUrl);
    }

    return result;

  } catch (err) {
    result.errors.push(`Folder error: ${err.message}`);
    stats.errors.push({ folder: folderName, error: err.message });
    return result;
  }
}

/**
 * Main import function
 */
async function importPhotos() {
  const args = parseArgs();

  console.log(chalk.blue.bold('\n📸 Directory Photo Import\n'));

  if (args.dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made\n'));
  }

  const spinner = ora('Initializing...').start();

  // Initialize Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Check photos directory
  if (!fs.existsSync(args.photosDir)) {
    spinner.fail(chalk.red(`Photos directory not found: ${args.photosDir}`));
    process.exit(1);
  }

  spinner.text = 'Scanning comedian folders...';

  // Get all comedian folders
  let folders = fs.readdirSync(args.photosDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort();

  stats.folders_found = folders.length;

  // Filter to single folder if specified
  if (args.single) {
    folders = folders.filter(f => f === args.single);
    if (folders.length === 0) {
      spinner.fail(chalk.red(`Folder not found: ${args.single}`));
      process.exit(1);
    }
  }

  // Apply limit if specified
  if (args.limit && args.limit > 0) {
    folders = folders.slice(0, args.limit);
    console.log(chalk.yellow(`\nLimited to first ${args.limit} folders\n`));
  }

  spinner.succeed(chalk.green(`Found ${stats.folders_found} comedian folders\n`));

  if (folders.length === 0) {
    console.log(chalk.yellow('No folders to process.\n'));
    return;
  }

  console.log(chalk.cyan(`Processing ${folders.length} folders...\n`));

  // Process each folder
  for (let i = 0; i < folders.length; i++) {
    const folderName = folders[i];
    const folderPath = path.join(args.photosDir, folderName);

    const progressPct = Math.round(((i + 1) / folders.length) * 100);
    process.stdout.write(chalk.gray(`[${progressPct}%] `));

    const result = await processFolder(supabase, folderPath, folderName, args);

    // Display result
    let statusIcon;
    let statusColor;

    switch (result.action) {
      case 'matched':
        statusIcon = '🔗';
        statusColor = chalk.green;
        stats.profiles_matched++;
        break;
      case 'created':
        statusIcon = '➕';
        statusColor = chalk.blue;
        break;
      case 'skipped-has-photos':
        statusIcon = '⏭️';
        statusColor = chalk.gray;
        stats.photos_skipped++;
        break;
      case 'no-images':
        statusIcon = '📁';
        statusColor = chalk.yellow;
        break;
      default:
        statusIcon = '❓';
        statusColor = chalk.gray;
    }

    console.log(statusColor(`${statusIcon} ${folderName} - ${result.photos_uploaded} photos (${result.action})`));

    if (result.errors.length > 0) {
      for (const err of result.errors) {
        console.log(chalk.red(`   ⚠️ ${err}`));
      }
    }
  }

  // Summary
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════'));
  console.log(chalk.blue.bold('📊 IMPORT SUMMARY'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════\n'));

  console.log(`${chalk.cyan('Folders found:')} ${stats.folders_found}`);
  console.log(`${chalk.green('Profiles matched:')} ${stats.profiles_matched}`);
  console.log(`${chalk.blue('Profiles created:')} ${stats.profiles_created}`);
  console.log(`${chalk.green('Photos uploaded:')} ${stats.photos_uploaded}`);
  console.log(`${chalk.yellow('Photos skipped:')} ${stats.photos_skipped}`);
  console.log(`${chalk.red('Errors:')} ${stats.errors.length}`);

  if (stats.errors.length > 0 && stats.errors.length <= 10) {
    console.log(chalk.red('\nErrors:'));
    for (const err of stats.errors) {
      console.log(chalk.red(`  - ${err.folder}${err.file ? '/' + err.file : ''}: ${err.error}`));
    }
  }

  console.log(chalk.blue.bold('\n═══════════════════════════════════════════\n'));

  if (args.dryRun) {
    console.log(chalk.yellow('This was a dry run. No changes were made.\n'));
  } else if (stats.errors.length === 0) {
    console.log(chalk.green('✅ Import complete!\n'));
  } else {
    console.log(chalk.yellow('⚠️ Import complete with some errors.\n'));
  }
}

// Run import
importPhotos().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});
