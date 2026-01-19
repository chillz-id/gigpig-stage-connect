import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Checkbox } from '@/components/ui/checkbox';
import { formatEventTime } from '@/utils/formatEventTime';

interface BrowseEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  venue: string | null;
  external_ticket_url: string | null;
  ticket_price: number | null;
  currency?: string;
}

interface MonthGroup {
  monthKey: string; // "2025-12"
  monthLabel: string; // "December 2025"
  days: {
    dateKey: string; // "2025-12-15"
    dateLabel: string; // "Sunday, December 15"
    events: BrowseEvent[];
  }[];
}

interface BrowseEventListViewProps {
  events: BrowseEvent[];
  isComedian: boolean;
  selectedEventIds?: Set<string>;
  onToggleAvailability?: (eventId: string) => void;
}

/**
 * BrowseEventListView Component
 *
 * Displays browse events in a mobile-friendly chronological list format.
 * - Groups events by month, then by date within each month
 * - Shows time, title, venue
 * - Comedians can mark availability with checkboxes
 */
export function BrowseEventListView({
  events,
  isComedian,
  selectedEventIds = new Set(),
  onToggleAvailability,
}: BrowseEventListViewProps) {
  const { theme } = useTheme();

  // Group events by month, then by date
  const monthGroups = useMemo((): MonthGroup[] => {
    const monthMap: Record<string, Record<string, BrowseEvent[]>> = {};

    events.forEach(event => {
      // Extract date from event_date (format: "2025-11-04T19:30:00")
      const dateKey = event.event_date.split('T')[0];

      if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return; // Skip invalid dates
      }

      const monthKey = dateKey.substring(0, 7); // "2025-12"

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {};
      }
      if (!monthMap[monthKey][dateKey]) {
        monthMap[monthKey][dateKey] = [];
      }
      monthMap[monthKey][dateKey].push(event);
    });

    // Sort and structure the data
    const sortedMonths = Object.keys(monthMap).sort();

    return sortedMonths.map(monthKey => {
      const daysMap = monthMap[monthKey];
      const sortedDays = Object.keys(daysMap).sort();

      // Sort events within each day by time
      sortedDays.forEach(dateKey => {
        daysMap[dateKey].sort((a, b) => {
          const timeA = a.start_time ? new Date(a.start_time).getTime() : new Date(a.event_date).getTime();
          const timeB = b.start_time ? new Date(b.start_time).getTime() : new Date(b.event_date).getTime();
          return timeA - timeB;
        });
      });

      return {
        monthKey,
        monthLabel: format(parseISO(`${monthKey}-01`), 'MMMM yyyy'), // "December 2025"
        days: sortedDays.map(dateKey => ({
          dateKey,
          dateLabel: format(parseISO(dateKey), 'EEEE, MMMM d'), // "Sunday, December 15"
          events: daysMap[dateKey],
        })),
      };
    });
  }, [events]);

  if (events.length === 0) {
    return (
      <div className={cn(
        "text-center py-12",
        "bg-white/5 backdrop-blur-sm rounded-lg"
      )}>
        <p className="text-lg text-white/50">No events found for this period</p>
        <p className="text-sm text-white/30 mt-2">Try selecting a different month</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {monthGroups.map(monthGroup => (
        <div key={monthGroup.monthKey}>
          {/* Month Section Header */}
          <div className={cn(
            "py-3 px-4 mb-4 rounded-xl",
            theme === 'pleasure'
              ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30'
              : 'bg-gradient-to-r from-red-600/30 to-orange-600/30 border border-red-500/30'
          )}>
            <h2 className="text-lg font-bold text-white">
              {monthGroup.monthLabel}
            </h2>
          </div>

          {/* Days within this month */}
          <div className="space-y-6">
            {monthGroup.days.map(day => (
              <div key={day.dateKey}>
                {/* Date Header (not sticky) */}
                <div className={cn(
                  "py-2 px-3 mb-3 rounded-lg",
                  theme === 'pleasure'
                    ? 'bg-purple-900/50'
                    : 'bg-gray-800/50'
                )}>
                  <h3 className="text-sm font-semibold text-white/80">
                    {day.dateLabel}
                  </h3>
                </div>

                {/* Event Cards */}
                <div className="space-y-3">
                  {day.events.map(event => {
                    const isSelected = selectedEventIds.has(event.id);
                    const eventTime = formatEventTime(event.event_date);

                    return (
                      <div
                        key={event.id}
                        onClick={isComedian && onToggleAvailability ? () => onToggleAvailability(event.id) : undefined}
                        className={cn(
                          "rounded-lg p-4 transition-all",
                          "border",
                          isComedian && onToggleAvailability && "cursor-pointer",
                          theme === 'pleasure'
                            ? isSelected
                              ? 'bg-green-600/20 border-green-500/50'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                            : isSelected
                              ? 'bg-green-600/20 border-green-500/50'
                              : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70'
                        )}
                      >
                        {/* Top row: Time + Availability checkbox for comedians */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-white/70">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">{eventTime}</span>
                          </div>

                          {isComedian && onToggleAvailability && (
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className={cn(
                                "text-xs",
                                isSelected ? 'text-green-400' : 'text-white/50'
                              )}>
                                {isSelected ? 'Available' : 'Mark Available'}
                              </span>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => onToggleAvailability(event.id)}
                                className={cn(
                                  "border-white/30",
                                  isSelected && "bg-green-600 border-green-600"
                                )}
                              />
                            </div>
                          )}
                        </div>

                        {/* Event Title */}
                        <h4 className="text-base font-semibold text-white mb-2 line-clamp-2">
                          {event.title}
                        </h4>

                        {/* Venue */}
                        {event.venue && (
                          <div className="flex items-center gap-2 text-white/60">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm truncate">{event.venue}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
