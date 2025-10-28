// Mock Supabase client FIRST before any imports
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() },
    storage: { from: jest.fn() },
  },
}));

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useManagerForComedian,
  useManagerCommission,
  useDefaultCommission,
  useUpdateCommission,
  useUpdateDefaultCommission,
} from '@/hooks/useManagerCommission';
import { managerCommissionService } from '@/services/comedian/manager-commission-service';
import { toast } from 'sonner';

// Mock the service
jest.mock('@/services/comedian/manager-commission-service');

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockService = managerCommissionService as jest.Mocked<typeof managerCommissionService>;

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useManagerCommission hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useManagerForComedian', () => {
    it('should fetch manager relationship successfully', async () => {
      const mockRelationship = {
        id: 'rel-123',
        comedian_id: 'comedian-456',
        manager_id: 'manager-789',
        commission_percentage: 20,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
      };

      mockService.getManagerForComedian.mockResolvedValue(mockRelationship);

      const { result } = renderHook(() => useManagerForComedian('comedian-456'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRelationship);
      expect(mockService.getManagerForComedian).toHaveBeenCalledWith('comedian-456');
    });

    it('should handle null response when no manager found', async () => {
      mockService.getManagerForComedian.mockResolvedValue(null);

      const { result } = renderHook(() => useManagerForComedian('comedian-456'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle errors', async () => {
      mockService.getManagerForComedian.mockRejectedValue(new Error('Service error'));

      const { result } = renderHook(() => useManagerForComedian('comedian-456'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Service error'));
    });
  });

  describe('useManagerCommission', () => {
    it('should fetch commission rate successfully', async () => {
      mockService.getManagerCommissionRate.mockResolvedValue(25);

      const { result } = renderHook(
        () => useManagerCommission('manager-123', 'comedian-456'),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(25);
      expect(mockService.getManagerCommissionRate).toHaveBeenCalledWith(
        'manager-123',
        'comedian-456'
      );
    });

    it('should handle errors from service', async () => {
      mockService.getManagerCommissionRate.mockRejectedValue(
        new Error('No active manager relationship found')
      );

      const { result } = renderHook(
        () => useManagerCommission('manager-123', 'comedian-456'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('No active manager relationship found'));
    });
  });

  describe('useDefaultCommission', () => {
    it('should fetch default commission rate successfully', async () => {
      mockService.getDefaultCommission.mockResolvedValue(18);

      const { result } = renderHook(() => useDefaultCommission('manager-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(18);
      expect(mockService.getDefaultCommission).toHaveBeenCalledWith('manager-123');
    });

    it('should return 15% as default', async () => {
      mockService.getDefaultCommission.mockResolvedValue(15);

      const { result } = renderHook(() => useDefaultCommission('manager-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(15);
    });
  });

  describe('useUpdateCommission', () => {
    it('should update commission rate and show success toast', async () => {
      mockService.updateCommissionRate.mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdateCommission(), {
        wrapper: createWrapper(),
      });

      const update = {
        relationshipId: 'rel-123',
        update: {
          commission_percentage: 22,
          commission_notes: 'Negotiated rate',
        },
      };

      result.current.mutate(update);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockService.updateCommissionRate).toHaveBeenCalledWith('rel-123', {
        commission_percentage: 22,
        commission_notes: 'Negotiated rate',
      });
      expect(toast.success).toHaveBeenCalledWith('Commission rate updated');
    });

    it('should show error toast on failure', async () => {
      mockService.updateCommissionRate.mockRejectedValue(
        new Error('Commission rate must be between 0% and 30%')
      );

      const { result } = renderHook(() => useUpdateCommission(), {
        wrapper: createWrapper(),
      });

      const update = {
        relationshipId: 'rel-123',
        update: {
          commission_percentage: 35,
        },
      };

      result.current.mutate(update);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to update commission: Commission rate must be between 0% and 30%'
      );
    });

    it('should invalidate queries on success', async () => {
      mockService.updateCommissionRate.mockResolvedValue(undefined);

      const queryClient = new QueryClient();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateCommission(), { wrapper });

      result.current.mutate({
        relationshipId: 'rel-123',
        update: { commission_percentage: 20 },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['manager-commission'] });
    });
  });

  describe('useUpdateDefaultCommission', () => {
    it('should update default commission rate and show success toast', async () => {
      mockService.updateDefaultCommission.mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdateDefaultCommission(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        managerId: 'manager-123',
        rate: 20,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockService.updateDefaultCommission).toHaveBeenCalledWith('manager-123', 20);
      expect(toast.success).toHaveBeenCalledWith('Default commission rate updated');
    });

    it('should show error toast on validation failure', async () => {
      mockService.updateDefaultCommission.mockRejectedValue(
        new Error('Commission rate must be between 0% and 30%')
      );

      const { result } = renderHook(() => useUpdateDefaultCommission(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        managerId: 'manager-123',
        rate: 40,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to update default commission: Commission rate must be between 0% and 30%'
      );
    });

    it('should invalidate queries on success', async () => {
      mockService.updateDefaultCommission.mockResolvedValue(undefined);

      const queryClient = new QueryClient();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateDefaultCommission(), { wrapper });

      result.current.mutate({
        managerId: 'manager-123',
        rate: 20,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['manager-default-commission'],
      });
    });
  });
});
