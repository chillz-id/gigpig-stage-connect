/**
 * Headshot Service - API for fetching comedian headshots for automation
 *
 * Used by Canva integration, event lineup generation, and other automation workflows
 * Provides rich metadata including dimensions, aspect ratios, and comedian info
 */

import { supabase } from '@/integrations/supabase/client';

export interface HeadshotMetadata {
  id: string;
  file_name: string;
  public_url: string;
  is_primary: boolean;
  image_width: number | null;
  image_height: number | null;
  aspect_ratio: number | null;
  file_size: number;
  folder_name: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ComedianHeadshots {
  comedian_id: string;
  comedian_name: string;
  stage_name?: string | null;
  profile_url: string;
  headshots: HeadshotMetadata[];
}

/**
 * Get all headshots for a single comedian
 * @param comedianUserId - The user_id of the comedian
 * @returns Array of headshot metadata
 */
export async function getComedianHeadshots(comedianUserId: string): Promise<HeadshotMetadata[]> {
  const { data, error } = await supabase
    .rpc('get_comedian_headshots', { p_user_id: comedianUserId });

  if (error) {
    console.error('Error fetching comedian headshots:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get the primary headshot for a comedian
 * @param comedianUserId - The user_id of the comedian
 * @returns Primary headshot metadata or null
 */
export async function getPrimaryHeadshot(comedianUserId: string): Promise<HeadshotMetadata | null> {
  const { data, error } = await supabase
    .rpc('get_primary_headshot', { p_user_id: comedianUserId });

  if (error) {
    console.error('Error fetching primary headshot:', error);
    throw error;
  }

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Bulk fetch headshots for multiple comedians (for event lineups)
 * @param comedianUserIds - Array of comedian user_ids
 * @returns Array of comedian headshot collections with metadata
 */
export async function getHeadshotsForEventLineup(
  comedianUserIds: string[]
): Promise<ComedianHeadshots[]> {
  const { data, error } = await supabase
    .rpc('get_headshots_for_comedians', { p_user_ids: comedianUserIds });

  if (error) {
    console.error('Error fetching headshots for event lineup:', error);
    throw error;
  }

  // Group results by comedian
  const groupedByComedian: Record<string, ComedianHeadshots> = {};

  (data || []).forEach((row: any) => {
    const comedianId = row.user_id;

    if (!groupedByComedian[comedianId]) {
      groupedByComedian[comedianId] = {
        comedian_id: comedianId,
        comedian_name: row.comedian_name,
        profile_url: `/comedian/${row.comedian_name.toLowerCase().replace(/\s+/g, '-')}`,
        headshots: [],
      };
    }

    groupedByComedian[comedianId].headshots.push({
      id: row.id,
      file_name: row.file_name,
      public_url: row.public_url,
      is_primary: row.is_primary,
      image_width: row.image_width,
      image_height: row.image_height,
      aspect_ratio: row.aspect_ratio,
      file_size: row.file_size,
      folder_name: row.folder_name,
      tags: row.tags || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  });

  return Object.values(groupedByComedian);
}

/**
 * Get all headshots for comedians in a specific event
 * @param eventId - The event ID
 * @returns Array of comedian headshot collections
 */
export async function getHeadshotsForEvent(eventId: string): Promise<ComedianHeadshots[]> {
  // First, get all comedians assigned to this event
  const { data: eventLineup, error: lineupError } = await supabase
    .from('event_lineup')
    .select('comedian_id, comedians(user_id, name, stage_name)')
    .eq('event_id', eventId);

  if (lineupError) {
    console.error('Error fetching event lineup:', lineupError);
    throw lineupError;
  }

  if (!eventLineup || eventLineup.length === 0) {
    return [];
  }

  // Extract comedian user IDs
  const comedianUserIds = eventLineup
    .map((item: any) => item.comedians?.user_id)
    .filter(Boolean);

  // Fetch headshots for all comedians
  return getHeadshotsForEventLineup(comedianUserIds);
}

/**
 * Helper function to get best headshot for a comedian
 * Prioritizes: Primary > Highest resolution > Most recent
 * @param comedianUserId - The user_id of the comedian
 * @returns Best available headshot metadata or null
 */
export async function getBestHeadshot(comedianUserId: string): Promise<HeadshotMetadata | null> {
  const headshots = await getComedianHeadshots(comedianUserId);

  if (headshots.length === 0) return null;

  // Check for primary headshot first
  const primary = headshots.find(h => h.is_primary);
  if (primary) return primary;

  // Sort by resolution (width * height), then by recency
  const sorted = [...headshots].sort((a, b) => {
    const resA = (a.image_width || 0) * (a.image_height || 0);
    const resB = (b.image_width || 0) * (b.image_height || 0);

    if (resA !== resB) return resB - resA; // Higher resolution first

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // More recent first
  });

  return sorted[0];
}

/**
 * Filter headshots by aspect ratio (for specific layout needs)
 * @param headshots - Array of headshot metadata
 * @param minRatio - Minimum aspect ratio (width/height)
 * @param maxRatio - Maximum aspect ratio (width/height)
 * @returns Filtered headshots within aspect ratio range
 */
export function filterByAspectRatio(
  headshots: HeadshotMetadata[],
  minRatio: number,
  maxRatio: number
): HeadshotMetadata[] {
  return headshots.filter(h => {
    if (!h.aspect_ratio) return false;
    return h.aspect_ratio >= minRatio && h.aspect_ratio <= maxRatio;
  });
}

/**
 * Get portrait-oriented headshots (aspect ratio < 1)
 * Useful for vertical layouts in promo materials
 */
export function getPortraitHeadshots(headshots: HeadshotMetadata[]): HeadshotMetadata[] {
  return headshots.filter(h => h.aspect_ratio && h.aspect_ratio < 1);
}

/**
 * Get landscape-oriented headshots (aspect ratio > 1)
 * Useful for horizontal layouts
 */
export function getLandscapeHeadshots(headshots: HeadshotMetadata[]): HeadshotMetadata[] {
  return headshots.filter(h => h.aspect_ratio && h.aspect_ratio > 1);
}

/**
 * Get square headshots (aspect ratio ≈ 1)
 * Useful for grid layouts and social media
 */
export function getSquareHeadshots(headshots: HeadshotMetadata[], tolerance = 0.1): HeadshotMetadata[] {
  return headshots.filter(h => {
    if (!h.aspect_ratio) return false;
    return Math.abs(h.aspect_ratio - 1) <= tolerance;
  });
}
