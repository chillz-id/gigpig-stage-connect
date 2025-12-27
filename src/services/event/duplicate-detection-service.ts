import { supabase } from '@/integrations/supabase/client';

/**
 * Duplicate Detection Service
 *
 * Detects potential duplicate events when a user creates a platform event
 * that might match an already-synced event from Humanitix or Eventbrite.
 *
 * Uses fuzzy matching on title and exact date matching to find candidates.
 */

export interface DuplicateCandidate {
  id: string;
  title: string;
  event_date: string;
  venue: string | null;
  source: 'humanitix' | 'eventbrite' | string;
  source_id: string | null;
  canonical_session_source_id: string | null;
  ticket_count: number | null;
  gross_dollars: number | null;
  synced_at: string | null;
  similarity_score: number;
  match_reason: string;
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  candidates: DuplicateCandidate[];
  exactMatch: DuplicateCandidate | null;
}

/**
 * Normalize a string for comparison (lowercase, remove extra spaces, common words)
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim();
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTitle(str1);
  const s2 = normalizeTitle(str2);

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longerLen = Math.max(s1.length, s2.length);
    const shorterLen = Math.min(s1.length, s2.length);
    return shorterLen / longerLen;
  }

  // Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
}

/**
 * Extract date string (YYYY-MM-DD) from various date formats
 */
function extractDateString(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toISOString().split('T')[0];
}

/**
 * Check for duplicate events matching the given title and date
 */
export async function checkForDuplicates(
  title: string,
  eventDate: string | Date,
  options: {
    similarityThreshold?: number;
    maxResults?: number;
    excludeEventId?: string;
  } = {}
): Promise<DuplicateCheckResult> {
  const {
    similarityThreshold = 0.7,
    maxResults = 5,
    excludeEventId,
  } = options;

  const targetDate = extractDateString(eventDate);
  const normalizedTitle = normalizeTitle(title);

  try {
    // Query synced events on the same date
    let query = supabase
      .from('events')
      .select(`
        id,
        title,
        event_date,
        venue,
        source,
        source_id,
        canonical_session_source_id,
        ticket_count,
        gross_dollars,
        synced_at
      `)
      .eq('is_synced', true)
      .gte('event_date', `${targetDate}T00:00:00`)
      .lt('event_date', `${targetDate}T23:59:59`);

    if (excludeEventId) {
      query = query.neq('id', excludeEventId);
    }

    const { data: syncedEvents, error } = await query;

    if (error) {
      console.error('[DuplicateDetection] Query error:', error);
      return { hasDuplicates: false, candidates: [], exactMatch: null };
    }

    if (!syncedEvents || syncedEvents.length === 0) {
      return { hasDuplicates: false, candidates: [], exactMatch: null };
    }

    // Calculate similarity scores
    const candidates: DuplicateCandidate[] = [];
    let exactMatch: DuplicateCandidate | null = null;

    for (const event of syncedEvents) {
      if (!event.title) continue;

      const similarity = calculateSimilarity(title, event.title);

      if (similarity >= similarityThreshold) {
        const matchReason = similarity === 1.0
          ? 'Exact title match'
          : similarity >= 0.9
            ? 'Very similar title'
            : 'Similar title';

        const candidate: DuplicateCandidate = {
          id: event.id,
          title: event.title,
          event_date: event.event_date,
          venue: event.venue,
          source: event.source ?? 'unknown',
          source_id: event.source_id,
          canonical_session_source_id: event.canonical_session_source_id,
          ticket_count: event.ticket_count,
          gross_dollars: event.gross_dollars,
          synced_at: event.synced_at,
          similarity_score: similarity,
          match_reason: matchReason,
        };

        candidates.push(candidate);

        if (similarity === 1.0) {
          exactMatch = candidate;
        }
      }
    }

    // Sort by similarity score descending
    candidates.sort((a, b) => b.similarity_score - a.similarity_score);

    // Limit results
    const limitedCandidates = candidates.slice(0, maxResults);

    return {
      hasDuplicates: limitedCandidates.length > 0,
      candidates: limitedCandidates,
      exactMatch,
    };
  } catch (error) {
    console.error('[DuplicateDetection] Unexpected error:', error);
    return { hasDuplicates: false, candidates: [], exactMatch: null };
  }
}

/**
 * Link a platform event to a synced event
 * This preserves the platform event's metadata while associating it with synced financial data
 */
export async function linkToSyncedEvent(
  platformEventId: string,
  syncedEventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the synced event's canonical ID
    const { data: syncedEvent, error: fetchError } = await supabase
      .from('events')
      .select('canonical_session_source_id, source')
      .eq('id', syncedEventId)
      .single();

    if (fetchError || !syncedEvent) {
      return { success: false, error: 'Synced event not found' };
    }

    // Update the platform event to link to the synced event
    const { error: updateError } = await supabase
      .from('events')
      .update({
        linked_session_id: syncedEvent.canonical_session_source_id,
        linked_source: syncedEvent.source,
      })
      .eq('id', platformEventId);

    if (updateError) {
      console.error('[DuplicateDetection] Link error:', updateError);
      return { success: false, error: 'Failed to link events' };
    }

    return { success: true };
  } catch (error) {
    console.error('[DuplicateDetection] Unexpected link error:', error);
    return { success: false, error: 'Unexpected error linking events' };
  }
}

/**
 * Merge platform event data into a synced event (for override purposes)
 * The synced event becomes the primary, but platform-provided metadata is preserved
 */
export async function mergeIntoSyncedEvent(
  syncedEventId: string,
  platformData: {
    description?: string;
    banner_url?: string;
    requirements?: string;
    spots?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        description: platformData.description,
        banner_url: platformData.banner_url,
        requirements: platformData.requirements,
        spots: platformData.spots,
        // Mark that this synced event has platform overrides
        has_platform_overrides: true,
      })
      .eq('id', syncedEventId);

    if (error) {
      console.error('[DuplicateDetection] Merge error:', error);
      return { success: false, error: 'Failed to merge data' };
    }

    return { success: true };
  } catch (error) {
    console.error('[DuplicateDetection] Unexpected merge error:', error);
    return { success: false, error: 'Unexpected error merging events' };
  }
}

export const duplicateDetectionService = {
  checkForDuplicates,
  linkToSyncedEvent,
  mergeIntoSyncedEvent,
  calculateSimilarity,
  normalizeTitle,
};
