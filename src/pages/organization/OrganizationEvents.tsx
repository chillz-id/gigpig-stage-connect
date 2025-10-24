import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationEvents, useOrganizationUpcomingEvents, useOrganizationPastEvents } from '@/hooks/organization/useOrganizationEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Calendar, MapPin, Users, Plus, ExternalLink } from 'lucide-react';

type EventFilter = 'all' | 'upcoming' | 'past';

export default function OrganizationEvents() {
  const { organization, orgId } = useOrganization();
  const [filter, setFilter] = useState<EventFilter>('upcoming');

  const { data: allEvents, isLoading: allLoading } = useOrganizationEvents();
  const { data: upcomingEvents, isLoading: upcomingLoading } = useOrganizationUpcomingEvents();
  const { data: pastEvents, isLoading: pastLoading } = useOrganizationPastEvents();

  const isLoading = filter === 'all' ? allLoading : filter === 'upcoming' ? upcomingLoading : pastLoading;
  const events = filter === 'all' ? allEvents : filter === 'upcoming' ? upcomingEvents : pastEvents;

  if (!organization) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="mt-1 text-gray-600">Manage {organization.organization_name}'s events</p>
        </div>
        <Link to={`/org/${orgId}/events/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as EventFilter)}>
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingEvents?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastEvents?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({allEvents?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : !events || events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium">No events found</h3>
                <p className="mb-4 text-sm text-gray-600">
                  {filter === 'upcoming'
                    ? "You don't have any upcoming events"
                    : filter === 'past'
                    ? "You don't have any past events"
                    : "You haven't created any events yet"}
                </p>
                {filter === 'upcoming' && (
                  <Link to={`/org/${orgId}/events/create`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Event
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const eventDate = new Date(event.event_date);
                const isUpcoming = eventDate > new Date();

                return (
                  <Card key={event.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                    {/* Event Image */}
                    {event.event_image && (
                      <div className="aspect-video w-full overflow-hidden bg-gray-100">
                        <img
                          src={event.event_image}
                          alt={event.event_name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <CardContent className="p-6">
                      {/* Status Badge */}
                      <div className="mb-3 flex items-center gap-2">
                        {event.is_published ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                            Published
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">
                            Draft
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800">
                            Upcoming
                          </span>
                        )}
                      </div>

                      {/* Event Name */}
                      <h3 className="mb-2 text-lg font-semibold line-clamp-2">
                        {event.event_name}
                      </h3>

                      {/* Event Date */}
                      <div className="mb-3 flex items-center text-sm text-gray-600">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>
                          {eventDate.toLocaleDateString('en-AU', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Venue */}
                      {event.venue && (
                        <div className="mb-3 flex items-start text-sm text-gray-600">
                          <MapPin className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                          <span className="line-clamp-1">{event.venue.name}</span>
                        </div>
                      )}

                      {/* Description */}
                      {event.event_description && (
                        <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                          {event.event_description}
                        </p>
                      )}

                      {/* Ticket Info */}
                      {event.ticket_price && (
                        <div className="mb-4 text-sm">
                          <span className="font-medium">
                            ${event.ticket_price.toFixed(2)}
                          </span>
                          {event.ticket_link && (
                            <span className="ml-2 text-gray-600">
                              • Tickets available
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link to={`/events/${event.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                        {event.ticket_link && (
                          <a
                            href={event.ticket_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button size="sm" className="w-full">
                              Get Tickets
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
