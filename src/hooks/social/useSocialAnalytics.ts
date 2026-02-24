/**
 * Hook for social media analytics and optimization insights.
 */

import { useQuery } from '@tanstack/react-query';
import { getOptimizationInsights } from '@/services/social/optimization-engine';

/**
 * Fetch optimization insights for an organization.
 */
export function useSocialInsights(
  organizationId: string | undefined,
  daysBack = 90,
) {
  return useQuery({
    queryKey: ['social-insights', organizationId, daysBack],
    queryFn: () => getOptimizationInsights(organizationId!, daysBack),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
