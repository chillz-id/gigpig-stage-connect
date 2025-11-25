import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Trash2, FileText } from 'lucide-react';
import { format, parseISO, isSameDay, isBefore, isAfter, startOfDay } from 'date-fns';
import { GigPillEvent, GigType } from './GigPill';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GigListViewProps {
  events: GigPillEvent[];
  onEventClick?: (event: GigPillEvent) => void;
  onEventDelete?: (eventId: string, type: GigType) => void;
  showDelete?: boolean;
  groupBy?: 'day' | 'month';
}

/**
 * GigListView Component
 *
 * Displays gigs in a chronological list format:
 * - Sorted by date (soonest to latest)
 * - Grouped by day or month
 * - Filterable by event type (all/confirmed/personal/pending)
 * - Shows full event details
 * - Delete option for personal gigs
 * - Empty state when no events
 */
export const GigListView: React.FC<GigListViewProps> = ({
  events,
  onEventClick,
  onEventDelete,
  showDelete = false,
  groupBy = 'month',
}) => {
  const [filter, setFilter] = useState<GigType | 'all'>('all');

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(event => event.type === filter);
    }

    // Sort by date (soonest first)
    filtered.sort((a, b) => {
      const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date;
      const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date;
      return dateA.getTime() - dateB.getTime();
    });

    return filtered;
  }, [events, filter]);

  // Group events by day or month
  const groupedEvents = useMemo(() => {
    const groups: Record<string, GigPillEvent[]> = {};

    filteredEvents.forEach(event => {
      const eventDate = typeof event.date === 'string' ? parseISO(event.date) : event.date;
      const key = groupBy === 'day'
        ? format(eventDate, 'yyyy-MM-dd')
        : format(eventDate, 'yyyy-MM');

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key]!.push(event);
    });

    return groups;
  }, [filteredEvents, groupBy]);

  const formatGroupHeader = (key: string): string => {
    if (groupBy === 'day') {
      return format(parseISO(key), 'EEEE, MMMM d, yyyy');
    } else {
      return format(parseISO(`${key}-01`), 'MMMM yyyy');
    }
  };

  const formatTime = (dateString: string): string => {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const minuteStr = minutes.toString().padStart(2, '0');

    if (hours === 0) return `12:${minuteStr}am`;
    if (hours < 12) return `${hours}:${minuteStr}am`;
    if (hours === 12) return `12:${minuteStr}pm`;
    return `${hours - 12}:${minuteStr}pm`;
  };

  const getTypeColor = (type: GigType): string => {
    switch (type) {
      case 'confirmed':
        return 'bg-green-600';
      case 'personal':
        return 'bg-blue-600';
      case 'pending':
        return 'bg-orange-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getTypeName = (type: GigType): string => {
    switch (type) {
      case 'confirmed':
        return 'Confirmed';
      case 'personal':
        return 'Personal';
      case 'pending':
        return 'Pending';
      default:
        return type;
    }
  };

  const handleDelete = (e: React.MouseEvent, eventId: string, type: GigType) => {
    e.stopPropagation();
    if (onEventDelete) {
      onEventDelete(eventId, type);
    }
  };

  const handleEventClick = (event: GigPillEvent) => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Empty state
  if (filteredEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No gigs found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {filter === 'all'
            ? 'You don\'t have any upcoming gigs yet.'
            : `No ${filter} gigs found.`}
        </p>
        {filter !== 'all' && (
          <Button variant="secondary" onClick={() => setFilter('all')}>
            Show all gigs
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-lg font-semibold">
          {filteredEvents.length} {filteredEvents.length === 1 ? 'Gig' : 'Gigs'}
        </h3>
        <Select value={filter} onValueChange={(value) => setFilter(value as GigType | 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Gigs</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-auto">
        <div className="divide-y">
          {Object.entries(groupedEvents).map(([groupKey, groupEvents]) => (
            <div key={groupKey} className="py-4">
              {/* Group Header */}
              <div className="px-4 mb-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {formatGroupHeader(groupKey)}
                </h4>
              </div>

              {/* Group Events */}
              <div className="space-y-2 px-4">
                {groupEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md group",
                      "bg-card hover:bg-accent/50"
                    )}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Badge */}
                      <div className={cn("w-1 h-full rounded-full", getTypeColor(event.type))} />

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h5 className="font-semibold text-base truncate">
                            {event.title}
                          </h5>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0",
                            getTypeColor(event.type)
                          )}>
                            {getTypeName(event.type)}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {/* Time */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{formatTime(event.date)}</span>
                            {event.end_time && (
                              <span className="text-xs">
                                - {formatTime(event.end_time)}
                              </span>
                            )}
                          </div>

                          {/* Venue */}
                          {event.venue && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{event.venue}</span>
                            </div>
                          )}

                          {/* Notes */}
                          {event.notes && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{event.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete Button (Personal Gigs Only) */}
                      {showDelete && event.type === 'personal' && onEventDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => handleDelete(e, event.id, event.type)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600 hover:text-red-700" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 border-t text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-600"></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span>Personal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-600"></div>
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
};
