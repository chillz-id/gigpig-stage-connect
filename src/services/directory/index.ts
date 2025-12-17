/**
 * Directory Services
 *
 * Export all directory-related services for managing comedian
 * profiles and media that exist independently of authenticated users.
 */

export * from './directory-service';
export * from './import-service';
export * from './claim-service';

// Re-export types for convenience
export type {
  DirectoryProfile,
  DirectoryProfileType,
  DirectoryMedia,
  DirectoryImportBatch,
  DirectoryProfileInsert,
  DirectoryProfileUpdate,
  DirectoryMediaInsert,
  DirectoryProfileFilters,
  DirectoryProfileWithMedia,
  ImportDirectoryProfileRow,
  DirectoryImportResult,
  DirectoryImportValidation,
  FolderMatch,
  FolderFile,
  PhotoUploadResult,
  ClaimableProfile,
  ClaimResult,
  // Multi-profile photo types
  DirectoryMediaProfile,
  DirectoryMediaProfileInsert,
  DirectoryMediaEvent,
  DirectoryMediaEventInsert,
  DirectoryMediaWithProfiles,
  MediaProfileRole,
  MediaTagApprovalStatus,
  // Venue claim types
  VenueClaim,
  VenueClaimInsert,
  VenueMediaAccess,
  VenueMediaAccessInsert,
  VenueClaimStatus,
  VenueAccessType,
  VenueWithClaim,
  VenueAccessiblePhoto,
} from '@/types/directory';
