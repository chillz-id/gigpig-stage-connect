import { useState, useCallback } from 'react';
import {
  checkForDuplicates,
  linkToSyncedEvent,
  mergeIntoSyncedEvent,
  DuplicateCandidate,
  DuplicateCheckResult,
} from '@/services/event/duplicate-detection-service';

export interface UseDuplicateDetectionReturn {
  /**
   * Check for duplicate events
   */
  checkDuplicates: (
    title: string,
    eventDate: string | Date,
    excludeEventId?: string
  ) => Promise<DuplicateCheckResult>;

  /**
   * Link a platform event to a synced event
   */
  linkEvents: (platformEventId: string, syncedEventId: string) => Promise<boolean>;

  /**
   * Merge platform data into a synced event
   */
  mergeData: (
    syncedEventId: string,
    platformData: {
      description?: string;
      banner_url?: string;
      requirements?: string;
      spots?: number;
    }
  ) => Promise<boolean>;

  /**
   * Current duplicate check result
   */
  duplicateResult: DuplicateCheckResult | null;

  /**
   * Whether a duplicate check is in progress
   */
  isChecking: boolean;

  /**
   * Whether a link/merge operation is in progress
   */
  isLinking: boolean;

  /**
   * Error message if any operation failed
   */
  error: string | null;

  /**
   * Clear the current result and error
   */
  reset: () => void;

  /**
   * Skip duplicate detection and proceed with creation
   */
  skipDuplicateCheck: () => void;

  /**
   * Whether duplicate check was skipped
   */
  wasSkipped: boolean;
}

export function useDuplicateDetection(): UseDuplicateDetectionReturn {
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasSkipped, setWasSkipped] = useState(false);

  const reset = useCallback(() => {
    setDuplicateResult(null);
    setError(null);
    setWasSkipped(false);
  }, []);

  const skipDuplicateCheck = useCallback(() => {
    setWasSkipped(true);
    setDuplicateResult(null);
  }, []);

  const checkDuplicates = useCallback(
    async (
      title: string,
      eventDate: string | Date,
      excludeEventId?: string
    ): Promise<DuplicateCheckResult> => {
      setIsChecking(true);
      setError(null);

      try {
        const result = await checkForDuplicates(title, eventDate, {
          excludeEventId,
          similarityThreshold: 0.7,
          maxResults: 5,
        });

        setDuplicateResult(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check for duplicates';
        setError(message);
        return { hasDuplicates: false, candidates: [], exactMatch: null };
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  const linkEvents = useCallback(
    async (platformEventId: string, syncedEventId: string): Promise<boolean> => {
      setIsLinking(true);
      setError(null);

      try {
        const result = await linkToSyncedEvent(platformEventId, syncedEventId);

        if (!result.success) {
          setError(result.error ?? 'Failed to link events');
          return false;
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to link events';
        setError(message);
        return false;
      } finally {
        setIsLinking(false);
      }
    },
    []
  );

  const mergeData = useCallback(
    async (
      syncedEventId: string,
      platformData: {
        description?: string;
        banner_url?: string;
        requirements?: string;
        spots?: number;
      }
    ): Promise<boolean> => {
      setIsLinking(true);
      setError(null);

      try {
        const result = await mergeIntoSyncedEvent(syncedEventId, platformData);

        if (!result.success) {
          setError(result.error ?? 'Failed to merge data');
          return false;
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to merge data';
        setError(message);
        return false;
      } finally {
        setIsLinking(false);
      }
    },
    []
  );

  return {
    checkDuplicates,
    linkEvents,
    mergeData,
    duplicateResult,
    isChecking,
    isLinking,
    error,
    reset,
    skipDuplicateCheck,
    wasSkipped,
  };
}

export type { DuplicateCandidate, DuplicateCheckResult };
