/**
 * SpotListContainer Component (Container)
 *
 * Handles data fetching and orchestration for SpotList
 */

import React from 'react';
import { SpotList } from './SpotList';
import { SpotCardContainer } from './SpotCardContainer';
import { Skeleton } from '@/components/ui/skeleton';
import type { SpotData } from '@/types/spot';

interface SpotListContainerProps {
  eventId: string;
  spotsData?: SpotData[]; // Allow passing spots directly
}

export function SpotListContainer({
  eventId,
  spotsData
}: SpotListContainerProps) {
  // TODO: Implement hooks when available
  // const { data: spots = [], isLoading } = useEventSpots(eventId);
  // const reorderMutation = useReorderSpots();

  // Temporary mock loading state
  const isLoading = false;

  const handleReorder = (sourceId: string, destinationId: string) => {
    // TODO: Implement reorder mutation
    // reorderMutation.mutate({ eventId, sourceId, destinationId });
    console.log('Reorder spots:', sourceId, destinationId);
  };

  // Sort spots by time and position
  const sortedSpots = React.useMemo(() => {
    const spots: SpotData[] = spotsData || [];
    return [...spots].sort((a, b) => {
      const timeCompare = new Date(a.time).getTime() - new Date(b.time).getTime();
      if (timeCompare !== 0) return timeCompare;
      return a.position - b.position;
    });
  }, [spotsData]);

  // Show skeleton while loading
  if (isLoading && !spotsData) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
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
