
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Pencil,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ShowCardProps {
  show: any;
  isFavorited: boolean;
  onToggleFavorite: (event: any) => void;
  onApply: (event: any) => void;
  onBuyTickets: (event: any) => void;
  onShowDetails: (event: any) => void;
  onGetDirections: (event: any) => void;
  onRecurringApply?: (event: any) => void;
  hasAppliedToEvent?: (eventId: string | null) => boolean;
  getApplicationStatus?: (eventId: string | null) => string | null;
  isApplying?: boolean;
  isOwner?: boolean;
  onEdit?: (show: any) => void;
}

export const ShowCard: React.FC<ShowCardProps> = ({
  show,
  isFavorited,
  onToggleFavorite,
  onApply,
  onBuyTickets,
  onShowDetails,
  onGetDirections,
  onRecurringApply,
  hasAppliedToEvent,
  getApplicationStatus,
  isApplying = false,
  isOwner = false,
  onEdit,
}) => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const supabaseEventId: string | null = show?.supabaseEventId ?? null;
  const hasInternalEvent = Boolean(supabaseEventId);

  const isIndustryUser = user && (hasRole('comedian') || hasRole('comedian_lite') || hasRole('admin'));
  const isConsumerUser = !isIndustryUser;
  const rawAvailableSpots = typeof show.available_spots === 'number'
    ? show.available_spots
    : (show.spots ?? 0) - (show.applied_spots ?? 0);
  const availableSpots = Math.max(rawAvailableSpots ?? 0, 0);
  const isShowFull = availableSpots <= 0 || show.status === 'closed' || show.is_full;
  const hasApplied = hasAppliedToEvent ? hasAppliedToEvent(supabaseEventId) : false;
  const applicationStatus = getApplicationStatus ? getApplicationStatus(supabaseEventId) : null;
  const isComedian = user && (hasRole('comedian') || hasRole('comedian_lite'));
  const isSoldOut = show.status === 'closed';

  // Scraped events (from session_complete) don't have internal application system
  // These are external Humanitix/Eventbrite events, so comedians can only buy tickets
  const isScrapedEvent = !show.promoter_id; // No promoter = scraped external event

  // Date formatting removed - dates shown in footer

  return (
    <Card
      className="group h-full flex flex-col overflow-hidden transition-all duration-200 hover:border-ring/50 hover:shadow-lg"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button')) {
          return;
        }
        if (hasInternalEvent) {
          navigate(`/events/${supabaseEventId}`);
          return;
        }
        if (show.ticket_url) {
          window.open(show.ticket_url, '_blank', 'noopener,noreferrer');
        }
      }}
    >
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden">
          {show.image_url ? (
            <img
              src={show.image_url}
              alt={show.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-secondary/30 via-primary/20 to-ring/30" />
          )}
        </div>

        {/* Date badge in top left */}
        {show.date && (
          <div className="absolute top-4 left-4 text-center">
            <div className="text-2xl font-bold text-white leading-none">
              {format(new Date(show.date), 'd')}
            </div>
            <div className="text-xs font-semibold text-white uppercase">
              {format(new Date(show.date), 'MMM')}
            </div>
          </div>
        )}

        {/* Edit button - shows on hover if owner */}
        {isOwner && onEdit && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-background/80 text-foreground shadow-sm hover:bg-background"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(show);
              }}
              aria-label="Edit show"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <CardContent className="flex-grow space-y-3 p-4">
        {/* Title and location moved from image overlay */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            {show.title}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{show.venue}{show.city ? ` • ${show.city}` : ''}</span>
          </div>
        </div>

        {applicationStatus && (
          <Badge variant="secondary" className="font-medium">
            {applicationStatus}
          </Badge>
        )}
      </CardContent>

      <CardFooter className="border-t border-border bg-muted/30 px-4 py-3">
        <div className="flex w-full items-center justify-between gap-3 text-sm">
          {/* Time moved to footer left */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {show.start_time ? formatStartTime(show.start_time) : 'Time TBA'}
            </span>
          </div>

          {isComedian && !isScrapedEvent ? (
            // Internal events: Show apply button for comedians
            <Button
              size="sm"
              variant={hasApplied ? 'ghost' : 'default'}
              onClick={(event) => {
                event.stopPropagation();
                if (hasApplied) {
                  // Toggle off - unapply
                  if (hasInternalEvent) {
                    navigate(`/events/${supabaseEventId}/unapply`);
                  } else {
                    onApply(show); // Reuse onApply, handler should toggle
                  }
                } else if (!isApplying) {
                  // Apply
                  if (!hasInternalEvent) {
                    onApply(show);
                    return;
                  }
                  navigate(`/events/${supabaseEventId}/apply`);
                }
              }}
              disabled={isApplying}
            >
              {isApplying ? 'Applying…' : hasApplied ? 'Applied' : 'Apply'}
            </Button>
          ) : (
            // Scraped events or non-comedians: Show ticket button
            <Button
              size="sm"
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                const ticketUrl = show.ticket_url || show.external_ticket_url;
                if (ticketUrl) {
                  window.open(ticketUrl, '_blank', 'noopener,noreferrer');
                } else {
                  onBuyTickets(show);
                }
              }}
              disabled={isSoldOut}
            >
              {isSoldOut ? 'Join waitlist' : 'Get tickets'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const formatStartTime = (timeString: string) => {
  if (!timeString) return '';
  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  if (Number.isNaN(hour)) return timeString;
  const minutes = minuteStr || '00';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
};
