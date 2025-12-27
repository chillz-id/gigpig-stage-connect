import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tantml:query/react-query';
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

describe('useAvailabilitySelection - Edge Cases', () => {
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
    jest.clearAllMocks();
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

  describe('Null and Undefined Handling', () => {
    it('should handle undefined userId gracefully', async () => {
      const { result } = renderHook(
        () => useAvailabilitySelection(undefined as any),
        { wrapper: createWrapper() }
      );

      // Should not crash
      expect(result.current.selectedEvents.size).toBe(0);
    });

    it('should handle null userId gracefully', async () => {
      const { result } = renderHook(
        () => useAvailabilitySelection(null as any),
        { wrapper: createWrapper() }
      );

      // Should not crash
      expect(result.current.selectedEvents.size).toBe(0);
    });

    it('should handle empty string userId', async () => {
      const { result } = renderHook(
        () => useAvailabilitySelection(''),
        { wrapper: createWrapper() }
      );

      // Should not crash
      expect(result.current.selectedEvents.size).toBe(0);
    });

    it('should handle toggling with undefined event ID', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Try to toggle undefined
      act(() => {
        result.current.toggleEvent(undefined as any);
      });

      // Should handle gracefully without crashing
      expect(result.current.selectedEvents.size).toBe(0);
    });

    it('should handle toggling with null event ID', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Try to toggle null
      act(() => {
        result.current.toggleEvent(null as any);
      });

      // Should handle gracefully
      expect(result.current.selectedEvents.size).toBe(0);
    });
  });

  describe('Large Dataset Handling', () => {
    it('should handle large set of initial selections', async () => {
      // Create 1000 event IDs
      const largeSet = new Set(
        Array.from({ length: 1000 }, (_, i) => `event${i}`)
      );

      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(largeSet);

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(1000);
      });
    });

    it('should handle toggling in large dataset', async () => {
      const largeSet = new Set(
        Array.from({ length: 500 }, (_, i) => `event${i}`)
      );

      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(largeSet);

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(500);
      });

      // Toggle an event in large set
      act(() => {
        result.current.toggleEvent('event100');
      });

      // Should remove it
      expect(result.current.selectedEvents.has('event100')).toBe(false);
      expect(result.current.selectedEvents.size).toBe(499);
    });

    it('should handle weekday selection with many events', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Select 100 events for Monday
      const manyEvents = Array.from({ length: 100 }, (_, i) => `monday-event${i}`);

      act(() => {
        result.current.selectWeekday(1, manyEvents);
      });

      // All should be selected
      expect(result.current.selectedEvents.size).toBe(100);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle rapid consecutive toggles', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Rapid fire 50 toggles
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.toggleEvent(`event${i}`);
        }
      });

      // All should be selected
      expect(result.current.selectedEvents.size).toBe(50);

      // Should only trigger one batch save after debounce
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(availabilityService.batchUpdateAvailability).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle toggling same event multiple times rapidly', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Toggle same event 5 times
      act(() => {
        result.current.toggleEvent('event1'); // add
        result.current.toggleEvent('event1'); // remove
        result.current.toggleEvent('event1'); // add
        result.current.toggleEvent('event1'); // remove
        result.current.toggleEvent('event1'); // add
      });

      // Final state should be selected (odd number of toggles)
      expect(result.current.selectedEvents.has('event1')).toBe(true);
    });

    it('should handle interleaved weekday and event toggles', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      const mondayEvents = ['mon1', 'mon2'];
      const tuesdayEvents = ['tue1', 'tue2'];

      act(() => {
        result.current.selectWeekday(1, mondayEvents); // Add monday events
        result.current.toggleEvent('wed1'); // Add wednesday event
        result.current.selectWeekday(2, tuesdayEvents); // Add tuesday events
        result.current.toggleEvent('mon1'); // Remove one monday event
      });

      // Final state
      expect(result.current.selectedEvents.has('mon1')).toBe(false);
      expect(result.current.selectedEvents.has('mon2')).toBe(true);
      expect(result.current.selectedEvents.has('tue1')).toBe(true);
      expect(result.current.selectedEvents.has('tue2')).toBe(true);
      expect(result.current.selectedEvents.has('wed1')).toBe(true);
      expect(result.current.selectedEvents.size).toBe(4);
    });
  });

  describe('Network and Timeout Scenarios', () => {
    it('should handle slow network response', async () => {
      // Simulate slow response (3 seconds)
      jest.mocked(availabilityService.getUserAvailability).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(new Set(['event1'])), 3000))
      );

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      // Initially loading
      expect(result.current.selectedEvents.size).toBe(0);

      // Advance time
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(result.current.selectedEvents.has('event1')).toBe(true);
      });
    });

    it('should handle network timeout gracefully', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockRejectedValue(
        new Error('Network timeout')
      );

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        // Should fall back to empty set
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Can still interact after error
      act(() => {
        result.current.toggleEvent('event1');
      });

      expect(result.current.selectedEvents.has('event1')).toBe(true);
    });

    it('should handle intermittent save failures', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      let saveAttempts = 0;
      jest.mocked(availabilityService.batchUpdateAvailability).mockImplementation(() => {
        saveAttempts++;
        if (saveAttempts === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(undefined);
      });

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // First toggle
      act(() => {
        result.current.toggleEvent('event1');
      });

      // Trigger save (will fail)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        // Should revert on error
        expect(result.current.selectedEvents.has('event1')).toBe(false);
      });

      // Second toggle
      act(() => {
        result.current.toggleEvent('event2');
      });

      // Trigger save (will succeed)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(availabilityService.batchUpdateAvailability).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Special Characters and Invalid Event IDs', () => {
    it('should handle event IDs with special characters', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Event IDs with special chars
      const specialIds = [
        'event-with-dashes',
        'event_with_underscores',
        'event.with.dots',
        'event@with@at',
        'event#with#hash',
      ];

      act(() => {
        specialIds.forEach(id => result.current.toggleEvent(id));
      });

      // All should be handled
      expect(result.current.selectedEvents.size).toBe(5);
      specialIds.forEach(id => {
        expect(result.current.selectedEvents.has(id)).toBe(true);
      });
    });

    it('should handle very long event ID strings', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Very long ID (1000 characters)
      const longId = 'a'.repeat(1000);

      act(() => {
        result.current.toggleEvent(longId);
      });

      expect(result.current.selectedEvents.has(longId)).toBe(true);
    });

    it('should handle numeric event IDs', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Number as event ID (will be converted to string)
      act(() => {
        result.current.toggleEvent(12345 as any);
      });

      // Should handle conversion
      expect(result.current.selectedEvents.size).toBe(1);
    });
  });

  describe('Debounce Edge Cases', () => {
    it('should reset debounce timer with each toggle', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Toggle every 1.5 seconds (keeps resetting 2 second debounce)
      act(() => {
        result.current.toggleEvent('event1');
      });

      act(() => {
        jest.advanceTimersByTime(1500);
      });

      act(() => {
        result.current.toggleEvent('event2');
      });

      act(() => {
        jest.advanceTimersByTime(1500);
      });

      act(() => {
        result.current.toggleEvent('event3');
      });

      // Should not have saved yet (keeps getting reset)
      expect(availabilityService.batchUpdateAvailability).not.toHaveBeenCalled();

      // Now wait full 2 seconds without interruption
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(availabilityService.batchUpdateAvailability).toHaveBeenCalledTimes(1);
      });
    });

    it('should not save if unmounted during debounce period', async () => {
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

      // Advance 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Unmount before debounce completes
      unmount();

      // Complete debounce period
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should not save after unmount
      expect(availabilityService.batchUpdateAvailability).not.toHaveBeenCalled();
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistency between multiple weekday selections', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      const mondayEvents = ['mon1', 'mon2', 'shared'];
      const tuesdayEvents = ['tue1', 'tue2', 'shared'];

      act(() => {
        result.current.selectWeekday(1, mondayEvents);
        result.current.selectWeekday(2, tuesdayEvents);
      });

      // Shared event should only exist once in the set
      expect(result.current.selectedEvents.has('shared')).toBe(true);
      expect(result.current.selectedEvents.size).toBe(5); // mon1, mon2, tue1, tue2, shared
    });

    it('should handle empty weekday event array', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      const { result } = renderHook(
        () => useAvailabilitySelection('user123'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.selectedEvents.size).toBe(0);
      });

      // Select weekday with empty array
      act(() => {
        result.current.selectWeekday(1, []);
      });

      // Should not crash, no changes
      expect(result.current.selectedEvents.size).toBe(0);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with repeated mount/unmount cycles', async () => {
      jest.mocked(availabilityService.getUserAvailability).mockResolvedValue(new Set());

      // Mount and unmount 10 times
      for (let i = 0; i < 10; i++) {
        const { result, unmount } = renderHook(
          () => useAvailabilitySelection('user123'),
          { wrapper: createWrapper() }
        );

        await waitFor(() => {
          expect(result.current.selectedEvents.size).toBe(0);
        });

        act(() => {
          result.current.toggleEvent(`event${i}`);
        });

        unmount();
      }

      // Should not accumulate pending saves
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should not have called save for unmounted instances
      expect(availabilityService.batchUpdateAvailability).not.toHaveBeenCalled();
    });
  });
});
