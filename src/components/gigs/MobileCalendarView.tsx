import React, { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  venue: string | null;
}

interface MobileCalendarViewProps {
  events: Event[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  isComedian: boolean;
  selectedEventIds?: Set<string>;
  onToggleAvailability?: (eventId: string) => void;
  onDayClick?: (date: Date, dayEvents: Event[]) => void;
}

/**
 * MobileCalendarView Component
 *
 * Minimalist mobile calendar inspired by standupsydney.com
 * - Clean design with just date numbers
 * - Red/pink circles indicate days with events
 * - Arrow navigation for months
 * - Tap day to see events or mark availability
 */
export function MobileCalendarView({
  events,
  selectedMonth,
  onMonthChange,
  isComedian,
  selectedEventIds = new Set(),
  onToggleAvailability,
  onDayClick,
}: MobileCalendarViewProps) {
  const { theme } = useTheme();

  // Generate calendar grid days (start on Sunday)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    // Start from Sunday of the week containing the 1st of month
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    // End on Saturday of the week containing the last day of month
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedMonth]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};

    events.forEach(event => {
      const dateKey = event.event_date.split('T')[0];
      if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // Sort events by time within each day
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        const timeA = a.start_time ? new Date(a.start_time).getTime() : new Date(a.event_date).getTime();
        const timeB = b.start_time ? new Date(b.start_time).getTime() : new Date(b.event_date).getTime();
        return timeA - timeB;
      });
    });

    return grouped;
  }, [events]);

  // Check if any events on a day are selected (for comedians)
  const getDaySelectionStatus = (dayEvents: Event[]) => {
    if (!isComedian || dayEvents.length === 0) return 'none';
    const hasAnySelected = dayEvents.some(e => selectedEventIds.has(e.id));
    return hasAnySelected ? 'selected' : 'none';
  };

  const handleDayTap = (day: Date, dayEvents: Event[]) => {
    if (dayEvents.length === 0) return;

    if (onDayClick) {
      onDayClick(day, dayEvents);
    }
  };

  const handlePrevMonth = () => {
    onMonthChange(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(selectedMonth, 1));
  };

  // Day headers (Sun-Sat)
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Theme colors
  const eventDotColor = theme === 'pleasure' ? 'bg-pink-500' : 'bg-red-500';
  const selectedDotColor = 'bg-green-500';

  return (
    <div className="bg-card rounded-2xl shadow-lg p-4">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        <h2 className="text-lg font-bold text-foreground">
          {format(selectedMonth, 'MMMM yyyy')}
        </h2>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {dayHeaders.map((day, idx) => (
          <div
            key={idx}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const hasEvents = dayEvents.length > 0;
          const isCurrentMonth = isSameMonth(day, selectedMonth);
          const isCurrentDay = isToday(day);
          const selectionStatus = getDaySelectionStatus(dayEvents);

          return (
            <button
              key={index}
              onClick={() => handleDayTap(day, dayEvents)}
              disabled={!hasEvents}
              className={cn(
                "relative aspect-square flex items-center justify-center rounded-full transition-all",
                "text-sm font-medium",
                hasEvents && "cursor-pointer active:scale-95",
                !hasEvents && "cursor-default",
                !isCurrentMonth && "opacity-30",
              )}
            >
              {/* Background circle for events */}
              {hasEvents && isCurrentMonth && (
                <div
                  className={cn(
                    "absolute inset-1 rounded-full",
                    selectionStatus === 'selected' ? selectedDotColor : eventDotColor
                  )}
                />
              )}

              {/* Today subtle highlight */}
              {isCurrentDay && !hasEvents && (
                <div className="absolute inset-1 rounded-full bg-muted" />
              )}

              {/* Day number */}
              <span
                className={cn(
                  "relative z-10",
                  hasEvents && isCurrentMonth && "text-white font-semibold",
                  !hasEvents && isCurrentMonth && "text-foreground",
                  isCurrentDay && !hasEvents && "text-foreground font-semibold",
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Event count badge (if more than 1 event) */}
              {hasEvents && dayEvents.length > 1 && isCurrentMonth && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-card rounded-full text-[10px] font-bold text-foreground flex items-center justify-center shadow-sm">
                  {dayEvents.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className={cn("w-3 h-3 rounded-full", eventDotColor)} />
          <span>Events</span>
        </div>
        {isComedian && (
          <div className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded-full", selectedDotColor)} />
            <span>Available</span>
          </div>
        )}
      </div>
    </div>
  );
}
