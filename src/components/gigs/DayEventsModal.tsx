import React from 'react';
import { format } from 'date-fns';
import { X, Clock, MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatEventTime } from '@/utils/formatEventTime';

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  venue: string | null;
}

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: Event[];
  isComedian: boolean;
  selectedEventIds: Set<string>;
  onToggleAvailability?: (eventId: string) => void;
}

/**
 * DayEventsModal Component
 *
 * Full-page modal that displays all events for a selected day.
 * - Shows event list with time, title, venue
 * - Comedians can mark availability with checkboxes
 * - Mobile-first design
 */
export function DayEventsModal({
  isOpen,
  onClose,
  date,
  events,
  isComedian,
  selectedEventIds,
  onToggleAvailability,
}: DayEventsModalProps) {
  const { theme } = useTheme();

  if (!isOpen || !date) return null;

  const handleToggle = (eventId: string) => {
    if (onToggleAvailability) {
      onToggleAvailability(eventId);
    }
  };

  const handleSelectAll = () => {
    if (!onToggleAvailability) return;
    events.forEach(event => {
      if (!selectedEventIds.has(event.id)) {
        onToggleAvailability(event.id);
      }
    });
  };

  const allSelected = events.every(event => selectedEventIds.has(event.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className={cn(
        "fixed inset-x-0 bottom-0 max-h-[90vh] rounded-t-3xl overflow-hidden",
        "bg-white animate-in slide-in-from-bottom duration-300"
      )}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {format(date, 'EEEE, MMMM d')}
            </h2>
            <p className="text-sm text-gray-500">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Select All (for comedians) */}
        {isComedian && events.length > 1 && onToggleAvailability && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <Button
              onClick={handleSelectAll}
              variant="secondary"
              size="sm"
              className={cn(
                "w-full gap-2",
                allSelected && "bg-green-50 border-green-500 text-green-700"
              )}
            >
              {allSelected ? (
                <>
                  <Check className="w-4 h-4" />
                  All Marked Available
                </>
              ) : (
                'Mark All Available'
              )}
            </Button>
          </div>
        )}

        {/* Events List */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-4 py-3 space-y-3">
          {events.map(event => {
            const isSelected = selectedEventIds.has(event.id);
            const eventTime = formatEventTime(event.event_date);

            return (
              <div
                key={event.id}
                onClick={() => isComedian && handleToggle(event.id)}
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  isComedian && "cursor-pointer active:scale-[0.98]",
                  isSelected
                    ? "bg-green-50 border-green-500"
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Time */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{eventTime}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {event.title}
                    </h3>

                    {/* Venue */}
                    {event.venue && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    )}
                  </div>

                  {/* Availability checkbox (for comedians) */}
                  {isComedian && onToggleAvailability && (
                    <div
                      className="flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(event.id)}
                        className={cn(
                          "w-6 h-6",
                          isSelected && "bg-green-600 border-green-600"
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Selection status badge */}
                {isComedian && isSelected && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Marked as Available
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Safe Area */}
        <div className="h-6 bg-white" />
      </div>
    </div>
  );
}
