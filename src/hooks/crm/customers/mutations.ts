import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/crm/customer-service';
import { segmentService } from '@/services/crm/segment-service';
import type { CustomerFilters, CustomerProfileUpdates } from './types';

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CustomerProfileUpdates }) =>
      customerService.updateProfile(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', data.id] });
    },
  });
};

export const useCreateSegment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: segmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      queryClient.invalidateQueries({ queryKey: ['segments-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['customer-segment-counts'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useUpdateSegment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: segmentService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      queryClient.invalidateQueries({ queryKey: ['segments-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['customer-segment-counts'] });
    },
  });
};

export const useDeleteSegment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: segmentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      queryClient.invalidateQueries({ queryKey: ['segments-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['customer-segment-counts'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useRefreshCustomerStats = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => customerService.refreshStats(),
    onSuccess: (data) => {
      queryClient.setQueryData(['customer-stats'], data);
    },
  });
};

export const useExportCustomers = () => {
  return useMutation({
    mutationFn: async (filters?: CustomerFilters) => {
      const customers = await customerService.fetchAllForExport(filters);

      if (customers.length === 0) {
        throw new Error('No customers to export');
      }

      const csvContent = customerService.buildExportCsv(customers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      return customers.length;
    },
  });
};
