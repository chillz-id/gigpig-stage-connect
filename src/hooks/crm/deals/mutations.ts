import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService } from '@/services/crm/deal-service';
import type { Deal, DealStatus } from '@/services/crm/deal-service';

export const useUpdateDealStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, status }: { dealId: string; status: DealStatus }) =>
      dealService.updateStatus(dealId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals-by-status'] });
    },
  });
};

export const useUpdateDeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Deal> }) =>
      dealService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['deal', data.id] });
    },
  });
};

export const useCreateDeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newDeal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) =>
      dealService.create(newDeal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals-by-status'] });
    },
  });
};

export const useDeleteDeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dealId: string) => dealService.delete(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals-by-status'] });
    },
  });
};
