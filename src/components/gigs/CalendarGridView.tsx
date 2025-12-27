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
import { useMobileLayout } from '@/hooks/useMobileLayout';

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
  const { isMobile } = useMobileLayout();

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

  // Day headers - shorter on mobile
  const dayHeaders = isMobile
    ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className={cn(
      "bg-white/5 backdrop-blur-sm rounded-lg",
      isMobile ? "p-2" : "p-4"
    )}>
      {/* Day of week headers */}
      <div className={cn(
        "grid grid-cols-7 mb-2",
        isMobile ? "gap-1" : "gap-2"
      )}>
        {dayHeaders.map((day, idx) => (
          <div
            key={idx}
            className={cn(
              "text-center font-semibold text-white/70",
              isMobile ? "text-xs py-1" : "text-sm py-2"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={cn(
        "grid grid-cols-7",
        isMobile ? "gap-1" : "gap-2"
      )}>
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          // Show fewer events on mobile to save space
          const maxVisible = isMobile ? 2 : 3;
          const visibleEvents = dayEvents.slice(0, maxVisible);
          const hiddenCount = dayEvents.length - visibleEvents.length;

          const isCurrentMonth = isSameMonth(day, selectedMonth);
          const isCurrentDay = isToday(day);

          const cellClasses = cn(
            "rounded-lg transition-colors",
            "border border-white/10",
            // Smaller cells on mobile
            isMobile ? "min-h-14 p-1" : "min-h-24 p-2",
            isCurrentMonth ? "bg-white/5" : "bg-white/[0.02]",
            isCurrentDay && "ring-2 ring-purple-400",
            !isCurrentMonth && "opacity-50"
          );

          return (
            <div key={index} className={cellClasses}>
              {/* Day number */}
              <div className={cn(
                "font-medium",
                isMobile ? "text-xs mb-0.5" : "text-sm mb-1",
                isCurrentDay ? "text-purple-300" : "text-white/60"
              )}>
                {format(day, 'd')}
              </div>

              {/* Event pills */}
              <div className={isMobile ? "space-y-px" : "space-y-0.5"}>
                {visibleEvents.map(event => (
                  <EventPill
                    key={event.id}
                    event={event}
                    isComedian={isComedian}
                    isSelected={selectedEventIds.has(event.id)}
                    onToggle={onToggleAvailability}
                    compact={isMobile}
                  />
                ))}

                {/* More events indicator */}
                {hiddenCount > 0 && (
                  <div className={cn(
                    "text-white/50 text-center",
                    isMobile ? "text-[8px] py-px" : "text-[10px] py-0.5"
                  )}>
                    +{hiddenCount}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <div className={cn(
          "text-center text-white/50",
          isMobile ? "py-8" : "py-12"
        )}>
          <p className={isMobile ? "text-base" : "text-lg"}>No events found for this month</p>
          <p className={cn("mt-2", isMobile ? "text-xs" : "text-sm")}>Try navigating to a different month</p>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const CalendarGridView = React.memo(CalendarGridViewComponent);
