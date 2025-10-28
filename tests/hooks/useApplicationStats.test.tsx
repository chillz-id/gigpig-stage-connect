/**
 * Unit tests for useApplicationStats hook
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApplicationStats } from '@/hooks/useApplicationStats';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('useApplicationStats', () => {
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

  // Helper to mock both Supabase queries (applications + shortlisted count)
  const mockSupabaseQueries = (applications: any[], shortlistedCount: number) => {
    const mockSelectWithCount = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          count: shortlistedCount,
          error: null,
        }),
      }),
    });

    const mockSelectNoCount = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: applications,
        error: null,
      }),
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockImplementation((fields: string, options?: any) => {
        if (options?.count === 'exact') {
          return mockSelectWithCount();
        }
        return mockSelectNoCount();
      }),
    });
  };

  it('should fetch and calculate application statistics', async () => {
    const mockApplications = [
      {
        id: '1',
        status: 'pending',
        spot_type: 'mc',
        is_shortlisted: true,
      },
      {
        id: '2',
        status: 'confirmed',
        spot_type: 'feature',
        is_shortlisted: false,
      },
      {
        id: '3',
        status: 'confirmed',
        spot_type: 'headliner',
        is_shortlisted: true,
      },
      {
        id: '4',
        status: 'rejected',
        spot_type: 'feature',
        is_shortlisted: false,
      },
      {
        id: '5',
        status: 'pending',
        spot_type: 'guest',
        is_shortlisted: false,
      },
    ];

    mockSupabaseQueries(mockApplications, 2); // 2 shortlisted applications

    const { result } = renderHook(() => useApplicationStats('event-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      totalApplications: 5,
      pendingApplications: 2,
      confirmedApplications: 2,
      rejectedApplications: 1,
      shortlistedApplications: 2,
      mcApplications: 1,
      featureApplications: 2,
      headlinerApplications: 1,
      guestApplications: 1,
    });
  });

  it('should handle empty applications array', async () => {
    mockSupabaseQueries([], 0); // No applications, no shortlisted

    const { result } = renderHook(() => useApplicationStats('event-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      totalApplications: 0,
      pendingApplications: 0,
      confirmedApplications: 0,
      rejectedApplications: 0,
      shortlistedApplications: 0,
      mcApplications: 0,
      featureApplications: 0,
      headlinerApplications: 0,
      guestApplications: 0,
    });
  });

  it('should handle applications with null spot_type', async () => {
    const mockApplications = [
      {
        id: '1',
        status: 'pending',
        spot_type: null,
        is_shortlisted: false,
      },
      {
        id: '2',
        status: 'confirmed',
        spot_type: 'mc',
        is_shortlisted: true,
      },
    ];

    mockSupabaseQueries(mockApplications, 1); // 1 shortlisted application

    const { result } = renderHook(() => useApplicationStats('event-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      totalApplications: 2,
      pendingApplications: 1,
      confirmedApplications: 1,
      rejectedApplications: 0,
      shortlistedApplications: 1,
      mcApplications: 1,
      featureApplications: 0,
      headlinerApplications: 0,
      guestApplications: 0,
    });
  });

  it('should handle waitlisted status', async () => {
    const mockApplications = [
      {
        id: '1',
        status: 'waitlisted',
        spot_type: 'feature',
        is_shortlisted: false,
      },
    ];

    mockSupabaseQueries(mockApplications, 0); // 0 shortlisted applications

    const { result } = renderHook(() => useApplicationStats('event-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Waitlisted is not counted in pending/confirmed/rejected
    expect(result.current.data).toEqual({
      totalApplications: 1,
      pendingApplications: 0,
      confirmedApplications: 0,
      rejectedApplications: 0,
      shortlistedApplications: 0,
      mcApplications: 0,
      featureApplications: 1,
      headlinerApplications: 0,
      guestApplications: 0,
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

    const { result } = renderHook(() => useApplicationStats('event-123'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
