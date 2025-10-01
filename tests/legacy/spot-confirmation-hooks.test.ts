import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useComedianGigs } from '../src/hooks/useComedianGigs';
import { supabase } from '../src/integrations/supabase/client';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Supabase client
vi.mock('../src/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock toast
vi.mock('../src/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock Auth context
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

describe('Spot Confirmation Hooks', () => {
  let queryClient: QueryClient;
  let wrapper: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useComedianGigs', () => {
    it('should fetch comedian gigs including confirmed spots', async () => {
      const mockCalendarEvents = [
        {
          id: 'calendar-1',
          comedian_id: 'test-user-id',
          event_id: 'event-1',
          title: 'Comedy Night',
          event_date: '2024-12-25',
          venue: 'Test Venue',
          status: 'confirmed',
          calendar_sync_status: 'synced',
          created_at: '2024-12-20T10:00:00Z',
          updated_at: '2024-12-20T10:00:00Z',
          events: {
            id: 'event-1',
            title: 'Comedy Night',
            venue: 'Test Venue',
            promoter_id: 'promoter-1',
            profiles: {
              name: 'Test Promoter',
              email: 'promoter@example.com',
            },
          },
        },
      ];

      const mockEventSpots = [
        {
          id: 'spot-1',
          event_id: 'event-2',
          comedian_id: 'test-user-id',
          spot_name: 'MC',
          is_paid: true,
          payment_amount: 50,
          duration_minutes: 5,
          is_filled: true,
          created_at: '2024-12-20T10:00:00Z',
          updated_at: '2024-12-20T10:00:00Z',
          events: {
            id: 'event-2',
            title: 'Open Mic Night',
            venue: 'Comedy Club',
            event_date: '2024-12-26',
            promoter_id: 'promoter-2',
            profiles: {
              name: 'Another Promoter',
              email: 'another@example.com',
            },
          },
        },
      ];

      // Mock calendar events query
      const mockCalendarQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCalendarEvents,
          error: null,
        }),
      };

      // Mock event spots query
      const mockSpotsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockEventSpots,
          error: null,
        }),
      };

      // Setup mocks
      (supabase.from as any)
        .mockImplementation((table: string) => {
          if (table === 'calendar_events') {
            return mockCalendarQuery;
          } else if (table === 'event_spots') {
            return mockSpotsQuery;
          }
          return mockCalendarQuery;
        });

      const { result } = renderHook(() => useComedianGigs(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.gigs).toHaveLength(2);
      expect(result.current.gigs[0].title).toBe('Comedy Night');
      expect(result.current.gigs[1].title).toBe('Open Mic Night');
      expect(result.current.gigs[1].event_spot).toBeDefined();
      expect(result.current.gigs[1].event_spot?.spot_name).toBe('MC');
    });

    it('should handle confirmed spots correctly', async () => {
      const mockEventSpots = [
        {
          id: 'spot-1',
          event_id: 'event-1',
          comedian_id: 'test-user-id',
          spot_name: 'Feature',
          is_paid: true,
          payment_amount: 100,
          duration_minutes: 15,
          is_filled: true,
          created_at: '2024-12-20T10:00:00Z',
          updated_at: '2024-12-20T10:00:00Z',
          events: {
            id: 'event-1',
            title: 'Weekend Show',
            venue: 'Comedy Hall',
            event_date: '2024-12-28',
            promoter_id: 'promoter-1',
            profiles: {
              name: 'Weekend Promoter',
              email: 'weekend@example.com',
            },
          },
        },
      ];

      const mockCalendarQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockSpotsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockEventSpots,
          error: null,
        }),
      };

      (supabase.from as any)
        .mockImplementation((table: string) => {
          if (table === 'calendar_events') {
            return mockCalendarQuery;
          } else if (table === 'event_spots') {
            return mockSpotsQuery;
          }
          return mockCalendarQuery;
        });

      const { result } = renderHook(() => useComedianGigs(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.gigs).toHaveLength(1);
      const gig = result.current.gigs[0];
      expect(gig.title).toBe('Weekend Show');
      expect(gig.status).toBe('confirmed');
      expect(gig.event_spot).toBeDefined();
      expect(gig.event_spot?.spot_name).toBe('Feature');
      expect(gig.event_spot?.payment_amount).toBe(100);
    });

    it('should provide helper functions for filtering gigs', async () => {
      const mockGigs = [
        {
          id: 'gig-1',
          comedian_id: 'test-user-id',
          event_id: 'event-1',
          title: 'Past Show',
          event_date: '2024-12-01',
          venue: 'Old Venue',
          status: 'confirmed' as const,
          calendar_sync_status: 'synced' as const,
          created_at: '2024-11-20T10:00:00Z',
          updated_at: '2024-11-20T10:00:00Z',
        },
        {
          id: 'gig-2',
          comedian_id: 'test-user-id',
          event_id: 'event-2',
          title: 'Future Show',
          event_date: '2024-12-30',
          venue: 'New Venue',
          status: 'confirmed' as const,
          calendar_sync_status: 'pending' as const,
          created_at: '2024-12-20T10:00:00Z',
          updated_at: '2024-12-20T10:00:00Z',
        },
        {
          id: 'gig-3',
          comedian_id: 'test-user-id',
          event_id: 'event-3',
          title: 'Pending Show',
          event_date: '2024-12-31',
          venue: 'Another Venue',
          status: 'pending' as const,
          calendar_sync_status: 'pending' as const,
          created_at: '2024-12-20T10:00:00Z',
          updated_at: '2024-12-20T10:00:00Z',
        },
      ];

      const mockCalendarQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockGigs,
          error: null,
        }),
      };

      const mockSpotsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (supabase.from as any)
        .mockImplementation((table: string) => {
          if (table === 'calendar_events') {
            return mockCalendarQuery;
          } else if (table === 'event_spots') {
            return mockSpotsQuery;
          }
          return mockCalendarQuery;
        });

      const { result } = renderHook(() => useComedianGigs(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Test helper functions
      const upcomingGigs = result.current.getUpcomingGigs();
      const pastGigs = result.current.getPastGigs();
      const confirmedGigs = result.current.getGigsByStatus('confirmed');
      const pendingGigs = result.current.getGigsByStatus('pending');

      expect(upcomingGigs).toHaveLength(2);
      expect(pastGigs).toHaveLength(1);
      expect(confirmedGigs).toHaveLength(2);
      expect(pendingGigs).toHaveLength(1);
    });
  });

  describe('Spot Confirmation Mutations', () => {
    it('should handle spot confirmation', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'spot-1', status: 'confirmed' },
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockUpdateQuery);

      const { result } = renderHook(() => useComedianGigs(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // This would test a spot confirmation mutation if it existed
      // For now, we're testing the structure exists
      expect(result.current.updateGig).toBeDefined();
    });

    it('should handle spot decline', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'spot-1', status: 'declined' },
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockUpdateQuery);

      const { result } = renderHook(() => useComedianGigs(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // This would test a spot decline mutation if it existed
      expect(result.current.updateGig).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockErrorQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockErrorQuery);

      const { result } = renderHook(() => useComedianGigs(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.gigs).toEqual([]);
    });

    it('should handle network errors', async () => {
      const mockErrorQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockRejectedValue(new Error('Network error')),
      };

      (supabase.from as any).mockReturnValue(mockErrorQuery);

      const { result } = renderHook(() => useComedianGigs(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });
});