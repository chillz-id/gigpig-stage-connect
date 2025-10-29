import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { availabilityService } from '@/services/availability/availability-service';
import { useToast } from '@/hooks/use-toast';

interface UseAvailabilitySelectionReturn {
  selectedEvents: Set<string>;
  toggleEvent: (eventId: string) => void;
  selectWeekday: (dayOfWeek: number, eventIds: string[]) => void;
  isSaving: boolean;
  lastSaved: Date | null;
}

/**
 * Hook for managing availability selection with optimistic updates and debounced saving
 * @param userId - The user ID to manage availability for
 * @returns Selection state and mutation functions
 */
export function useAvailabilitySelection(userId: string): UseAvailabilitySelectionReturn {
  const { toast } = useToast();
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousStateRef = useRef<Set<string>>(new Set());
  const initialStateRef = useRef<Set<string>>(new Set());
  const currentStateRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef<boolean>(false);

  // Load initial availability
  const { data: initialAvailability } = useQuery({
    queryKey: ['availability', userId],
    queryFn: () => availabilityService.getUserAvailability(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Keep currentStateRef in sync with selectedEvents
  useEffect(() => {
    currentStateRef.current = selectedEvents;
  }, [selectedEvents]);

  // Initialize state when data loads (only if not already modified)
  useEffect(() => {
    if (initialAvailability !== undefined && !hasInitializedRef.current) {
      // Only initialize if state hasn't been modified yet
      if (currentStateRef.current.size === 0 && initialStateRef.current.size === 0) {
        hasInitializedRef.current = true;
        setSelectedEvents(new Set(initialAvailability));
        previousStateRef.current = new Set(initialAvailability);
        initialStateRef.current = new Set(initialAvailability);
        currentStateRef.current = new Set(initialAvailability);
      } else {
        hasInitializedRef.current = true;
        // Just update the initial state ref to track what came from server
        initialStateRef.current = new Set(initialAvailability);
      }
    }
  }, [initialAvailability]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const toRemove = new Set<string>();
      const toAdd = new Set<string>();

      // Use currentStateRef to get latest state
      const currentState = currentStateRef.current;

      // Calculate diff from initial state
      initialStateRef.current.forEach((eventId) => {
        if (!currentState.has(eventId)) {
          toRemove.add(eventId);
        }
      });

      currentState.forEach((eventId) => {
        if (!initialStateRef.current.has(eventId)) {
          toAdd.add(eventId);
        }
      });

      await availabilityService.batchUpdateAvailability(userId, toRemove, toAdd);
    },
    onSuccess: () => {
      setLastSaved(new Date());
      // Update initial state to current after successful save
      const currentState = currentStateRef.current;
      initialStateRef.current = new Set(currentState);
      previousStateRef.current = new Set(currentState);
    },
    onError: (error) => {
      // Revert to previous state on error
      setSelectedEvents(new Set(previousStateRef.current));
      toast({
        title: 'Failed to save availability',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Toggle individual event
  const toggleEvent = useCallback(
    (eventId: string) => {
      setSelectedEvents((prev) => {
        // Store previous state before change
        previousStateRef.current = new Set(prev);

        const next = new Set(prev);
        if (next.has(eventId)) {
          next.delete(eventId);
        } else {
          next.add(eventId);
        }

        // Update current state ref immediately
        currentStateRef.current = next;

        return next;
      });

      // Trigger debounced save inline
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        saveMutation.mutate();
      }, 2000);
    },
    []
  ); // Empty deps - mutation is stable, refs are mutable

  // Select/deselect all events for a weekday
  const selectWeekday = useCallback(
    (dayOfWeek: number, eventIds: string[]) => {
      setSelectedEvents((prev) => {
        // Store previous state before change
        previousStateRef.current = new Set(prev);

        const next = new Set(prev);

        // Check if all events for this day are already selected
        const allSelected = eventIds.every((id) => next.has(id));

        if (allSelected) {
          // Deselect all
          eventIds.forEach((id) => next.delete(id));
        } else {
          // Select all
          eventIds.forEach((id) => next.add(id));
        }

        // Update current state ref immediately
        currentStateRef.current = next;

        return next;
      });

      // Trigger debounced save inline
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        saveMutation.mutate();
      }, 2000);
    },
    []
  ); // Empty deps - mutation is stable, refs are mutable

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    selectedEvents,
    toggleEvent,
    selectWeekday,
    isSaving: saveMutation.isPending,
    lastSaved,
  };
}
