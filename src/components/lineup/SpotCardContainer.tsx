/**
 * SpotCardContainer Component (Container)
 *
 * Handles data fetching and mutation logic for SpotCard
 */

import React from 'react';
import { SpotCard } from './SpotCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { SpotData } from '@/types/spot';

interface SpotCardContainerProps {
  spotId: string;
  eventId: string;
  spotData?: SpotData; // Allow passing spot data directly to avoid extra fetches
}

export function SpotCardContainer({
  spotId,
  eventId,
  spotData
}: SpotCardContainerProps) {
  // TODO: Implement hooks when available
  // const { data: spot, isLoading } = useSpot(spotId);
  // const deleteMutation = useDeleteSpot();
  // const assignMutation = useAssignComedian();

  // Temporary mock loading state
  const isLoading = false;

  // Use passed data or mock data for now
  const spot: SpotData = spotData || {
    id: spotId,
    event_id: eventId,
    position: 1,
    time: new Date().toISOString(),
    type: 'MC',
    status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const handleEdit = () => {
    // TODO: Open edit modal/drawer
    console.log('Edit spot:', spotId);
  };

  const handleDelete = () => {
    // TODO: Implement delete mutation
    // deleteMutation.mutate({ spotId, eventId });
    console.log('Delete spot:', spotId);
  };

  const handleAssign = () => {
    // TODO: Open assign comedian modal
    console.log('Assign comedian to spot:', spotId);
  };

  // Show skeleton while loading
  if (isLoading && !spotData) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <SpotCard
      spot={spot}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onAssign={handleAssign}
      isLoading={isLoading}
    />
  );
}

export default SpotCardContainer;
