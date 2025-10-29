import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAvailabilitySelection } from '@/hooks/useAvailabilitySelection';
import { availabilityService } from '@/services/availability/availability-service';
import React from 'react';

// Mock the availability service
jest.mock('@/services/availability/availability-service', () => ({
  availabilityService: {
    getUserAvailability: jest.fn(),
    batchUpdateAvailability: jest.fn(),
  },
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('useAvailabilitySelection', () => {
  let queryClient: QueryClient;

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
    jest.clearAllTimers();
    jest.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock implementations
    jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());
    jest.mocked(availabilityService.batchUpdateAvailability).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('Initial Load', () => {
    it('should load initial availability from service', async () => {
      const mockAvailability = new Set(['event1', 'event2']);
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(mockAvailability);

      const { result } = renderHook(() => useAvailabilitySelection('user123'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.selectedEvents.has('event1')).toBe(true);
        expect(result.current.selectedEvents.has('event2')).toBe(true);
        expect(result.current.selectedEvents.size).toBe(2);
      });

      expect(availabilityService.getUserAvailability).toHaveBeenCalledWith('user123');
    });

    it('should handle empty initial availability', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(() => useAvailabilitySelection('user123'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });
    });

    it('should handle loading errors gracefully', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockRejectedValue(
        new Error('Failed to load')
      );

      const { result } = renderHook(() => useAvailabilitySelection('user123'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });
    });
  });

  describe('Toggle Event', () => {
    it('should add event optimistically when not selected', async () => {
      jest.useRealTimers(); // Use real timers for this test
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(() => useAvailabilitySelection('user123'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Toggle event
      act(() => {
        result.current.toggleEvent('event1');
      });

      // Check state updated immediately (no waitFor needed per passing test pattern)
      expect(result.current.selectedEvents.has('event1')).toBe(true);
      expect(result.current.isSaving).toBe(false); // Not saving yet

      // Verify save hasn't been called yet (with a small delay for the debounce setup)
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(availabilityService.batchUpdateAvailability).not.toHaveBeenCalled();
    });

    it('should remove event optimistically when selected', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(
        new Set(['event1', 'event2'])
      );

      const { result } = renderHook(() => useAvailabilitySelection('user123'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.selectedEvents.has('event1')).toBe(true);
      });

      act(() => {
        result.current.toggleEvent('event1');
      });

      // Immediate optimistic update
      expect(result.current.selectedEvents.has('event1')).toBe(false);
      expect(result.current.selectedEvents.has('event2')).toBe(true);
    });

    it('should trigger debounced save after 2 seconds', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(() => useAvailabilitySelection('user123'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      act(() => {
        result.current.toggleEvent('event1');
      });

      // Should not save immediately
      expect(availabilityService.batchUpdateAvailability).not.toHaveBeenCalled();

      // Advance time by 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Wait for the mutation to complete
      await waitFor(() => {
        expect(availabilityService.batchUpdateAvailability).toHaveBeenCalledWith(
          'user123',
          new Set(),
          new Set(['event1'])
        );
      });
    });

    it('should batch multiple toggles within 2 seconds', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(() => useAvailabilitySelection('user123'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Toggle multiple events within debounce window
      act(() => {
        result.current.toggleEvent('event1');
        jest.advanceTimersByTime(500);
        result.current.toggleEvent('event2');
        jest.advanceTimersByTime(500);
        result.current.toggleEvent('event3');
      });

      // Should not be called yet (only 1000ms elapsed, need 2000ms from last toggle)
      expect(availabilityService.batchUpdateAvailability).not.toHaveBeenCalled();

      // Advance remaining time to trigger debounced save (1000ms more to reach 2000ms from last toggle)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(availabilityService.batchUpdateAvailability).toHaveBeenCalledTimes(1);
        expect(availabilityService.batchUpdateAvailability).toHaveBeenCalledWith(
          'user123',
          new Set(),
          new Set(['event1', 'event2', 'event3'])
        );
      });
    });
  });

  describe('Weekday Selection', () => {
    it('should select all events for a weekday', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(() => useAvailabilitySelection('user123'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      const mondayEvents = ['event1', 'event2', 'event3'];

      act(() => {
        result.current.selectWeekday(1, mondayEvents);
      });

      // All events should be added
      expect(result.current.selectedEvents.has('event1')).toBe(true);
      expect(result.current.selectedEvents.has('event2')).toBe(true);
      expect(result.current.selectedEvents.has('event3')).toBe(true);
    });

    it('should deselect all events for a weekday when all are selected', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(
        new Set(['event1', 'event2', 'event3'])
      );

      const { result } = renderHook(() => useAvailabilitySelection('user123'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(3);
      });

      const mondayEvents = ['event1', 'event2', 'event3'];

      act(() => {
        result.current.selectWeekday(1, mondayEvents);
      });

      // All events should be removed
      expect(result.current.selectedEvents.has('event1')).toBe(false);
      expect(result.current.selectedEvents.has('event2')).toBe(false);
      expect(result.current.selectedEvents.has('event3')).toBe(false);
    });

    it('should select partially selected weekday events', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(
        new Set(['event1'])
      );

      const { result } = renderHook(() => useAvailabilitySelection('user123'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(1);
      });

      const mondayEvents = ['event1', 'event2', 'event3'];

      act(() => {
        result.current.selectWeekday(1, mondayEvents);
      });

      // Should add missing events
      expect(result.current.selectedEvents.has('event1')).toBe(true);
      expect(result.current.selectedEvents.has('event2')).toBe(true);
      expect(result.current.selectedEvents.has('event3')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should revert optimistic changes on save error', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());
      jest.mocked(availabilityService.batchUpdateAvailability).mockRejectedValue(
        new Error('Save failed')
      );

      const { result } = renderHook(() => useAvailabilitySelection('user123'), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      act(() => {
        result.current.toggleEvent('event1');
      });

      // Optimistic update
      expect(result.current.selectedEvents.has('event1')).toBe(true);

      // Trigger save
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Wait for error handling
      await waitFor(() => {
        // Should revert to original state
        expect(result.current.selectedEvents.has('event1')).toBe(false);
      });
    });
  });

  describe('Cleanup', () => {
    it('should clear debounce timer on unmount', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result, unmount } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      act(() => {
        result.current.toggleEvent('event1');
      });

      // Unmount before save triggers
      unmount();

      // Advance time
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should not save after unmount
      expect(availabilityService.batchUpdateAvailability).not.toHaveBeenCalled();
    });
  });
});
