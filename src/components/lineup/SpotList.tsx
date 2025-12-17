/**
 * SpotList Component (Presentational)
 *
 * Timeline layout for spots with drag-and-drop support
 */

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SpotData } from '@/types/spot';

interface SpotListProps {
  spots: SpotData[];
  renderCard: (spot: SpotData) => React.ReactNode;
  emptyMessage?: string;
  onReorder?: (sourceId: string, destinationId: string) => void;
}

export function SpotList({
  spots,
  renderCard,
  emptyMessage = 'No spots scheduled yet',
  onReorder
}: SpotListProps) {
  if (spots.length === 0) {
    return (
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
          {emptyMessage}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add spots to build your show lineup
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-4 p-4">
        {/* Spots - Simple list without timeline decorations */}
        {spots.map((spot) => (
          <div key={spot.id}>
            {renderCard(spot)}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export default SpotList;
