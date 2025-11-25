import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { getDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface DayOfWeekSelectorProps {
  events: Array<{
    id: string;
    event_date: string;
  }>;
  selectedEventIds: Set<string>;
  onSelectWeekday: (dayOfWeek: number, eventIds: string[]) => void;
}

/**
 * DayOfWeekSelector Component
 *
 * Renders 7 buttons for days of the week (Mon-Sun).
 * Allows bulk selection/deselection of all events on a specific day.
 * Shows visual states: all selected, some selected, none selected.
 */
export function DayOfWeekSelector({
  events,
  selectedEventIds,
  onSelectWeekday
}: DayOfWeekSelectorProps) {

  // Calculate statistics for each day of the week
  const dayStats = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return days.map((label, index) => {
      // JavaScript getDay(): 0=Sunday, 1=Monday, etc.
      // We want: 0=Monday, 1=Tuesday, etc.
      // So we need to adjust: Mon=1, Tue=2, ..., Sun=0
      const jsDay = index === 6 ? 0 : index + 1;

      // Filter events that occur on this day of week
      const dayEvents = events.filter(event => {
        // Extract date portion to avoid timezone parsing issues
        // event.event_date format: "2025-11-04T19:30:00" (local time, no TZ)
        // Using date string extraction prevents UTC interpretation bug
        const datePart = event.event_date.split('T')[0]; // "2025-11-04"
        const eventDay = getDay(new Date(`${datePart}T12:00:00`)); // Noon avoids DST edge cases
        return eventDay === jsDay;
      });

      // Count how many are selected
      const selectedCount = dayEvents.filter(event =>
        selectedEventIds.has(event.id)
      ).length;

      // Determine selection state
      let state: 'none' | 'some' | 'all' = 'none';
      if (selectedCount === 0) {
        state = 'none';
      } else if (selectedCount === dayEvents.length) {
        state = 'all';
      } else {
        state = 'some';
      }

      return {
        label,
        jsDay, // JavaScript day number (0-6, Sunday=0)
        total: dayEvents.length,
        selected: selectedCount,
        state,
        eventIds: dayEvents.map(e => e.id)
      };
    });
  }, [events, selectedEventIds]);

  const handleDayClick = (dayStat: typeof dayStats[0]) => {
    if (dayStat.total === 0) return; // No events on this day
    onSelectWeekday(dayStat.jsDay, dayStat.eventIds);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white/70">Quick Select by Day</h3>
        <p className="text-xs text-white/50">
          Click a day to mark all events available
        </p>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayStats.map((dayStat) => {
          const isDisabled = dayStat.total === 0;

          const buttonClasses = cn(
            "h-12 text-sm font-medium transition-all",
            "flex flex-col items-center justify-center",
            "rounded-lg",
            isDisabled && "opacity-40 cursor-not-allowed",
            !isDisabled && dayStat.state === 'all' && "bg-purple-600 text-white hover:bg-purple-500",
            !isDisabled && dayStat.state === 'some' && "border-2 border-purple-600 text-purple-400 hover:bg-purple-600/20",
            !isDisabled && dayStat.state === 'none' && "border border-gray-600 text-gray-400 hover:bg-gray-600/20"
          );

          return (
            <Button
              key={dayStat.label}
              className="professional-button"
              className={buttonClasses}
              onClick={() => handleDayClick(dayStat)}
              disabled={isDisabled}
            >
              <span className="text-xs font-semibold">{dayStat.label}</span>
              {dayStat.total > 0 && (
                <span className="text-[10px] opacity-80">
                  {dayStat.selected}/{dayStat.total}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
