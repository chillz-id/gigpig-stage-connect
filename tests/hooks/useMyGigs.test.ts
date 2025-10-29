import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyGigs } from '@/hooks/useMyGigs';
import { manualGigsService } from '@/services/gigs/manual-gigs-service';
import React from 'react';

// Mock the manual gigs service
jest.mock('@/services/gigs/manual-gigs-service', () => ({
  manualGigsService: {
    getUserManualGigs: jest.fn(),
    createManualGig: jest.fn(),
    deleteManualGig: jest.fn(),
  },
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

describe('useMyGigs', () => {
  const createWrapper = () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    jest.mocked(manualGigsService.getUserManualGigs).mockResolvedValue([]);
    jest.mocked(manualGigsService.createManualGig).mockResolvedValue({
      id: 'new-gig',
      user_id: 'user-123',
      title: 'Test Gig',
      venue_name: null,
      venue_address: null,
      start_datetime: '2025-11-20T19:00:00Z',
      end_datetime: null,
      notes: null,
      created_at: '2025-10-29T10:00:00Z',
      updated_at: '2025-10-29T10:00:00Z'
    });
    jest.mocked(manualGigsService.deleteManualGig).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Fetching Manual Gigs', () => {
    it('should fetch manual gigs on mount', async () => {
      const mockGigs = [
        {
          id: 'gig-1',
          user_id: 'user-123',
          title: 'Comedy Night',
          venue_name: 'The Comedy Store',
          venue_address: '1 Comedy Ln',
          start_datetime: '2025-11-15T20:00:00Z',
          end_datetime: '2025-11-15T22:00:00Z',
          notes: 'Bring mic',
          created_at: '2025-10-29T10:00:00Z',
          updated_at: '2025-10-29T10:00:00Z'
        }
      ];

      jest.mocked(manualGigsService.getUserManualGigs).mockResolvedValue(mockGigs);

      const { result } = renderHook(() => useMyGigs(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.manualGigs).toEqual(mockGigs);
        expect(result.current.isLoading).toBe(false);
      });

      expect(manualGigsService.getUserManualGigs).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array when no gigs found', async () => {
      jest.mocked(manualGigsService.getUserManualGigs).mockResolvedValue([]);

      const { result } = renderHook(() => useMyGigs(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.manualGigs).toEqual([]);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading state while fetching', async () => {
      const { result } = renderHook(() => useMyGigs(), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Creating Manual Gigs', () => {
    it('should create a new manual gig', async () => {
      const newGig = {
        user_id: 'user-123',
        title: 'Open Mic Night',
        venue_name: 'The Laugh Factory',
        venue_address: null,
        start_datetime: '2025-11-20T19:00:00Z',
        end_datetime: null,
        notes: null
      };

      const { result } = renderHook(() => useMyGigs(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.createGig(newGig);
      });

      await waitFor(() => {
        expect(manualGigsService.createManualGig).toHaveBeenCalledWith(newGig);
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });

    it('should invalidate queries after successful create', async () => {
      jest.mocked(manualGigsService.getUserManualGigs)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 'new-gig',
            user_id: 'user-123',
            title: 'Test Gig',
            venue_name: null,
            venue_address: null,
            start_datetime: '2025-11-20T19:00:00Z',
            end_datetime: null,
            notes: null,
            created_at: '2025-10-29T10:00:00Z',
            updated_at: '2025-10-29T10:00:00Z'
          }
        ]);

      const { result } = renderHook(() => useMyGigs(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.manualGigs).toEqual([]);
      });

      act(() => {
        result.current.createGig({
          user_id: 'user-123',
          title: 'Test Gig',
          venue_name: null,
          venue_address: null,
          start_datetime: '2025-11-20T19:00:00Z',
          end_datetime: null,
          notes: null
        });
      });

      await waitFor(() => {
        expect(result.current.manualGigs.length).toBe(1);
      });
    });
  });

  describe('Deleting Manual Gigs', () => {
    it('should delete a manual gig', async () => {
      const { result } = renderHook(() => useMyGigs(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteGig('gig-1');
      });

      await waitFor(() => {
        expect(manualGigsService.deleteManualGig).toHaveBeenCalledWith('gig-1');
      });

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });
    });

    it('should invalidate queries after successful delete', async () => {
      const mockGig = {
        id: 'gig-1',
        user_id: 'user-123',
        title: 'Test Gig',
        venue_name: null,
        venue_address: null,
        start_datetime: '2025-11-20T19:00:00Z',
        end_datetime: null,
        notes: null,
        created_at: '2025-10-29T10:00:00Z',
        updated_at: '2025-10-29T10:00:00Z'
      };

      jest.mocked(manualGigsService.getUserManualGigs)
        .mockResolvedValueOnce([mockGig])
        .mockResolvedValueOnce([]);

      const { result } = renderHook(() => useMyGigs(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.manualGigs.length).toBe(1);
      });

      act(() => {
        result.current.deleteGig('gig-1');
      });

      await waitFor(() => {
        expect(result.current.manualGigs.length).toBe(0);
      });
    });
  });
});
