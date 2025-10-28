import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { managerCommissionService, type CommissionUpdate } from '@/services/comedian/manager-commission-service';
import { toast } from 'sonner';

/**
 * Hook to query manager for a comedian
 */
export function useManagerForComedian(comedianId: string) {
  return useQuery({
    queryKey: ['manager-commission', comedianId],
    queryFn: () => managerCommissionService.getManagerForComedian(comedianId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to query commission rate for specific relationship
 */
export function useManagerCommission(managerId: string, comedianId: string) {
  return useQuery({
    queryKey: ['manager-commission', managerId, comedianId],
    queryFn: () => managerCommissionService.getManagerCommissionRate(managerId, comedianId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to query manager's default commission rate
 */
export function useDefaultCommission(managerId: string) {
  return useQuery({
    queryKey: ['manager-default-commission', managerId],
    queryFn: () => managerCommissionService.getDefaultCommission(managerId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to update commission rate for a relationship
 */
export function useUpdateCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ relationshipId, update }: { relationshipId: string; update: CommissionUpdate }) =>
      managerCommissionService.updateCommissionRate(relationshipId, update),
    onSuccess: () => {
      toast.success('Commission rate updated');
      queryClient.invalidateQueries({ queryKey: ['manager-commission'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update commission: ${error.message}`);
    },
  });
}

/**
 * Hook to update manager's default commission rate
 */
export function useUpdateDefaultCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ managerId, rate }: { managerId: string; rate: number }) =>
      managerCommissionService.updateDefaultCommission(managerId, rate),
    onSuccess: () => {
      toast.success('Default commission rate updated');
      queryClient.invalidateQueries({ queryKey: ['manager-default-commission'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update default commission: ${error.message}`);
    },
  });
}
