/**
 * NewSpotDropZone Component
 *
 * Drop zone at the end of the spot list for creating new spots.
 * When a comedian is dropped here, it creates a new spot and assigns them.
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewSpotDropZoneProps {
  eventId: string;
}

export function NewSpotDropZone({ eventId }: NewSpotDropZoneProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: 'new-spot-zone',
    data: {
      type: 'new-spot-zone',
      eventId
    }
  });

  // Only highlight when dragging a shortlist item
  const isValidDrag = active?.data?.current?.type === 'shortlist-item';

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
        isOver && isValidDrag
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-muted-foreground/30 hover:border-muted-foreground/50",
        isValidDrag && !isOver && "border-primary/50 bg-primary/5"
      )}
    >
      {isOver && isValidDrag ? (
        <>
          <User className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-2 text-sm font-medium text-primary">
            Drop to create new spot
          </p>
        </>
      ) : (
        <>
          <Plus className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Drag comedian here to create new spot
          </p>
        </>
      )}
    </div>
  );
}

export default NewSpotDropZone;
