import { useState, useEffect, useCallback, useMemo } from 'react';
import { checkForDuplicateEvents, checkVenueAvailability, DuplicateCheckResult } from '@/utils/eventDuplicateChecker';
import { debounce } from '@/utils/debounce';
import { useToast } from './use-toast';

interface UseEventDuplicateCheckOptions {
  excludeEventId?: string;
  debounceMs?: number;
  autoCheck?: boolean;
}

export const useEventDuplicateCheck = (
  title: string,
  date: string,
  venue: string,
  startTime?: string,
  endTime?: string,
  options: UseEventDuplicateCheckOptions = {}
) => {
  const {
    excludeEventId,
    debounceMs = 1000,
    autoCheck = true
  } = options;

  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult>({
    isDuplicate: false,
    similarEvents: [],
    warnings: []
  });
  const [venueAvailability, setVenueAvailability] = useState<{
    isAvailable: boolean;
    conflicts: Array<{ id: string; title: string; time: string; }>;
  }>({
    isAvailable: true,
    conflicts: []
  });

  // Check for duplicates
  const checkDuplicates = useCallback(async () => {
    if (!title || !date || !venue) {
      setDuplicateResult({
        isDuplicate: false,
        similarEvents: [],
        warnings: []
      });
      return;
    }

    setIsChecking(true);
    try {
      const result = await checkForDuplicateEvents(title, date, venue, excludeEventId);
      setDuplicateResult(result);

      // Show toast for high similarity duplicates
      if (result.isDuplicate && result.warnings.length > 0) {
        toast({
          title: "Possible Duplicate Event",
          description: result.warnings[0],
          variant: "warning",
        });
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    } finally {
      setIsChecking(false);
    }
  }, [title, date, venue, excludeEventId, toast]);

  // Check venue availability
  const checkVenue = useCallback(async () => {
    if (!venue || !date || !startTime) {
      setVenueAvailability({
        isAvailable: true,
        conflicts: []
      });
      return;
    }

    try {
      const result = await checkVenueAvailability(venue, date, startTime, endTime, excludeEventId);
      setVenueAvailability(result);

      // Show toast for conflicts
      if (!result.isAvailable && result.conflicts.length > 0) {
        toast({
          title: "Venue Scheduling Conflict",
          description: `${venue} already has ${result.conflicts.length} event(s) scheduled at this time.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking venue availability:', error);
    }
  }, [venue, date, startTime, endTime, excludeEventId, toast]);

  // Debounced check functions
  const debouncedCheckDuplicates = useMemo(() => debounce(checkDuplicates, debounceMs), [checkDuplicates, debounceMs]);

  const debouncedCheckVenue = useMemo(() => debounce(checkVenue, debounceMs), [checkVenue, debounceMs]);

  // Auto-check when values change
  useEffect(() => {
    if (autoCheck) {
      debouncedCheckDuplicates();
    }
  }, [title, date, venue, autoCheck, debouncedCheckDuplicates]);

  useEffect(() => {
    if (autoCheck && startTime) {
      debouncedCheckVenue();
    }
  }, [venue, date, startTime, endTime, autoCheck, debouncedCheckVenue]);

  // Manual check function
  const performCheck = useCallback(async () => {
    await Promise.all([
      checkDuplicates(),
      checkVenue()
    ]);
  }, [checkDuplicates, checkVenue]);

  // Get combined warnings
  const getAllWarnings = useCallback(() => {
    const warnings: string[] = [...duplicateResult.warnings];
    
    if (!venueAvailability.isAvailable) {
      warnings.push(`Venue conflict: ${venueAvailability.conflicts.length} event(s) already scheduled`);
    }
    
    return warnings;
  }, [duplicateResult.warnings, venueAvailability]);

  // Check if event can be safely created
  const canCreateEvent = useCallback(() => {
    return !duplicateResult.isDuplicate && venueAvailability.isAvailable;
  }, [duplicateResult.isDuplicate, venueAvailability.isAvailable]);

  return {
    // State
    isChecking,
    duplicateResult,
    venueAvailability,
    
    // Computed
    hasDuplicateWarning: duplicateResult.similarEvents.length > 0,
    hasVenueConflict: !venueAvailability.isAvailable,
    canCreateEvent: canCreateEvent(),
    allWarnings: getAllWarnings(),
    
    // Actions
    checkDuplicates: performCheck,
    clearResults: () => {
      setDuplicateResult({
        isDuplicate: false,
        similarEvents: [],
        warnings: []
      });
      setVenueAvailability({
        isAvailable: true,
        conflicts: []
      });
    }
  };
};
