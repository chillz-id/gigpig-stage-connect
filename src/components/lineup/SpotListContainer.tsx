/**
 * SpotListContainer Component (Container)
 *
 * Handles data fetching and orchestration for SpotList
 * Calculates spot start times dynamically based on event start time + cumulative durations
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SpotList } from './SpotList';
import { SpotCardContainer } from './SpotCardContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventSpots } from '@/hooks/useEventSpots';
import { supabase } from '@/integrations/supabase/client';
import type { SpotData, SpotStatus, SpotType, SpotCategory } from '@/types/spot';

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
 * Falls back to 'Guest' if not recognized
 */
function mapToSpotType(spotName: string | null): SpotType {
  if (!spotName) return 'Guest';
  const name = spotName.toLowerCase();
  if (name.includes('mc') || name === 'host') return 'MC';
  if (name.includes('feature')) return 'Feature';
  if (name.includes('headliner') || name.includes('headline')) return 'Headliner';
  return 'Guest';
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
 */
function calculateStartTime(
  eventStartTime: string | null,
  eventDate: string | null,
  cumulativeMinutes: number
): string | undefined {
  if (!eventStartTime || !eventDate) return undefined;

  try {
    // Parse event date and start time
    const eventDateObj = new Date(eventDate);
    const [hours, minutes] = eventStartTime.split(':').map(Number);

    // Set the time on the event date
    eventDateObj.setHours(hours ?? 0, minutes ?? 0, 0, 0);

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
      // Calculate start time for this spot
      const startTime = calculateStartTime(
        eventData?.start_time ?? null,
        eventData?.event_date ?? null,
        cumulativeMinutes
      );

      // Add this spot's duration to cumulative total for next spot
      cumulativeMinutes += dbSpot.duration_minutes ?? 0;

      return {
        id: dbSpot.id,
        event_id: dbSpot.event_id,
        position: dbSpot.spot_order ?? 0,
        start_time: startTime,
        type: mapToSpotType(dbSpot.spot_name),
        category: mapToSpotCategory((dbSpot as { spot_category?: string }).spot_category ?? null),
        label: dbSpot.spot_name ?? undefined,
        comedian_id: dbSpot.comedian_id ?? undefined,
        comedian_name: undefined, // Would need join with comedians table
        comedian_avatar: undefined,
        payment_amount: dbSpot.payment_amount ? Number(dbSpot.payment_amount) : undefined,
        status: mapToSpotStatus(dbSpot.confirmation_status, dbSpot.is_filled ?? false),
        duration_minutes: dbSpot.duration_minutes ?? undefined,
        notes: dbSpot.payment_notes ?? undefined,
        created_at: dbSpot.created_at,
        updated_at: dbSpot.updated_at
      };
    });

    return mapped;
  }, [spotsData, dbSpots, eventData]);

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
    <SpotList
      spots={sortedSpots}
      renderCard={(spot) => (
        <SpotCardContainer
          key={spot.id}
          spotId={spot.id}
          eventId={eventId}
          spotData={spot}
        />
      )}
      onReorder={handleReorder}
    />
  );
}

export default SpotListContainer;
