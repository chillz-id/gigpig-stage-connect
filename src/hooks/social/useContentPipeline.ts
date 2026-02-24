/**
 * Hook for managing the content generation pipeline.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getQueueItems,
  createQueueItem,
  updateQueueStatus,
} from '@/services/social/content-pipeline';
import type { ContentQueueItem } from '@/types/social';

const QUEUE_KEY = 'social-content-queue';

/**
 * Fetch content queue items for an organization.
 */
export function useContentQueue(
  organizationId: string | undefined,
  status?: ContentQueueItem['status'],
) {
  return useQuery({
    queryKey: [QUEUE_KEY, organizationId, status],
    queryFn: () => getQueueItems(organizationId!, status),
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Create a new content queue entry (manual trigger).
 */
export function useCreateQueueItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Pick<ContentQueueItem, 'organization_id' | 'trigger_type' | 'trigger_entity_id' | 'trigger_data' | 'priority'>) =>
      createQueueItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUEUE_KEY] });
    },
  });
}

/**
 * Update a queue item's status.
 */
export function useUpdateQueueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, errorMessage }: { id: string; status: ContentQueueItem['status']; errorMessage?: string }) =>
      updateQueueStatus(id, status, errorMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUEUE_KEY] });
    },
  });
}
