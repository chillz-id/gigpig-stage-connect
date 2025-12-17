/**
 * Venue Claim Service
 *
 * Handles venue registration, claiming, and photo access permissions.
 * Venues can claim their profile to access photos from events at their location.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  VenueClaim,
  VenueClaimInsert,
  VenueMediaAccess,
  VenueWithClaim,
  VenueAccessiblePhoto,
  VenueClaimStatus,
} from '@/types/directory';

// ============================================================================
// Venue Claim Operations
// ============================================================================

/**
 * Submit a claim for a venue
 */
export async function submitVenueClaim(
  claim: VenueClaimInsert
): Promise<VenueClaim> {
  const { data, error } = await supabase
    .from('venue_claims')
    .insert(claim)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('This venue has already been claimed');
    }
    throw new Error(`Failed to submit venue claim: ${error.message}`);
  }

  return data as VenueClaim;
}

/**
 * Get claim status for a venue
 */
export async function getVenueClaimStatus(
  venueId: string
): Promise<VenueClaim | null> {
  const { data, error } = await supabase
    .from('venue_claims')
    .select('*')
    .eq('venue_id', venueId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get venue claim: ${error.message}`);
  }

  return data as VenueClaim | null;
}

/**
 * Get all claims by a user
 */
export async function getUserVenueClaims(
  userId: string
): Promise<VenueClaim[]> {
  const { data, error } = await supabase
    .from('venue_claims')
    .select('*')
    .eq('claimed_by', userId)
    .order('claimed_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user claims: ${error.message}`);
  }

  return (data ?? []) as VenueClaim[];
}

/**
 * Get pending claims (admin use)
 */
export async function getPendingVenueClaims(): Promise<Array<VenueClaim & { venue: { name: string; city: string | null } }>> {
  const { data, error } = await supabase
    .from('venue_claims')
    .select(`
      *,
      venue:venues(name, city)
    `)
    .eq('status', 'pending')
    .order('claimed_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get pending claims: ${error.message}`);
  }

  return (data ?? []) as Array<VenueClaim & { venue: { name: string; city: string | null } }>;
}

/**
 * Approve a venue claim (admin use)
 */
export async function approveVenueClaim(
  claimId: string,
  verifiedBy: string,
  verificationMethod: string = 'manual_review'
): Promise<VenueClaim> {
  const { data, error } = await supabase
    .from('venue_claims')
    .update({
      status: 'approved' as VenueClaimStatus,
      verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
      verification_method: verificationMethod,
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to approve claim: ${error.message}`);
  }

  return data as VenueClaim;
}

/**
 * Reject a venue claim (admin use)
 */
export async function rejectVenueClaim(
  claimId: string,
  verifiedBy: string,
  reason: string
): Promise<VenueClaim> {
  const { data, error } = await supabase
    .from('venue_claims')
    .update({
      status: 'rejected' as VenueClaimStatus,
      verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
      verification_notes: reason,
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reject claim: ${error.message}`);
  }

  return data as VenueClaim;
}

// ============================================================================
// Venue Search for Claiming
// ============================================================================

/**
 * Search venues available for claiming
 */
export async function searchVenuesForClaiming(
  search: string,
  limit = 20
): Promise<VenueWithClaim[]> {
  let query = supabase
    .from('venues')
    .select(`
      id,
      name,
      slug,
      claimed_by,
      claimed_at,
      city
    `);

  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
  }

  const { data, error } = await query
    .order('name', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search venues: ${error.message}`);
  }

  return (data ?? []).map(v => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    claimed_by: v.claimed_by,
    claimed_at: v.claimed_at,
  })) as VenueWithClaim[];
}

/**
 * Check if a venue is claimed
 */
export async function isVenueClaimed(venueId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('venue_claims')
    .select('id')
    .eq('venue_id', venueId)
    .eq('status', 'approved')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check venue claim: ${error.message}`);
  }

  return !!data;
}

// ============================================================================
// Venue Media Access
// ============================================================================

/**
 * Get media access settings for a venue
 */
export async function getVenueMediaAccess(
  venueId: string
): Promise<VenueMediaAccess | null> {
  const { data, error } = await supabase
    .from('venue_media_access')
    .select('*')
    .eq('venue_id', venueId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get venue media access: ${error.message}`);
  }

  return data as VenueMediaAccess | null;
}

/**
 * Update media access settings for a venue
 */
export async function updateVenueMediaAccess(
  venueId: string,
  updates: Partial<Pick<VenueMediaAccess, 'can_download' | 'can_use_commercially' | 'requires_attribution'>>
): Promise<VenueMediaAccess> {
  const { data, error } = await supabase
    .from('venue_media_access')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('venue_id', venueId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update venue media access: ${error.message}`);
  }

  return data as VenueMediaAccess;
}

/**
 * Get photos accessible to a venue
 * Uses the database function for efficient querying
 */
export async function getVenueAccessiblePhotos(
  venueId: string,
  limit = 50,
  offset = 0
): Promise<{ photos: VenueAccessiblePhoto[]; total: number }> {
  // First verify venue is claimed
  const isClaimed = await isVenueClaimed(venueId);
  if (!isClaimed) {
    return { photos: [], total: 0 };
  }

  // Use the database function
  const { data, error, count } = await supabase
    .rpc('get_venue_accessible_photos', { p_venue_id: venueId })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get venue photos: ${error.message}`);
  }

  return {
    photos: (data ?? []) as VenueAccessiblePhoto[],
    total: count ?? data?.length ?? 0,
  };
}

/**
 * Get photo count for a venue
 */
export async function getVenuePhotoCount(venueId: string): Promise<number> {
  const { count, error } = await supabase
    .from('directory_media_events')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venueId);

  if (error) {
    throw new Error(`Failed to get venue photo count: ${error.message}`);
  }

  return count ?? 0;
}

// ============================================================================
// Venue with Photos Summary
// ============================================================================

/**
 * Get venue details with photo access info
 */
export async function getVenueWithPhotoAccess(
  venueId: string,
  userId: string
): Promise<{
  venue: VenueWithClaim;
  claim: VenueClaim | null;
  access: VenueMediaAccess | null;
  photoCount: number;
  canAccessPhotos: boolean;
} | null> {
  // Get venue
  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('id, name, slug, claimed_by, claimed_at')
    .eq('id', venueId)
    .single();

  if (venueError) {
    if (venueError.code === 'PGRST116') return null;
    throw new Error(`Failed to get venue: ${venueError.message}`);
  }

  // Get claim
  const claim = await getVenueClaimStatus(venueId);

  // Get access settings
  const access = await getVenueMediaAccess(venueId);

  // Get photo count
  const photoCount = await getVenuePhotoCount(venueId);

  // Check if user can access photos
  const canAccessPhotos = claim?.status === 'approved' && claim.claimed_by === userId;

  return {
    venue: venue as VenueWithClaim,
    claim,
    access,
    photoCount,
    canAccessPhotos,
  };
}

// ============================================================================
// Export as service object
// ============================================================================

export const venueClaimService = {
  // Claims
  submitVenueClaim,
  getVenueClaimStatus,
  getUserVenueClaims,
  getPendingVenueClaims,
  approveVenueClaim,
  rejectVenueClaim,

  // Search
  searchVenuesForClaiming,
  isVenueClaimed,

  // Media Access
  getVenueMediaAccess,
  updateVenueMediaAccess,
  getVenueAccessiblePhotos,
  getVenuePhotoCount,
  getVenueWithPhotoAccess,
};
