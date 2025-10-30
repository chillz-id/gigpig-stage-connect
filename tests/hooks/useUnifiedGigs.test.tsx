import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUnifiedGigs } from '@/hooks/useUnifiedGigs';
import { useAuth } from '@/contexts/AuthContext';
import { manualGigsService } from '@/services/gigs/manual-gigs-service';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/services/gigs/manual-gigs-service');
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockManualGigsService = manualGigsService as jest.Mocked<typeof manualGigsService>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useUnifiedGigs', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('returns undefined when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
    } as any);

    const { result } = renderHook(() => useUnifiedGigs(), { wrapper });

    // Query is disabled when user is null
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('combines manual gigs and platform gigs', async () => {
    const mockUser = { id: 'user-123' };
    mockUseAuth.mockReturnValue({
      user: mockUser,
    } as any);

    // Mock manual gigs
    const manualGigs = [
      {
        id: 'manual-1',
        user_id: 'user-123',
        title: 'Manual Gig 1',
        venue_name: 'Comedy Club',
        venue_address: '123 Main St',
        start_datetime: '2025-11-01T19:00:00Z',
        end_datetime: '2025-11-01T20:00:00Z',
        notes: 'Bring backup material',
        created_at: '2025-10-01T10:00:00Z',
        updated_at: '2025-10-01T10:00:00Z',
      },
    ];

    mockManualGigsService.getUserManualGigs = jest.fn().mockResolvedValue(manualGigs);

    // Mock platform gigs (accepted applications)
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'app-1',
                event_id: 'event-1',
                status: 'accepted',
                events: {
                  id: 'event-1',
                  title: 'Platform Gig 1',
                  venue: 'Open Mic Night',
                  event_date: '2025-11-05T20:00:00Z',
                },
              },
            ],
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.from = mockFrom;

    const { result } = renderHook(() => useUnifiedGigs(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);

    // Verify manual gig structure
    const manualGig = result.current.data?.find(g => g.source === 'manual');
    expect(manualGig).toMatchObject({
      id: 'manual-1',
      title: 'Manual Gig 1',
      venue_name: 'Comedy Club',
      venue_address: '123 Main St',
      start_datetime: '2025-11-01T19:00:00Z',
      end_datetime: '2025-11-01T20:00:00Z',
      source: 'manual',
      notes: 'Bring backup material',
    });

    // Verify platform gig structure
    const platformGig = result.current.data?.find(g => g.source === 'platform');
    expect(platformGig).toMatchObject({
      id: 'app-1',
      title: 'Platform Gig 1',
      venue_name: 'Open Mic Night',
      start_datetime: '2025-11-05T20:00:00Z',
      source: 'platform',
    });
  });

  it('sorts gigs by start datetime ascending', async () => {
    const mockUser = { id: 'user-123' };
    mockUseAuth.mockReturnValue({
      user: mockUser,
    } as any);

    // Mock manual gigs with later date
    const manualGigs = [
      {
        id: 'manual-1',
        user_id: 'user-123',
        title: 'Later Gig',
        venue_name: null,
        venue_address: null,
        start_datetime: '2025-11-10T19:00:00Z',
        end_datetime: null,
        notes: null,
        created_at: '2025-10-01T10:00:00Z',
        updated_at: '2025-10-01T10:00:00Z',
      },
    ];

    mockManualGigsService.getUserManualGigs = jest.fn().mockResolvedValue(manualGigs);

    // Mock platform gigs with earlier date
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'app-1',
                event_id: 'event-1',
                status: 'accepted',
                events: {
                  id: 'event-1',
                  title: 'Earlier Gig',
                  venue: 'Comedy Club',
                  event_date: '2025-11-05T20:00:00Z',
                },
              },
            ],
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.from = mockFrom;

    const { result } = renderHook(() => useUnifiedGigs(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Earlier gig should come first
    expect(result.current.data?.[0]?.title).toBe('Earlier Gig');
    expect(result.current.data?.[1]?.title).toBe('Later Gig');
  });

  it('handles empty manual gigs', async () => {
    const mockUser = { id: 'user-123' };
    mockUseAuth.mockReturnValue({
      user: mockUser,
    } as any);

    mockManualGigsService.getUserManualGigs = jest.fn().mockResolvedValue([]);

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'app-1',
                event_id: 'event-1',
                status: 'accepted',
                events: {
                  id: 'event-1',
                  title: 'Platform Gig',
                  venue: 'Comedy Club',
                  event_date: '2025-11-05T20:00:00Z',
                },
              },
            ],
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.from = mockFrom;

    const { result } = renderHook(() => useUnifiedGigs(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.source).toBe('platform');
  });

  it('handles error in platform gigs query', async () => {
    const mockUser = { id: 'user-123' };
    mockUseAuth.mockReturnValue({
      user: mockUser,
    } as any);

    mockManualGigsService.getUserManualGigs = jest.fn().mockResolvedValue([]);

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    });

    mockSupabase.from = mockFrom;

    const { result } = renderHook(() => useUnifiedGigs(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('handles null venue names gracefully', async () => {
    const mockUser = { id: 'user-123' };
    mockUseAuth.mockReturnValue({
      user: mockUser,
    } as any);

    mockManualGigsService.getUserManualGigs = jest.fn().mockResolvedValue([]);

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'app-1',
                event_id: 'event-1',
                status: 'accepted',
                events: {
                  id: 'event-1',
                  title: 'Gig without venue',
                  venue: null,
                  event_date: '2025-11-05T20:00:00Z',
                },
              },
            ],
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.from = mockFrom;

    const { result } = renderHook(() => useUnifiedGigs(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.[0]?.venue_name).toBeNull();
  });
});
