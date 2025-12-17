import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, MapPin, Ticket, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
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
 * - Groups events by date
 * - Shows time, title, venue, ticket price
 * - Comedians can mark availability with checkboxes
 * - Non-comedians see "Buy Tickets" button
 */
export function BrowseEventListView({
  events,
  isComedian,
  selectedEventIds = new Set(),
  onToggleAvailability,
}: BrowseEventListViewProps) {
  const { theme } = useTheme();

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, BrowseEvent[]> = {};

    events.forEach(event => {
      // Extract date from event_date (format: "2025-11-04T19:30:00")
      const dateKey = event.event_date.split('T')[0];

      if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return; // Skip invalid dates
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    // Sort events within each day by time
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => {
        const timeA = a.start_time ? new Date(a.start_time).getTime() : new Date(a.event_date).getTime();
        const timeB = b.start_time ? new Date(b.start_time).getTime() : new Date(b.event_date).getTime();
        return timeA - timeB;
      });
    });

    return groups;
  }, [events]);

  // Sort date keys chronologically
  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedEvents).sort((a, b) => a.localeCompare(b));
  }, [groupedEvents]);

  // Format date header
  const formatDateHeader = (dateKey: string): string => {
    try {
      return format(parseISO(dateKey), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateKey;
    }
  };

  // Handle ticket click
  const handleBuyTickets = (url: string | null) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

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
    <div className="space-y-6">
      {sortedDateKeys.map(dateKey => {
        const dayEvents = groupedEvents[dateKey];
        if (!dayEvents) return null;

        return (
          <div key={dateKey}>
            {/* Date Header */}
            <div className={cn(
              "sticky top-0 z-10 py-2 px-3 mb-3 rounded-lg",
              theme === 'pleasure'
                ? 'bg-purple-900/80 backdrop-blur-sm'
                : 'bg-gray-800/80 backdrop-blur-sm'
            )}>
              <h3 className="text-sm font-semibold text-white/80">
                {formatDateHeader(dateKey)}
              </h3>
            </div>

            {/* Event Cards */}
            <div className="space-y-3">
              {dayEvents.map(event => {
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
                      <div className="flex items-center gap-2 text-white/60 mb-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{event.venue}</span>
                      </div>
                    )}

                    {/* Bottom row: Price + Buy Tickets (for non-comedians) */}
                    {!isComedian && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                        {event.ticket_price ? (
                          <div className="flex items-center gap-2 text-white/70">
                            <Ticket className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              ${event.ticket_price} {event.currency || 'AUD'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm text-white/50">Price TBA</div>
                        )}

                        {event.external_ticket_url && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleBuyTickets(event.external_ticket_url)}
                            className={cn(
                              "gap-1.5",
                              theme === 'pleasure'
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            )}
                          >
                            Buy Tickets
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
