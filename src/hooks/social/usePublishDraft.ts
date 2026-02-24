/**
 * Hook for publishing approved drafts to Metricool.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishDraft } from '@/services/social/publish-approved';
import type { ContentDraft } from '@/types/social';

/**
 * Publish an approved draft to Metricool.
 * Invalidates both drafts and Metricool posts queries on success.
 */
export function usePublishDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: ContentDraft) => publishDraft(draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-content-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['social-draft-counts'] });
      queryClient.invalidateQueries({ queryKey: ['metricool-posts'] });
    },
  });
}
