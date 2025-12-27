/**
 * SpotCardContainer Component (Container)
 *
 * Handles data fetching and mutation logic for SpotCard
 * Also serves as a droppable target for drag-and-drop assignment
 * AND a sortable item for reordering spots
 */

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SpotCard } from './SpotCard';
import { BreakCard } from './BreakCard';
import { EditSpotDialog } from './EditSpotDialog';
import { EditBreakDialog } from './EditBreakDialog';
import { EditExtraDialog } from './EditExtraDialog';
import { AssignComedianDialog } from './AssignComedianDialog';
import { AssignExtraDialog } from './AssignExtraDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useEventSpots,
  useUpdateSpotDuration,
  useUpdateSpotType,
  useToggleSpotPaid
} from '@/hooks/useEventSpots';
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
  // Dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Inline editing mutations
  const updateDuration = useUpdateSpotDuration();
  const updateType = useUpdateSpotType();
  const togglePaid = useToggleSpotPaid();
  const { deleteSpot, isDeleting } = useEventSpots(eventId);

  // Make this spot card sortable for reordering
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
    active: sortableActive
  } = useSortable({
    id: spotId,
    data: {
      type: 'spot-item',
      spotId,
      eventId,
      spotData
    }
  });

  // Determine if this is a break (not assignable)
  const isBreak = spotData?.category !== 'act';

  // Determine if this is an extra (production staff)
  const isExtra = spotData?.spot_type === 'extra';

  // Also make it a droppable target for comedian assignment (disabled for breaks and extras)
  const { setNodeRef: setDroppableRef, isOver, active } = useDroppable({
    id: `spot-${spotId}`,
    disabled: isBreak || isExtra,
    data: {
      type: 'spot',
      spotId,
      eventId,
      isEmpty: !spotData?.comedian_id
    }
  });

  // Combine refs for both sortable and droppable
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  // Sortable transform styles
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined
  };

  // Only show drop highlight when dragging a shortlist item (not for extras)
  const isValidDrag = active?.data?.current?.type === 'shortlist-item' && !isExtra;
  const isEmpty = !spotData?.comedian_id;

  // Loading state from mutations
  const isLoading = updateDuration.isPending || updateType.isPending || togglePaid.isPending || isDeleting;

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

  // Get isPaid from the raw database field (we need to add this to SpotData or get from spotData)
  const isPaid = (spotData as { is_paid?: boolean })?.is_paid || false;

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleDelete = () => {
    deleteSpot(spotId);
  };

  const handleAssign = () => {
    setShowAssignDialog(true);
  };

  const handleUpdateDuration = (duration: number) => {
    updateDuration.mutate({ spotId, duration, eventId });
  };

  const handleUpdateType = (spotType: string) => {
    updateType.mutate({ spotId, spotType, eventId });
  };

  const handleTogglePaid = () => {
    togglePaid.mutate({ spotId, isPaid: !isPaid, eventId });
  };

  // Show skeleton while loading
  if (isLoading && !spotData) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "transition-all duration-200 rounded-lg",
          isDragging && "shadow-lg",
          isOver && isValidDrag && isEmpty && "ring-2 ring-primary ring-offset-2 scale-[1.01] bg-primary/5",
          isOver && isValidDrag && !isEmpty && "ring-2 ring-orange-400 ring-offset-2",
          isValidDrag && isEmpty && !isOver && "ring-1 ring-primary/30"
        )}
        {...attributes}
      >
{isBreak ? (
          <BreakCard
            spot={spot}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
            onUpdateDuration={handleUpdateDuration}
            dragListeners={listeners}
          />
        ) : (
          <SpotCard
            spot={spot}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAssign={handleAssign}
            isLoading={isLoading}
            onUpdateDuration={handleUpdateDuration}
            onUpdateType={handleUpdateType}
            onTogglePaid={handleTogglePaid}
            isPaid={isPaid}
            dragListeners={listeners}
          />
        )}
      </div>

      {/* Edit Dialog - different for breaks, extras, and regular spots */}
      {isBreak ? (
        <EditBreakDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          eventId={eventId}
          spot={spot}
        />
      ) : isExtra ? (
        <EditExtraDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          eventId={eventId}
          spot={spot}
        />
      ) : (
        <EditSpotDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          eventId={eventId}
          spot={spot}
          isPaid={isPaid}
        />
      )}

      {/* Assign Dialog - different for extras vs comedians */}
      {isExtra ? (
        <AssignExtraDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          eventId={eventId}
          spotId={spotId}
          extraType={spot.extra_type || 'photographer'}
          currentStaffId={spot.staff_id}
        />
      ) : (
        <AssignComedianDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          eventId={eventId}
          spotId={spotId}
          currentComedianId={spot.comedian_id}
        />
      )}
    </>
  );
}

export default SpotCardContainer;
