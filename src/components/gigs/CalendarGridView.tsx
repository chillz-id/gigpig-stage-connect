import React, { useMemo } from 'react';
import { EventPill } from './EventPill';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay
} from 'date-fns';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  venue: string | null;
  external_ticket_url: string | null;
}

interface CalendarGridViewProps {
  events: Event[];
  selectedMonth: Date;
  isComedian: boolean;
  selectedEventIds?: Set<string>;
  onToggleAvailability?: (eventId: string) => void;
}

/**
 * CalendarGridView Component
 *
 * Renders a full calendar grid showing events for the selected month.
 * - 7 columns (Mon-Sun)
 * - Shows event pills in each day cell
 * - Highlights current day
 * - For comedians: Shows checkboxes for availability selection
 * - For others: Shows clickable ticket links
 */
function CalendarGridViewComponent({
  events,
  selectedMonth,
  isComedian,
  selectedEventIds = new Set(),
  onToggleAvailability
}: CalendarGridViewProps) {

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    // Start from Monday of the week containing the 1st of month
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    // End on Sunday of the week containing the last day of month
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedMonth]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};

    events.forEach(event => {
      // Extract date portion directly from datetime string to avoid timezone issues
      // event.event_date format: "2025-11-04T19:30:00"
      // We just want: "2025-11-04"
      const dateKey = event.event_date.split('T')[0];

      // Skip invalid dates
      if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        console.warn('Invalid event date format:', event.event_date, event);
        return;
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // Sort events by time within each day (handle null start_time)
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        // If start_time is null, use event_date for sorting
        const timeA = a.start_time ? new Date(a.start_time).getTime() : new Date(a.event_date).getTime();
        const timeB = b.start_time ? new Date(b.start_time).getTime() : new Date(b.event_date).getTime();
        return timeA - timeB;
      });
    });

    return grouped;
  }, [events]);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-white/70 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const visibleEvents = dayEvents.slice(0, 3);
          const hiddenCount = dayEvents.length - visibleEvents.length;

          const isCurrentMonth = isSameMonth(day, selectedMonth);
          const isCurrentDay = isToday(day);

          const cellClasses = cn(
            "min-h-24 rounded-lg p-2 transition-colors",
            "border border-white/10",
            isCurrentMonth ? "bg-white/5" : "bg-white/[0.02]",
            isCurrentDay && "ring-2 ring-purple-400",
            !isCurrentMonth && "opacity-50"
          );

          return (
            <div key={index} className={cellClasses}>
              {/* Day number */}
              <div className={cn(
                "text-sm font-medium mb-1",
                isCurrentDay ? "text-purple-300" : "text-white/60"
              )}>
                {format(day, 'd')}
              </div>

              {/* Event pills */}
              <div className="space-y-0.5">
                {visibleEvents.map(event => (
                  <EventPill
                    key={event.id}
                    event={event}
                    isComedian={isComedian}
                    isSelected={selectedEventIds.has(event.id)}
                    onToggle={onToggleAvailability}
                  />
                ))}

                {/* More events indicator */}
                {hiddenCount > 0 && (
                  <div className="text-[10px] text-white/50 text-center py-0.5">
                    +{hiddenCount} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <div className="text-center py-12 text-white/50">
          <p className="text-lg">No events found for this month</p>
          <p className="text-sm mt-2">Try navigating to a different month</p>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const CalendarGridView = React.memo(CalendarGridViewComponent);
