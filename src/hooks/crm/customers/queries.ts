import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/crm/customer-service';
import { segmentService } from '@/services/crm/segment-service';
import type {
  CustomerFilters,
  CustomerSortOptions,
  SegmentCount,
  SegmentDefinition,
} from './types';

export const useCustomers = (
  filters?: CustomerFilters,
  sort?: CustomerSortOptions,
  limit: number = 100,
  offset: number = 0
) => {
  return useQuery({
    queryKey: ['customers', filters, sort, limit, offset],
    queryFn: () => customerService.listCustomers(filters, sort, limit, offset),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCustomer = (customerId: string | undefined) => {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      return customerService.getCustomerById(customerId);
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomerSegmentCounts = () => {
  return useQuery({
    queryKey: ['customer-segment-counts'],
    queryFn: async (): Promise<SegmentCount[]> => {
      return customerService.listSegmentCounts();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSegments = () => {
  return useQuery({
    queryKey: ['segments'],
    queryFn: (): Promise<SegmentDefinition[]> => segmentService.list(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useCustomerStats = () => {
  return useQuery({
    queryKey: ['customer-stats'],
    queryFn: () => customerService.getStats(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomerSources = () => {
  return useQuery({
    queryKey: ['customer-sources'],
    queryFn: () => customerService.listSources(),
    staleTime: 10 * 60 * 1000,
  });
};
