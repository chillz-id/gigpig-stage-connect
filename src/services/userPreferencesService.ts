import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// FAVOURITES MANAGEMENT
// ============================================================================

/**
 * Add a comedian to user's favourites
 * Creates a new entry in user_favourites table
 */
export async function addToFavourites(
  userId: string,
  comedianId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_favourites')
    .insert({
      user_id: userId,
      comedian_id: comedianId
    });

  if (error) {
    console.error('Error adding to favourites:', error);
    throw new Error(`Failed to add comedian to favourites: ${error.message}`);
  }
}

/**
 * Remove a comedian from user's favourites
 * Deletes the entry from user_favourites table
 */
export async function removeFromFavourites(
  userId: string,
  comedianId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_favourites')
    .delete()
    .eq('user_id', userId)
    .eq('comedian_id', comedianId);

  if (error) {
    console.error('Error removing from favourites:', error);
    throw new Error(`Failed to remove comedian from favourites: ${error.message}`);
  }
}

/**
 * Get all favourited comedian IDs for a user
 * Returns an array of comedian IDs
 */
export async function getFavourites(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_favourites')
    .select('comedian_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching favourites:', error);
    throw new Error(`Failed to fetch favourites: ${error.message}`);
  }

  return (data || []).map((item: { comedian_id: string }) => item.comedian_id);
}

/**
 * Check if a comedian is favourited by the user
 * Returns true if the comedian is in user's favourites
 */
export async function isFavourited(
  userId: string,
  comedianId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_favourites')
    .select('id')
    .eq('user_id', userId)
    .eq('comedian_id', comedianId)
    .maybeSingle();

  if (error) {
    console.error('Error checking if favourited:', error);
    throw new Error(`Failed to check favourite status: ${error.message}`);
  }

  return data !== null;
}

// ============================================================================
// HIDE COMEDIAN MANAGEMENT
// ============================================================================

/**
 * Hide a comedian from view
 * Scope can be 'event' (hide for specific event) or 'global' (hide everywhere)
 * For event-specific hiding, eventId must be provided
 */
export async function hideComedian(
  userId: string,
  comedianId: string,
  scope: 'event' | 'global',
  eventId?: string
): Promise<void> {
  // Validate event scope has eventId
  if (scope === 'event' && !eventId) {
    throw new Error('Event ID is required when scope is "event"');
  }

  const { error } = await supabase
    .from('user_hidden_comedians')
    .insert({
      user_id: userId,
      comedian_id: comedianId,
      scope: scope,
      event_id: scope === 'event' ? eventId : null
    });

  if (error) {
    console.error('Error hiding comedian:', error);
    throw new Error(`Failed to hide comedian: ${error.message}`);
  }
}

/**
 * Unhide a comedian
 * If eventId is provided, removes event-specific hiding
 * If eventId is not provided, removes global hiding
 */
export async function unhideComedian(
  userId: string,
  comedianId: string,
  eventId?: string
): Promise<void> {
  let query = supabase
    .from('user_hidden_comedians')
    .delete()
    .eq('user_id', userId)
    .eq('comedian_id', comedianId);

  if (eventId) {
    // Remove event-specific hiding
    query = query.eq('scope', 'event').eq('event_id', eventId);
  } else {
    // Remove global hiding
    query = query.eq('scope', 'global');
  }

  const { error } = await query;

  if (error) {
    console.error('Error unhiding comedian:', error);
    throw new Error(`Failed to unhide comedian: ${error.message}`);
  }
}

/**
 * Get all hidden comedian IDs for a user
 * If eventId is provided, returns both event-specific and global hidden comedians
 * If eventId is not provided, returns only global hidden comedians
 */
export async function getHiddenComedians(
  userId: string,
  eventId?: string
): Promise<string[]> {
  let query = supabase
    .from('user_hidden_comedians')
    .select('comedian_id')
    .eq('user_id', userId);

  if (eventId) {
    // Get both event-specific and global hidden comedians
    query = query.or(`scope.eq.global,and(scope.eq.event,event_id.eq.${eventId})`);
  } else {
    // Get only global hidden comedians
    query = query.eq('scope', 'global');
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching hidden comedians:', error);
    throw new Error(`Failed to fetch hidden comedians: ${error.message}`);
  }

  return (data || []).map((item: { comedian_id: string }) => item.comedian_id);
}

/**
 * Check if a comedian is hidden for the user
 * If eventId is provided, checks both event-specific and global hiding
 * If eventId is not provided, checks only global hiding
 */
export async function isHidden(
  userId: string,
  comedianId: string,
  eventId?: string
): Promise<boolean> {
  let query = supabase
    .from('user_hidden_comedians')
    .select('id')
    .eq('user_id', userId)
    .eq('comedian_id', comedianId);

  if (eventId) {
    // Check both event-specific and global
    query = query.or(`scope.eq.global,and(scope.eq.event,event_id.eq.${eventId})`);
  } else {
    // Check only global
    query = query.eq('scope', 'global');
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking if hidden:', error);
    throw new Error(`Failed to check hidden status: ${error.message}`);
  }

  return data !== null;
}
