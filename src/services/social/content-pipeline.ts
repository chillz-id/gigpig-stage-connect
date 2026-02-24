/**
 * Content Pipeline Service
 *
 * CRUD operations for the social content automation pipeline:
 * - Content queue (trigger → generate)
 * - Content drafts (review → approve → schedule)
 */

import { supabase } from '@/integrations/supabase/client';
import type { ContentQueueItem, ContentDraft } from '@/types/social';

// ─── Content Queue ──────────────────────────────────────────────────────────────

/**
 * Fetch queue items for an organization, optionally filtered by status.
 */
export async function getQueueItems(
  organizationId: string,
  status?: ContentQueueItem['status'],
) {
  let query = supabase
    .from('social_content_queue')
    .select('*')
    .eq('organization_id', organizationId)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as ContentQueueItem[];
}

/**
 * Create a new queue entry (manual trigger or from Edge Function).
 */
export async function createQueueItem(
  item: Pick<ContentQueueItem, 'organization_id' | 'trigger_type' | 'trigger_entity_id' | 'trigger_data' | 'priority'>,
) {
  const { data, error } = await supabase
    .from('social_content_queue')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as ContentQueueItem;
}

/**
 * Update queue item status (e.g., pending → generating → review → completed).
 */
export async function updateQueueStatus(
  id: string,
  status: ContentQueueItem['status'],
  errorMessage?: string,
) {
  const update: Record<string, unknown> = { status };
  if (status === 'completed' || status === 'failed') {
    update.processed_at = new Date().toISOString();
  }
  if (errorMessage) {
    update.error_message = errorMessage;
  }

  const { data, error } = await supabase
    .from('social_content_queue')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as ContentQueueItem;
}

// ─── Content Drafts ─────────────────────────────────────────────────────────────

/**
 * Fetch drafts for an organization, optionally filtered by status.
 */
export async function getDrafts(
  organizationId: string,
  status?: ContentDraft['status'],
) {
  let query = supabase
    .from('social_content_drafts')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as ContentDraft[];
}

/**
 * Get a single draft by ID.
 */
export async function getDraft(id: string) {
  const { data, error } = await supabase
    .from('social_content_drafts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as ContentDraft;
}

/**
 * Create a new content draft (typically from AI generation).
 */
export async function createDraft(
  draft: Omit<ContentDraft, 'id' | 'created_at' | 'updated_at'>,
) {
  const { data, error } = await supabase
    .from('social_content_drafts')
    .insert(draft)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as ContentDraft;
}

/**
 * Create multiple drafts at once (one per platform).
 */
export async function createDrafts(
  drafts: Omit<ContentDraft, 'id' | 'created_at' | 'updated_at'>[],
) {
  const { data, error } = await supabase
    .from('social_content_drafts')
    .insert(drafts)
    .select();

  if (error) throw error;
  return data as unknown as ContentDraft[];
}

/**
 * Update a draft's content (editing before approval).
 */
export async function updateDraft(
  id: string,
  updates: Partial<Pick<ContentDraft, 'caption' | 'media_urls' | 'media_file_ids' | 'hashtags' | 'scheduled_for' | 'media_type'>>,
) {
  const { data, error } = await supabase
    .from('social_content_drafts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as ContentDraft;
}

/**
 * Approve a draft for scheduling.
 */
export async function approveDraft(id: string, userId: string, notes?: string) {
  const { data, error } = await supabase
    .from('social_content_drafts')
    .update({
      status: 'approved',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes ?? null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as ContentDraft;
}

/**
 * Reject a draft.
 */
export async function rejectDraft(id: string, userId: string, notes?: string) {
  const { data, error } = await supabase
    .from('social_content_drafts')
    .update({
      status: 'rejected',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes ?? null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as ContentDraft;
}

/**
 * Mark a draft as scheduled (after Metricool post is created).
 */
export async function markDraftScheduled(id: string, metricoolPostId: number) {
  const { data, error } = await supabase
    .from('social_content_drafts')
    .update({
      status: 'scheduled',
      metricool_post_id: metricoolPostId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as ContentDraft;
}

/**
 * Delete a draft.
 */
export async function deleteDraft(id: string) {
  const { error } = await supabase
    .from('social_content_drafts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get draft counts by status for an organization (for badge counts).
 */
export async function getDraftCounts(organizationId: string) {
  const { data, error } = await supabase
    .from('social_content_drafts')
    .select('status')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const counts: Record<string, number> = {
    draft: 0,
    approved: 0,
    rejected: 0,
    scheduled: 0,
    published: 0,
    failed: 0,
  };

  for (const row of data) {
    const s = (row as unknown as { status: string }).status;
    counts[s] = (counts[s] ?? 0) + 1;
  }

  return counts;
}
