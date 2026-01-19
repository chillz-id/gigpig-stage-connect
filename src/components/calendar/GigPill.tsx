import React from 'react';
import { Clock, MapPin, Trash2, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type GigType = 'confirmed' | 'personal' | 'pending';

export interface GigPillEvent {
  id: string;
  title: string;
  venue?: string | null;
  date: string;
  end_time?: string | null;
  type: GigType;
  notes?: string | null;
  is_recurring?: boolean;
  parent_gig_id?: string | null;
}

interface GigPillProps {
  event: GigPillEvent;
  onDelete?: (eventId: string, type: GigType) => void;
  onClick?: (event: GigPillEvent) => void;
  showDelete?: boolean;
}

/**
 * GigPill Component
 *
 * Displays a single gig as a compact pill within a calendar cell.
 * Color-coded by type:
 * - Green: Confirmed gigs from platform bookings
 * - Blue: Personal gigs (manually added or Google imported)
 * - Orange: Pending gigs awaiting confirmation
 */
function GigPillComponent({ event, onDelete, onClick, showDelete = false }: GigPillProps) {
  // Format time from date string
  const time = React.useMemo(() => {
    if (!event.date) return 'TBA';

    // Parse the date - expects local time format like "2025-12-29T19:00:00"
    // ProfileCalendarView combines date from event_date with local start_time
    const date = new Date(event.date);
    if (isNaN(date.getTime())) return 'TBA';

    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // Convert to 12-hour format
    if (hours === 0) {
      return `12:${minutes}am`;
    } else if (hours < 12) {
      return `${hours}:${minutes}am`;
    } else if (hours === 12) {
      return `12:${minutes}pm`;
    } else {
      return `${hours - 12}:${minutes}pm`;
    }
  }, [event.date]);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick(event);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(event.id, event.type);
    }
  };

  // Color coding based on gig type
  const pillClasses = cn(
    "text-xs p-1.5 rounded transition-all cursor-pointer block mb-1 relative group",
    "hover:shadow-md",
    event.type === 'confirmed' && "bg-green-600/50 hover:bg-green-600/70",
    event.type === 'personal' && "bg-blue-600/50 hover:bg-blue-600/70",
    event.type === 'pending' && "bg-orange-600/50 hover:bg-orange-600/70"
  );

  return (
    <div className={pillClasses} onClick={handleClick}>
      <div className="flex items-start gap-1">
        {/* Event details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-white truncate leading-tight">
            <Clock className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="font-medium">{time}</span>
            {/* Recurring indicator */}
            {event.is_recurring && !event.parent_gig_id && (
              <Repeat className="h-2.5 w-2.5 flex-shrink-0 text-purple-300" title="Recurring event" />
            )}
            {/* Instance indicator (child of recurring event) */}
            {event.parent_gig_id && (
              <Repeat className="h-2.5 w-2.5 flex-shrink-0 text-purple-400/60" title="Part of recurring series" />
            )}
          </div>
          <div className="text-white/90 truncate leading-tight font-medium">
            {event.title}
          </div>
          {event.venue && (
            <div className="flex items-center gap-1 text-white/70 truncate text-[10px] leading-tight">
              <MapPin className="h-2 w-2 flex-shrink-0" />
              <span>{event.venue}</span>
            </div>
          )}
        </div>

        {/* Delete button for personal gigs (shown on hover) */}
        {showDelete && event.type === 'personal' && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3 text-white/70 hover:text-red-400" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const GigPill = React.memo(GigPillComponent, (prevProps, nextProps) => {
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.event.type === nextProps.event.type &&
    prevProps.showDelete === nextProps.showDelete
  );
});
