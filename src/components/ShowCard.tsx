
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  Heart,
  MapPin,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
}) => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const supabaseEventId: string | null = show?.supabaseEventId ?? null;
  const hasInternalEvent = Boolean(supabaseEventId);

  const isIndustryUser = user && (hasRole('comedian') || hasRole('comedian_lite') || hasRole('promoter') || hasRole('admin'));
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
      className="group h-full overflow-hidden transition-all duration-200 hover:border-ring/50 hover:shadow-lg"
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

        <div className="absolute inset-x-0 top-0 flex items-start justify-end p-4">
          <Button
            size="icon"
            variant="secondary"
            className={cn(
              'rounded-full bg-background/80 text-foreground shadow-sm hover:bg-background',
              isFavorited && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(show);
            }}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={cn('h-4 w-4', isFavorited && 'fill-current')} />
          </Button>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold leading-tight text-foreground">
              {show.title}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{show.venue}{show.city ? ` • ${show.city}` : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {show.start_time ? formatStartTime(show.start_time) : 'Time TBA'}
          </span>
        </div>

        {show.type && (
          <Badge variant="outline" className="uppercase tracking-wide">
            {show.type}
          </Badge>
        )}

        {applicationStatus && (
          <Badge variant="secondary" className="font-medium">
            {applicationStatus}
          </Badge>
        )}
      </CardContent>

      <CardFooter className="border-t border-border bg-muted/30 px-4 py-3">
        <div className="flex w-full items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>
              {isScrapedEvent
                ? (show.is_past ? 'Past Event' : 'Upcoming')
                : (show.session_status ?? show.status ?? 'Scheduled')}
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
