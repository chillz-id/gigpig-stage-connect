/**
 * Unit tests for useDealStats hook
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDealStats } from '@/hooks/useDealStats';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('useDealStats', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Owner permissions', () => {
    it('should show all deals and revenue for event owner', async () => {
      const mockDeals = [
        {
          id: '1',
          status: 'draft',
          total_amount: 1000,
          deal_participants: [
            { user_id: 'user-1', status: 'pending' },
            { user_id: 'user-2', status: 'pending' },
          ],
        },
        {
          id: '2',
          status: 'pending_approval',
          total_amount: 2000,
          deal_participants: [
            { user_id: 'user-1', status: 'confirmed' },
            { user_id: 'user-2', status: 'pending' },
          ],
        },
        {
          id: '3',
          status: 'fully_approved',
          total_amount: 3000,
          deal_participants: [
            { user_id: 'user-1', status: 'confirmed' },
            { user_id: 'user-2', status: 'confirmed' },
          ],
        },
        {
          id: '4',
          status: 'settled',
          total_amount: 4000,
          deal_participants: [
            { user_id: 'user-1', status: 'confirmed' },
            { user_id: 'user-2', status: 'confirmed' },
          ],
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockDeals,
            error: null,
          }),
        }),
      });

      const { result } = renderHook(
        () => useDealStats('event-123', 'owner-id', true),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual({
        totalDeals: 4,
        draftDeals: 1,
        pendingDeals: 1,
        approvedDeals: 1,
        settledDeals: 1,
        totalRevenue: 10000, // All deals visible to owner
        settledRevenue: 4000,
        pendingRevenue: 6000, // draft + pending_approval + fully_approved
      });
    });
  });

  describe('Participant permissions', () => {
    it('should only show fully confirmed deals that user is part of', async () => {
      const mockDeals = [
        {
          id: '1',
          status: 'draft',
          total_amount: 1000,
          deal_participants: [
            { user_id: 'user-1', status: 'pending' },
            { user_id: 'user-2', status: 'pending' },
          ],
        },
        {
          id: '2',
          status: 'pending_approval',
          total_amount: 2000,
          deal_participants: [
            { user_id: 'user-1', status: 'confirmed' },
            { user_id: 'user-2', status: 'pending' }, // Not fully confirmed
          ],
        },
        {
          id: '3',
          status: 'fully_approved',
          total_amount: 3000,
          deal_participants: [
            { user_id: 'user-1', status: 'confirmed' },
            { user_id: 'user-2', status: 'confirmed' }, // Fully confirmed
          ],
        },
        {
          id: '4',
          status: 'fully_approved',
          total_amount: 4000,
          deal_participants: [
            { user_id: 'user-3', status: 'confirmed' }, // User not in this deal
            { user_id: 'user-4', status: 'confirmed' },
          ],
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockDeals,
            error: null,
          }),
        }),
      });

      const { result } = renderHook(
        () => useDealStats('event-123', 'user-1', false),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Only deal #3 should be visible (user-1 is participant and all confirmed)
      expect(result.current.data).toEqual({
        totalDeals: 1,
        draftDeals: 0,
        pendingDeals: 0,
        approvedDeals: 1,
        settledDeals: 0,
        totalRevenue: 3000, // Only deal #3
        settledRevenue: 0,
        pendingRevenue: 3000,
      });
    });

    it('should show empty stats if user has no visible deals', async () => {
      const mockDeals = [
        {
          id: '1',
          status: 'fully_approved',
          total_amount: 1000,
          deal_participants: [
            { user_id: 'user-2', status: 'confirmed' },
            { user_id: 'user-3', status: 'confirmed' },
          ],
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockDeals,
            error: null,
          }),
        }),
      });

      const { result } = renderHook(
        () => useDealStats('event-123', 'user-1', false),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual({
        totalDeals: 0,
        draftDeals: 0,
        pendingDeals: 0,
        approvedDeals: 0,
        settledDeals: 0,
        totalRevenue: 0,
        settledRevenue: 0,
        pendingRevenue: 0,
      });
    });
  });

  it('should handle null total_amount values', async () => {
    const mockDeals = [
      {
        id: '1',
        status: 'draft',
        total_amount: null,
        deal_participants: [{ user_id: 'user-1', status: 'pending' }],
      },
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockDeals,
          error: null,
        }),
      }),
    });

    const { result } = renderHook(
      () => useDealStats('event-123', 'owner-id', true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.totalRevenue).toBe(0);
  });

  it('should handle query errors', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }),
    });

    const { result } = renderHook(
      () => useDealStats('event-123', 'user-1', false),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
