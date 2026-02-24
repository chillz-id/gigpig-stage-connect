/**
 * Hook for the content review queue.
 * Manages AI-generated drafts: fetch, approve, reject, edit.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDrafts,
  getDraft,
  updateDraft,
  approveDraft,
  rejectDraft,
  deleteDraft,
  getDraftCounts,
} from '@/services/social/content-pipeline';
import type { ContentDraft } from '@/types/social';

const DRAFTS_KEY = 'social-content-drafts';
const DRAFT_COUNTS_KEY = 'social-draft-counts';

/**
 * Fetch all drafts for an organization, optionally filtered by status.
 */
export function useReviewQueue(
  organizationId: string | undefined,
  status?: ContentDraft['status'],
) {
  return useQuery({
    queryKey: [DRAFTS_KEY, organizationId, status],
    queryFn: () => getDrafts(organizationId!, status),
    enabled: !!organizationId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single draft by ID.
 */
export function useDraft(draftId: string | undefined) {
  return useQuery({
    queryKey: [DRAFTS_KEY, 'detail', draftId],
    queryFn: () => getDraft(draftId!),
    enabled: !!draftId,
  });
}

/**
 * Fetch draft counts by status (for badge numbers).
 */
export function useDraftCounts(organizationId: string | undefined) {
  return useQuery({
    queryKey: [DRAFT_COUNTS_KEY, organizationId],
    queryFn: () => getDraftCounts(organizationId!),
    enabled: !!organizationId,
    staleTime: 30 * 1000,
  });
}

/**
 * Update a draft's content (caption, media, schedule, etc.).
 */
export function useUpdateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: {
      id: string;
      updates: Partial<Pick<ContentDraft, 'caption' | 'media_urls' | 'media_file_ids' | 'hashtags' | 'scheduled_for' | 'media_type'>>;
    }) => updateDraft(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRAFTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DRAFT_COUNTS_KEY] });
    },
  });
}

/**
 * Approve a draft for scheduling.
 */
export function useApproveDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId, notes }: { id: string; userId: string; notes?: string }) =>
      approveDraft(id, userId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRAFTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DRAFT_COUNTS_KEY] });
    },
  });
}

/**
 * Reject a draft.
 */
export function useRejectDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId, notes }: { id: string; userId: string; notes?: string }) =>
      rejectDraft(id, userId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRAFTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DRAFT_COUNTS_KEY] });
    },
  });
}

/**
 * Delete a draft.
 */
export function useDeleteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRAFTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DRAFT_COUNTS_KEY] });
    },
  });
}
