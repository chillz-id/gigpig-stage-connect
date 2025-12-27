/**
 * LineupTimeline Component (Presentational)
 *
 * Visual timeline showing event flow with color-coded spots
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import type { SpotData } from '@/types/spot';

interface LineupTimelineProps {
  spots: SpotData[];
  eventStartTime: string;
  eventEndTime: string;
}

export function LineupTimeline({
  spots,
  eventStartTime,
  eventEndTime
}: LineupTimelineProps) {
  const typeColors: Record<string, { bg: string; border: string; text: string }> = {
    MC: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-500',
      text: 'text-blue-800 dark:text-blue-200'
    },
    Feature: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      border: 'border-yellow-500',
      text: 'text-yellow-800 dark:text-yellow-200'
    },
    Headliner: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      border: 'border-purple-500',
      text: 'text-purple-800 dark:text-purple-200'
    },
    Guest: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-500',
      text: 'text-green-800 dark:text-green-200'
    }
  };

  const formatTime = (time: string) => {
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };

  const calculatePosition = (time: string) => {
    const start = new Date(eventStartTime).getTime();
    const end = new Date(eventEndTime).getTime();
    const current = new Date(time).getTime();

    const totalDuration = end - start;
    const elapsed = current - start;

    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  };

  const sortedSpots = React.useMemo(() => {
    return [...spots].sort((a, b) => {
      return new Date(a.time).getTime() - new Date(b.time).getTime();
    });
  }, [spots]);

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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          No timeline available
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Show Timeline
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatTime(eventStartTime)} - {formatTime(eventEndTime)}
          </p>
        </div>
        <Badge className="professional-button">
          {spots.length} {spots.length === 1 ? 'spot' : 'spots'}
        </Badge>
      </div>

      {/* Timeline Visualization */}
      <div className="relative w-full">
        {/* Timeline bar */}
        <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-pink-200 via-purple-300 to-purple-400 dark:from-pink-900 dark:via-purple-900 dark:to-purple-800">
          {/* Start time marker */}
          <div className="absolute -left-2 -top-6 text-xs font-medium text-gray-600 dark:text-gray-400">
            {formatTime(eventStartTime)}
          </div>

          {/* End time marker */}
          <div className="absolute -right-2 -top-6 text-xs font-medium text-gray-600 dark:text-gray-400">
            {formatTime(eventEndTime)}
          </div>
        </div>

        {/* Spot markers */}
        <div className="relative mt-8 space-y-3">
          {sortedSpots.map((spot, index) => {
            const colors = typeColors[spot.type] || typeColors.Guest;
            const position = calculatePosition(spot.time);

            return (
              <div
                key={spot.id}
                className="relative"
                style={{ paddingLeft: `${position}%` }}
              >
                <div
                  className={`inline-flex items-center gap-2 rounded-lg border-2 ${colors.border} ${colors.bg} px-3 py-2 shadow-sm`}
                >
                  {/* Position */}
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-xs font-bold text-white">
                    {spot.position}
                  </div>

                  {/* Time */}
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {formatTime(spot.time)}
                  </span>

                  {/* Type badge */}
                  <Badge
                    variant="secondary"
                    className={`${colors.text} border-current text-xs`}
                  >
                    {spot.type}
                  </Badge>

                  {/* Comedian */}
                  {spot.comedian_id && spot.comedian_name ? (
                    <div className="flex items-center gap-2">
                      <OptimizedAvatar
                        src={spot.comedian_avatar}
                        name={spot.comedian_name}
                        className="h-6 w-6"
                        fallbackClassName="text-xs"
                      />
                      <span className={`text-xs font-medium ${colors.text}`}>
                        {spot.comedian_name}
                      </span>
                    </div>
                  ) : (
                    <span className={`text-xs italic ${colors.text} opacity-60`}>
                      Unassigned
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Spot Types:
        </span>
        {Object.entries(typeColors).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full border-2 ${colors.border} ${colors.bg}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LineupTimeline;
