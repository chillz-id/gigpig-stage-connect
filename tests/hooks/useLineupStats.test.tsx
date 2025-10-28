/**
 * Unit tests for useLineupStats hook
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLineupStats, formatDuration } from '@/hooks/useLineupStats';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('useLineupStats', () => {
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

  it('should fetch and calculate lineup statistics', async () => {
    const mockSpots = [
      {
        id: '1',
        is_filled: true,
        duration_minutes: 20,
        payment_gross: 100,
        payment_tax: 10,
        payment_net: 90,
        payment_status: 'paid',
      },
      {
        id: '2',
        is_filled: true,
        duration_minutes: 30,
        payment_gross: 150,
        payment_tax: 15,
        payment_net: 135,
        payment_status: 'unpaid',
      },
      {
        id: '3',
        is_filled: false,
        duration_minutes: 15,
        payment_gross: 0,
        payment_tax: 0,
        payment_net: 0,
        payment_status: 'unpaid',
      },
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockSpots,
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useLineupStats('event-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      totalSpots: 3,
      filledSpots: 2, // is_filled true for first 2 spots
      totalDuration: 65, // 20 + 30 + 15
      totalGross: 250, // 100 + 150 + 0
      totalTax: 25, // 10 + 15 + 0
      totalNet: 225, // 90 + 135 + 0
      totalPaid: 100, // only first spot is paid (uses payment_gross)
    });
  });

  it('should handle empty spots array', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useLineupStats('event-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      totalSpots: 0,
      filledSpots: 0,
      totalDuration: 0,
      totalGross: 0,
      totalTax: 0,
      totalNet: 0,
      totalPaid: 0,
    });
  });

  it('should handle null payment values', async () => {
    const mockSpots = [
      {
        id: '1',
        is_filled: true,
        duration_minutes: null,
        payment_gross: null,
        payment_tax: null,
        payment_net: null,
        payment_status: 'unpaid',
      },
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockSpots,
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useLineupStats('event-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      totalSpots: 1,
      filledSpots: 1,
      totalDuration: 0,
      totalGross: 0,
      totalTax: 0,
      totalNet: 0,
      totalPaid: 0,
    });
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

    const { result } = renderHook(() => useLineupStats('event-123'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe('formatDuration', () => {
  it('should format minutes only', () => {
    expect(formatDuration(0)).toBe('0 min');
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(59)).toBe('59 min');
  });

  it('should format hours only', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(180)).toBe('3h');
  });

  it('should format hours and minutes', () => {
    expect(formatDuration(65)).toBe('1h 5m');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(125)).toBe('2h 5m');
  });
});
