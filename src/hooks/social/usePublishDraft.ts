/**
 * Hook for publishing approved drafts to Metricool.
 * Shows toast feedback when a draft is rescheduled due to conflicts.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['social-content-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['social-draft-counts'] });
      queryClient.invalidateQueries({ queryKey: ['metricool-posts'] });

      if (result.rescheduled && result.originalTime && result.newTime) {
        const fmt = (d: Date) => d.toLocaleTimeString('en-AU', {
          hour: '2-digit', minute: '2-digit', hour12: true,
        });
        toast.info(`Rescheduled: ${fmt(result.originalTime)} → ${fmt(result.newTime)}`, {
          description: result.reason,
        });
      }
    },
  });
}
