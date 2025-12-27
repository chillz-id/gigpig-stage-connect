/**
 * SpotListContainer Component (Container)
 *
 * Handles data fetching and orchestration for SpotList
 * Calculates spot start times dynamically based on event start time + cumulative durations
 * Uses SortableContext for drag-and-drop reordering
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SpotList } from './SpotList';
import { SpotCardContainer } from './SpotCardContainer';
import { NewSpotDropZone } from './NewSpotDropZone';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEventSpots } from '@/hooks/useEventSpots';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';
import type { SpotData, SpotStatus, SpotType, SpotCategory, ExtraType, RateType, StartTimeMode } from '@/types/spot';

interface SpotListContainerProps {
  eventId: string;
  spotsData?: SpotData[]; // Allow passing spots directly (for testing)
}

/**
 * Map database confirmation_status + is_filled to SpotStatus
 */
function mapToSpotStatus(confirmationStatus: string | null, isFilled: boolean): SpotStatus {
  if (confirmationStatus === 'confirmed') return 'confirmed';
  if (confirmationStatus === 'cancelled' || confirmationStatus === 'declined') return 'cancelled';
  if (isFilled) return 'assigned';
  return 'available';
}

/**
 * Try to extract spot type from spot_name (e.g., "MC", "Feature", "Headliner")
 * Falls back to 'Spot' if not recognized
 */
function mapToSpotType(spotName: string | null): SpotType {
  if (!spotName) return 'Spot';
  const name = spotName.toLowerCase();
  if (name.includes('mc') || name === 'host') return 'MC';
  if (name.includes('feature')) return 'Feature';
  if (name.includes('headliner') || name.includes('headline')) return 'Headliner';
  if (name === 'guest') return 'Guest';
  if (name === 'spot') return 'Spot';
  return 'Spot';
}

/**
 * Map database spot_category to SpotCategory type
 */
function mapToSpotCategory(category: string | null): SpotCategory {
  if (category === 'doors') return 'doors';
  if (category === 'intermission') return 'intermission';
  if (category === 'custom') return 'custom';
  return 'act';
}

/**
 * Calculate start time for a spot based on event start time and cumulative durations
 * If start_time is null, tries to extract time from event_date timestamp
 */
function calculateStartTime(
  eventStartTime: string | null,
  eventDate: string | null,
  cumulativeMinutes: number
): string | undefined {
  if (!eventDate) return undefined;

  try {
    // Parse event date - this might already include time info
    const eventDateObj = new Date(eventDate);

    // If we have a separate start_time, use it to override the time
    if (eventStartTime) {
      const [hours, minutes] = eventStartTime.split(':').map(Number);
      eventDateObj.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    }
    // Otherwise, the time from eventDate is used as-is

    // Add cumulative minutes
    eventDateObj.setMinutes(eventDateObj.getMinutes() + cumulativeMinutes);

    return eventDateObj.toISOString();
  } catch {
    return undefined;
  }
}

