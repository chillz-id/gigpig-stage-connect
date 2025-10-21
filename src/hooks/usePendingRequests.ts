import { useQuery } from '@tanstack/react-query';
import { getPendingRequestCount } from '@/services/requestApprovalService';

/**
 * Hook to fetch pending request count for notifications
 */
export function usePendingRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ['pending-requests-count', userId],
    queryFn: () => {
      if (!userId) throw new Error('User ID required');
      return getPendingRequestCount(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });
}
