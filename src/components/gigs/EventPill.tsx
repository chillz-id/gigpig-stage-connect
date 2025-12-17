import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventPillProps {
  event: {
    id: string;
    title: string;
    start_time: string | null;
    venue: string | null;
    external_ticket_url: string | null;
  };
  isComedian: boolean;
  isSelected?: boolean;
  onToggle?: (eventId: string) => void;
  /** Compact mode for mobile - shows less detail */
  compact?: boolean;
}

/**
 * EventPill Component
 *
 * Displays a single event as a compact pill within a calendar cell.
 * For comedians: Shows checkbox to mark availability
 * For others: Shows clickable link to ticket URL
 */
function EventPillComponent({ event, isComedian, isSelected = false, onToggle, compact = false }: EventPillProps) {
  // Format time or show TBA if start_time is null/invalid
  // start_time is in format "YYYY-MM-DDTHH:MM:SS" (local time, not UTC)
  // Extract time portion directly to avoid timezone conversion issues
  const time = React.useMemo(() => {
    if (!event.start_time) return 'TBA';

    // Extract time portion from ISO string (format: "YYYY-MM-DDTHH:MM:SS")
    const timeMatch = event.start_time.match(/T(\d{2}):(\d{2})/);
    if (!timeMatch) return 'TBA';

    const hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2];

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
  }, [event.start_time]);

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    if (checked !== 'indeterminate' && onToggle) {
      onToggle(event.id);
    }
  };

  const handlePillClick = (e: React.MouseEvent) => {
    // If comedian mode and we have a toggle handler, toggle on pill click (not just checkbox)
    if (isComedian && onToggle) {
      e.preventDefault();
      onToggle(event.id);
    } else if (event.external_ticket_url) {
      // Non-comedian: open ticket URL
      window.open(event.external_ticket_url, '_blank', 'noopener,noreferrer');
    }
  };

  const pillClasses = cn(
    "rounded transition-all cursor-pointer block",
    compact ? "text-[10px] p-1 mb-0.5" : "text-xs p-1.5 mb-1",
    "hover:shadow-md",
    isComedian ? "bg-purple-600/50 hover:bg-purple-600/70" : "bg-red-600/50 hover:bg-red-600/70",
    isSelected && "ring-2 ring-green-500 bg-green-600/50 hover:bg-green-600/70"
  );

  return (
    <div className={pillClasses} onClick={handlePillClick}>
      <div className={cn("flex items-start", compact ? "gap-0.5" : "gap-1")}>
        {/* Checkbox for comedians */}
        {isComedian && onToggle && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()} // Prevent pill click when clicking checkbox
            className={cn(
              "flex-shrink-0",
              compact ? "h-2.5 w-2.5 mt-px" : "h-3 w-3 mt-0.5"
            )}
          />
        )}

        {/* Event details */}
        <div className="flex-1 min-w-0">
          {/* In compact mode, show time and title on same line */}
          {compact ? (
            <div className="font-medium text-white truncate leading-tight">
              {time} - {event.title}
            </div>
          ) : (
            <>
              <div className="font-medium text-white truncate leading-tight">
                {time}
              </div>
              <div className="text-white/90 truncate leading-tight">
                {event.title}
              </div>
              {event.venue && (
                <div className="text-white/70 truncate text-[10px] leading-tight">
                  {event.venue}
                </div>
              )}
            </>
          )}
        </div>

        {/* External link icon for non-comedians - hide in compact mode */}
        {!compact && !isComedian && event.external_ticket_url && (
          <ExternalLink className="h-3 w-3 text-white/70 flex-shrink-0 mt-0.5" />
        )}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when only other events change
export const EventPill = React.memo(EventPillComponent, (prevProps, nextProps) => {
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isComedian === nextProps.isComedian &&
    prevProps.compact === nextProps.compact
  );
});
