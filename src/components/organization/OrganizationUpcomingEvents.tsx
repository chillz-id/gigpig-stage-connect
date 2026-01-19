import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Plus, MapPin, Ticket, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationUpcomingEvents, type OrganizationEvent } from '@/hooks/organization/useOrganizationEvents';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface OrganizationUpcomingEventsProps {
  organizationId: string;
  isOwnProfile?: boolean;
  limit?: number;
}

const OrganizationUpcomingEvents: React.FC<OrganizationUpcomingEventsProps> = ({
  organizationId,
  isOwnProfile = false,
  limit = 5
}) => {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const { data: events, isLoading, error } = useOrganizationUpcomingEvents();

  const displayEvents = events?.slice(0, limit) || [];
  const orgSlug = organization?.url_slug;

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getSourceBadgeColor = (source: OrganizationEvent['source']) => {
    switch (source) {
      case 'humanitix':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'eventbrite':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  /**
   * Get ownership badge for native events
   * - Shows "Created by You" if promoter_id matches current user
   * - Only applicable for native events (synced events don't have promoter_id)
   */
  const getOwnershipBadge = (event: OrganizationEvent) => {
    // Only show ownership badge for native events with promoter info
    if (event.source !== 'native' || !event.promoter_id || !user?.id) {
      return null;
    }

    // Check if current user created this event
    if (event.promoter_id === user.id) {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
          Created by You
        </Badge>
      );
    }

    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-2xl">
            <Calendar className="w-6 h-6 text-purple-400" />
            Upcoming Events
          </CardTitle>
          <div className="flex items-center gap-2">
            {displayEvents.length > 0 && orgSlug && (
              <Link to={`/org/${orgSlug}/events`}>
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  View All
                </Button>
              </Link>
            )}
            {isOwnProfile && orgSlug && (
              <Link to={`/org/${orgSlug}/events/create`}>
                <Button className="professional-button" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Event
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400">Failed to load events</p>
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">No Upcoming Events</h3>
            <p className="text-gray-300">
              {isOwnProfile
                ? 'Create your first event to get started!'
                : 'Check back soon for upcoming shows.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayEvents.map((event) => (
              <a
                key={event.id}
                href={event.source === 'native' ? `/events/${event.id}` : event.ticket_link || '#'}
                target={event.source !== 'native' ? '_blank' : undefined}
                rel={event.source !== 'native' ? 'noopener noreferrer' : undefined}
                className="block rounded-lg border border-slate-600 bg-slate-800/50 p-4 transition-all hover:bg-slate-700/50 hover:border-purple-500/50"
              >
                <div className="flex items-start gap-4">
                  {/* Event Image or Date Box */}
                  {event.event_image ? (
                    <img
                      src={event.event_image}
                      alt={event.event_name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-white">
                        {new Date(event.event_date).getDate()}
                      </span>
                      <span className="text-xs text-white/80 uppercase">
                        {new Date(event.event_date).toLocaleDateString('en-AU', { month: 'short' })}
                      </span>
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-white truncate">
                        {event.event_name}
                      </h4>
                      {event.source !== 'native' && (
                        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>

                    <p className="text-sm text-gray-300 mt-1">
                      {formatEventDate(event.event_date)}
                    </p>

                    {event.venue && (
                      <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.venue.name}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={getSourceBadgeColor(event.source)}>
                        {event.source === 'native' ? 'Native' : event.source}
                      </Badge>

                      {getOwnershipBadge(event)}

                      {event.total_ticket_count !== null && event.total_ticket_count !== undefined && event.total_ticket_count > 0 && (
                        <Badge variant="secondary" className="border-green-500/50 text-green-400">
                          <Ticket className="w-3 h-3 mr-1" />
                          {event.total_ticket_count} sold
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationUpcomingEvents;
