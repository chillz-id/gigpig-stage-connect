/**
 * Directory System Types
 *
 * Types for the Comedian Directory system - comedian profiles that exist
 * independently of authenticated users. Supports bulk import of photos
 * and contact info, with claim flow when comedians sign up.
 */

// ============================================================================
// Database Row Types (matching Supabase schema)
// ============================================================================

export interface DirectoryProfile {
  id: string;
  stage_name: string;
  slug: string | null;
  email: string | null;
  legal_name: string | null;
  short_bio: string | null;
  long_bio: string | null;
  pronouns: string | null;
  origin_city: string | null;
  origin_country: string | null;
  website: string | null;
  booking_email: string | null;
  primary_headshot_url: string | null;
  hero_image_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  metadata: Record<string, unknown>;
  tags: string[];
  claimed_at: string | null;
  claimed_by: string | null;
  comedians_id: string | null;
  customer_profile_id: string | null;
  source: DirectoryProfileSource;
  import_batch_id: string | null;
  profile_type: DirectoryProfileType | null;
  created_at: string;
  updated_at: string;
}

export type DirectoryProfileSource = 'bulk_import' | 'manual' | 'scraped' | 'migration';
export type DirectoryProfileType = 'comedian' | 'comedian_lite' | 'dj' | 'photographer' | 'videographer' | 'podcast' | 'manager' | 'venue_manager' | 'venue';

export interface DirectoryMedia {
  id: string;
  directory_profile_id: string | null;  // Now nullable for multi-profile photos
  storage_path: string;
  public_url: string | null;
  file_name: string;
  file_type: string;
  file_size: number | null;
  image_width: number | null;
  image_height: number | null;
  aspect_ratio: number | null;
  media_type: DirectoryMediaType;
  is_headshot: boolean;
  is_primary: boolean;
  display_order: number;
  tags: string[];
  alt_text: string | null;
  external_url: string | null;
  external_type: DirectoryExternalType | null;
  external_id: string | null;
  import_batch_id: string | null;
  source_filename: string | null;
  title: string | null;
  // New columns for multi-profile support
  uploaded_by: string | null;
  event_date: string | null;
  photographer_credit: string | null;
  created_at: string;
  updated_at: string;
}

export type DirectoryMediaType = 'photo' | 'video';
export type DirectoryExternalType = 'youtube' | 'vimeo' | 'google_drive';