export function SpotListContainer({
  eventId,
  spotsData
}: SpotListContainerProps) {
  // Fetch event start time
  const { data: eventData } = useQuery({
    queryKey: ['event-start-time', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('start_time, event_date')
        .eq('id', eventId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId
  });

  // Fetch spots from database
  const { spots: dbSpots, isLoading } = useEventSpots(eventId);

  const handleReorder = (sourceId: string, destinationId: string) => {
    // TODO: Implement reorder mutation with time recalculation
    console.log('Reorder spots:', sourceId, destinationId);
  };

  // Map database spots to SpotData type, calculate times, and sort by position
  const sortedSpots = useMemo(() => {
    // Use passed spotsData if available (for testing), otherwise use fetched data
    if (spotsData) {
      return [...spotsData].sort((a, b) => a.position - b.position);
    }

    if (!dbSpots || dbSpots.length === 0) return [];

    // First, sort by position
    const sortedDbSpots = [...dbSpots].sort((a, b) => (a.spot_order ?? 0) - (b.spot_order ?? 0));

    // Map database EventSpot to SpotData with calculated start times
    let cumulativeMinutes = 0;
    const mapped: SpotData[] = sortedDbSpots.map((dbSpot) => {
      // Type cast for extra fields
      const spotWithExtras = dbSpot as {
        spot_category?: string;
        spot_type?: 'act' | 'extra';
        extra_type?: string;
        rate_type?: string;
        hours?: number;
        staff_id?: string;
        staff_name?: string;
        staff_avatar?: string;
        start_time_mode?: string;
        scheduled_start_time?: string;
        comedian?: { id: string; stage_name: string | null; avatar_url: string | null };
      };

      const category = mapToSpotCategory(spotWithExtras.spot_category ?? null);
      const startTimeMode = (spotWithExtras.start_time_mode as StartTimeMode) || 'included';
      const isBreak = category !== 'act';
      const isExtra = spotWithExtras.spot_type === 'extra';

      // Calculate start time for this spot
      const startTime = calculateStartTime(
        eventData?.start_time ?? null,
        eventData?.event_date ?? null,
        cumulativeMinutes
      );

      // Add duration to cumulative total for next spot
      // - Skip breaks with start_time_mode='before' (they happen before show starts)
      // - Skip extras (they don't contribute to show runtime)
      if (!isExtra && !(isBreak && startTimeMode === 'before')) {
        cumulativeMinutes += dbSpot.duration_minutes ?? 0;
      }

      // Extract comedian data from joined profile
      const comedian = spotWithExtras.comedian;

      return {
        id: dbSpot.id,
        event_id: dbSpot.event_id,
        position: dbSpot.spot_order ?? 0,
        start_time: startTime,
        type: mapToSpotType(dbSpot.spot_name),
        category,
        label: dbSpot.spot_name ?? undefined,
        comedian_id: dbSpot.comedian_id ?? undefined,
        comedian_name: comedian?.stage_name ?? undefined,
        comedian_avatar: comedian?.avatar_url ?? undefined,
        payment_amount: dbSpot.payment_amount ? Number(dbSpot.payment_amount) : undefined,
        status: mapToSpotStatus(dbSpot.confirmation_status, dbSpot.is_filled ?? false),
        duration_minutes: dbSpot.duration_minutes ?? undefined,
        notes: dbSpot.payment_notes ?? undefined,
        is_paid: dbSpot.is_paid ?? false,
        created_at: dbSpot.created_at,
        updated_at: dbSpot.updated_at,
        // Extra staff fields
        spot_type: spotWithExtras.spot_type,
        extra_type: spotWithExtras.extra_type as ExtraType | undefined,
        rate_type: spotWithExtras.rate_type as RateType | undefined,
        hours: spotWithExtras.hours,
        staff_id: spotWithExtras.staff_id,
        staff_name: spotWithExtras.staff_name,
        staff_avatar: spotWithExtras.staff_avatar,
        // Break timing
        start_time_mode: startTimeMode,
        // Extra scheduled start time
        scheduled_start_time: spotWithExtras.scheduled_start_time,
      } as SpotData & { is_paid: boolean };
    });

    return mapped;
  }, [spotsData, dbSpots, eventData]);

  // Split spots into performers (comedians + breaks) and extras (production staff)
  const { performerSpots, extraSpots } = useMemo(() => {
    const performers = sortedSpots.filter(spot => spot.spot_type !== 'extra');
    const extras = sortedSpots.filter(spot => spot.spot_type === 'extra');
    return { performerSpots: performers, extraSpots: extras };
  }, [sortedSpots]);

  // Extract spot IDs for SortableContext - must be before any early returns
  const performerSpotIds = useMemo(() => performerSpots.map(spot => spot.id), [performerSpots]);
  const extraSpotIds = useMemo(() => extraSpots.map(spot => spot.id), [extraSpots]);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-64 w-full bg-muted" />
        <Skeleton className="h-64 w-full bg-muted" />
        <Skeleton className="h-64 w-full bg-muted" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-4 p-4">
        {/* Performer Spots (Comedians + Breaks) */}
        <SortableContext items={performerSpotIds} strategy={verticalListSortingStrategy}>
          {performerSpots.length === 0 && extraSpots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No spots scheduled yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag a comedian from the shortlist to create a spot
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {performerSpots.map((spot) => (
                <SpotCardContainer
                  key={spot.id}
                  spotId={spot.id}
                  eventId={eventId}
                  spotData={spot}
                />
              ))}
            </div>
          )}
        </SortableContext>

        {/* New Spot Drop Zone (for performers) */}
        <NewSpotDropZone eventId={eventId} />

        {/* Production Staff Section */}
        {extraSpots.length > 0 && (
          <>
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                <Users className="h-4 w-4" />
                Production Staff
              </h3>
              <SortableContext items={extraSpotIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {extraSpots.map((spot) => (
                    <SpotCardContainer
                      key={spot.id}
                      spotId={spot.id}
                      eventId={eventId}
                      spotData={spot}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}

export default SpotListContainer;
