import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAvailabilitySelection } from '@/hooks/useAvailabilitySelection';
import { formatEventTime } from '@/utils/formatEventTime';
import { cn } from '@/lib/utils';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface EventHtx {
  id: string;
  name: string | null;
  start_date: string | null;
  venue_name: string | null;
  source_id: string | null;
  created_at: string | null;
}

interface QuickSignUpCardProps {
  event: EventHtx;
  userId: string;
}

/**
 * QuickSignUpCard - A card component for displaying events with availability selection
 * Allows comedians to quickly indicate their availability for upcoming shows
 */
export function QuickSignUpCard({ event, userId }: QuickSignUpCardProps) {
  const { selectedEvents, toggleEvent, isSaving, lastSaved } = useAvailabilitySelection(userId);

  const isSelected = selectedEvents.has(event.id);

  // Format date: "Fri, Nov 15"
  const formattedDate = event.start_date
    ? format(new Date(event.start_date), 'EEE, MMM d')
    : 'TBC';

  // Format time: "8:00pm"
  const formattedTime = formatEventTime(event.start_date);

  // Format saved time: "3:45pm"
  const formatSavedTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  };

  return (
    <Card
      data-testid="quick-signup-card"
      className={cn(
        'border-2 transition-all duration-200',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-border/60'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <div className="pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleEvent(event.id)}
              disabled={isSaving}
              aria-label={`Select availability for ${event.name || 'event'}`}
              className="h-5 w-5"
            />
          </div>

          {/* Event Details */}
          <div className="flex-1 min-w-0">
            {/* Event Name */}
            <h3 className="font-semibold text-lg mb-2 text-foreground">
              {event.name || 'Untitled Event'}
            </h3>

            {/* Date & Time */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Venue */}
            {event.venue_name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <MapPin className="h-4 w-4" />
                <span>{event.venue_name}</span>
              </div>
            )}

            {/* Save Status */}
            {(isSaving || lastSaved) && (
              <div className="flex items-center gap-2 mt-2">
                {isSaving && (
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </span>
                )}
                {!isSaving && lastSaved && (
                  <span className="text-xs text-muted-foreground">
                    Saved at {formatSavedTime(lastSaved)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