export interface DirectoryImportBatch {
  id: string;
  name: string | null;
  source_file: string | null;
  imported_by: string | null;
  total_profiles: number;
  total_photos: number;
  profiles_created: number;
  profiles_updated: number;
  photos_uploaded: number;
  errors_count: number;
  error_log: ImportError[];
  status: ImportBatchStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export type ImportBatchStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImportError {
  row?: number;
  stage_name?: string;
  email?: string;
  field?: string;
  message: string;
  timestamp?: string;
}

// ============================================================================
// Insert/Update Types
// ============================================================================

export interface DirectoryProfileInsert {
  stage_name: string;
  slug?: string | null;
  email?: string | null;
  legal_name?: string | null;
  short_bio?: string | null;
  long_bio?: string | null;
  pronouns?: string | null;
  origin_city?: string | null;
  origin_country?: string | null;
  website?: string | null;
  booking_email?: string | null;
  primary_headshot_url?: string | null;
  hero_image_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  metadata?: Record<string, unknown>;
  tags?: string[];
  profile_type?: DirectoryProfileType | null;
  source?: DirectoryProfileSource;
  import_batch_id?: string | null;
}

export interface DirectoryProfileUpdate {
  stage_name?: string;
  slug?: string | null;
  email?: string | null;
  legal_name?: string | null;
  short_bio?: string | null;
  long_bio?: string | null;
  pronouns?: string | null;
  origin_city?: string | null;
  origin_country?: string | null;
  website?: string | null;
  booking_email?: string | null;
  primary_headshot_url?: string | null;
  hero_image_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  metadata?: Record<string, unknown>;
  tags?: string[];
  profile_type?: DirectoryProfileType | null;
}

export interface DirectoryMediaInsert {
  directory_profile_id: string;
  storage_path: string;
  public_url?: string | null;
  file_name: string;
  file_type: string;
  file_size?: number | null;
  image_width?: number | null;
  image_height?: number | null;
  media_type?: DirectoryMediaType;
  is_headshot?: boolean;
  is_primary?: boolean;
  display_order?: number;
  tags?: string[];
  alt_text?: string | null;
  external_url?: string | null;
  external_type?: DirectoryExternalType | null;
  external_id?: string | null;
  import_batch_id?: string | null;
  source_filename?: string | null;
  title?: string | null;
}

// ============================================================================
// CSV Import Types
// ============================================================================

export interface ImportDirectoryProfileRow {
  stage_name: string;
  email?: string;
  legal_name?: string;
  first_name?: string;  // Combined with last_name into legal_name during import
  last_name?: string;   // Combined with first_name into legal_name during import
  short_bio?: string;
  long_bio?: string;
  pronouns?: string;
  origin_city?: string;
  origin_country?: string;
  website?: string;
  booking_email?: string;
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  tags?: string; // Comma-separated
  abn?: string;  // Stored in metadata.financial.abn during import
}

export interface DirectoryImportResult {
  successCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
  batch_id: string;
}

export interface DirectoryImportValidation {
  validCount: number;
  skippedCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
  validRows: ImportDirectoryProfileRow[];
}

// ============================================================================
// Folder Matching Types
// ============================================================================

export interface FolderMatch {
  folder_name: string;
  profile_id: string | null;
  profile_stage_name: string | null;
  match_confidence: 'exact' | 'high' | 'medium' | 'low' | 'none';
  files: FolderFile[];
}

export interface FolderFile {
  name: string;
  path: string;
  size: number;
  type: string;
  is_image: boolean;
}

export interface PhotoUploadResult {
  profile_id: string;
  stage_name: string;
  photos_uploaded: number;
  errors: string[];
}

// ============================================================================
// Query/Filter Types
// ============================================================================

export interface DirectoryProfileFilters {
  search?: string;
  tags?: string[];
  unclaimed_only?: boolean;
  has_photos?: boolean;
  import_batch_id?: string;
  profile_type?: DirectoryProfileType;
}

export interface DirectoryProfileWithMedia extends DirectoryProfile {
  media: DirectoryMedia[];
  photo_count: number;
}

// ============================================================================
// Claim Flow Types
// ============================================================================

export interface ClaimableProfile {
  id: string;
  stage_name: string;
  email: string;
  short_bio: string | null;
  primary_headshot_url: string | null;
  photo_count: number;
}

export interface ClaimResult {
  success: boolean;
  comedian_id?: string;
  photos_copied?: number;
  error?: string;
}

// ============================================================================
// Multi-Profile Photo Types (Junction Tables)
// ============================================================================

export type MediaProfileRole = 'performer' | 'dj' | 'host' | 'photographer' | 'audience' | 'other';
export type MediaTagApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface DirectoryMediaProfile {
  id: string;
  media_id: string;
  profile_id: string;
  role: MediaProfileRole | null;
  is_primary_subject: boolean;
  can_use_for_promo: boolean;
  added_by: string | null;
  added_at: string;
  approval_status: MediaTagApprovalStatus;
  responded_at: string | null;
}

export interface DirectoryMediaProfileInsert {
  media_id: string;
  profile_id: string;
  role?: MediaProfileRole | null;
  is_primary_subject?: boolean;
  can_use_for_promo?: boolean;
  added_by?: string | null;
  approval_status?: MediaTagApprovalStatus;
}

export interface DirectoryMediaEvent {
  id: string;
  media_id: string;
  event_id: string | null;
  htx_event_id: string | null;
  eb_event_id: string | null;
  session_date: string | null;
  session_name: string | null;
  venue_id: string | null;
  venue_name: string | null;
  created_at: string;
}

export interface DirectoryMediaEventInsert {
  media_id: string;
  event_id?: string | null;
  htx_event_id?: string | null;
  eb_event_id?: string | null;
  session_date?: string | null;
  session_name?: string | null;
  venue_id?: string | null;
  venue_name?: string | null;
}

// Extended media type with profile links
export interface DirectoryMediaWithProfiles extends DirectoryMedia {
  profiles: Array<{
    profile: DirectoryProfile;
    role: MediaProfileRole | null;
    is_primary_subject: boolean;
  }>;
  event?: DirectoryMediaEvent | null;
}

// ============================================================================
// Venue Claims Types
// ============================================================================

export type VenueClaimStatus = 'pending' | 'approved' | 'rejected';
export type VenueAccessType = 'auto_all' | 'promoter_restricted' | 'date_range';

export interface VenueClaim {
  id: string;
  venue_id: string;
  claimed_by: string;
  status: VenueClaimStatus;
  verification_method: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  verification_notes: string | null;
  claimed_at: string;
  verified_at: string | null;
  verified_by: string | null;
}

export interface VenueClaimInsert {
  venue_id: string;
  claimed_by: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  verification_notes?: string | null;
}

export interface VenueMediaAccess {
  id: string;
  venue_id: string;
  access_type: VenueAccessType;
  restricted_by: string | null;
  promoter_id: string | null;
  date_from: string | null;
  date_to: string | null;
  can_download: boolean;
  can_use_commercially: boolean;
  requires_attribution: boolean;
  created_at: string;
  updated_at: string;
}

export interface VenueMediaAccessInsert {
  venue_id: string;
  access_type?: VenueAccessType;
  promoter_id?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  can_download?: boolean;
  can_use_commercially?: boolean;
  requires_attribution?: boolean;
}

// Venue with claim info
export interface VenueWithClaim {
  id: string;
  name: string;
  slug: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  claim?: VenueClaim | null;
}

// Photo accessible by venue
export interface VenueAccessiblePhoto {
  media_id: string;
  storage_path: string;
  public_url: string | null;
  event_id: string | null;
  event_date: string | null;
  can_download: boolean;
  can_use_commercially: boolean;
}
