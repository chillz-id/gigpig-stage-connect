/**
 * Hook for fetching optimal posting times from Metricool.
 */

import { useQuery } from '@tanstack/react-query';
import { getBestTimes } from '@/services/social/metricool-posts';
import type { BestTimesProvider } from '@/types/social';

/**
 * Get best times to post for a specific platform.
 */
export function useBestTimes(
  provider: BestTimesProvider,
  blogId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['metricool-best-times', provider, blogId],
    queryFn: () => getBestTimes(provider, undefined, undefined, 'Australia/Sydney', blogId),
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — best times don't change often
  });
}
