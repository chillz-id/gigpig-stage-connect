import { useQuery } from '@tanstack/react-query';
import { dealService } from '@/services/crm/deal-service';
import type { DealFilters } from '@/services/crm/deal-service';

export const useDeals = (filters?: DealFilters, limit: number = 100) => {
  return useQuery({
    queryKey: ['deals', filters, limit],
    queryFn: () => dealService.list(filters, limit),
    staleTime: 2 * 60 * 1000,
  });
};

export const useDealsByStatus = (filters?: Omit<DealFilters, 'status'>) => {
  return useQuery({
    queryKey: ['deals-by-status', filters],
    queryFn: () => dealService.listByStatus(filters),
    staleTime: 1 * 60 * 1000,
  });
};

export const useDeal = (dealId: string | undefined) => {
  return useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => (dealId ? dealService.getById(dealId) : Promise.resolve(null)),
    enabled: !!dealId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDealStats = () => {
  return useQuery({
    queryKey: ['deal-stats'],
    queryFn: () => dealService.getStats(),
    staleTime: 5 * 60 * 1000,
  });
};
