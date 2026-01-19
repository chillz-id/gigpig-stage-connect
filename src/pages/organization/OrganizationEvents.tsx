import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrganizationEvents, useOrganizationUpcomingEvents, useOrganizationPastEvents, useOrganizationDraftEvents, type OrganizationEvent } from '@/hooks/organization/useOrganizationEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Calendar, MapPin, Plus, LayoutGrid, List, CalendarDays, X, Clock, Eye, ChevronLeft, ChevronRight, Layers, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

/**
 * Strip HTML tags from text for plain-text previews
 */
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

type EventFilter = 'all' | 'upcoming' | 'past' | 'drafts';
type ViewMode = 'cards' | 'list' | 'calendar';

export default function OrganizationEvents() {
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<EventFilter>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('org-events-view-mode');
    return (saved as ViewMode) || 'list';
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Persist view mode preference
  useEffect(() => {
    localStorage.setItem('org-events-view-mode', viewMode);
  }, [viewMode]);

  // Use slug-based URLs for navigation
  const orgSlug = organization?.url_slug;
  const orgId = organization?.id;

  // Navigate to full-page event management
  const handleOpenEventDetails = (event: OrganizationEvent) => {
    // For native events, go directly to manage page
    if (event.source === 'native') {
      navigate(`/events/${event.id}/manage`);
    } else {
      // For synced events, use navigator to handle linking (pass orgId for creating linked events)
      navigate(`/events/navigate/${event.source}/${event.canonical_source_id || event.id}?orgId=${orgId}`);
    }
  };

  const { data: allEvents, isLoading: allLoading } = useOrganizationEvents();
  const { data: upcomingEvents, isLoading: upcomingLoading } = useOrganizationUpcomingEvents();
  const { data: pastEvents, isLoading: pastLoading } = useOrganizationPastEvents();
  const { data: draftEvents, isLoading: draftsLoading } = useOrganizationDraftEvents();

  // Filter out drafts from allEvents for the "All" tab (drafts have their own tab)
  const allPublishedEvents = useMemo(() => {
    return allEvents?.filter(e => e.is_published) || [];
  }, [allEvents]);

  const isLoading = filter === 'all' ? allLoading : filter === 'upcoming' ? upcomingLoading : filter === 'past' ? pastLoading : draftsLoading;
  const baseEvents = filter === 'all' ? allPublishedEvents : filter === 'upcoming' ? upcomingEvents : filter === 'past' ? pastEvents : draftEvents;

  // Filter events by selected date
  const events = useMemo(() => {
    if (!baseEvents) return [];
    if (!selectedDate) return baseEvents;

    return baseEvents.filter((event) => {
      const eventDate = new Date(event.event_date);
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate()
      );
    });
  }, [baseEvents, selectedDate]);

  // Group events by date for calendar view
  const eventsByDate = useMemo(() => {
    if (!events) return {};
    return events.reduce((acc, event) => {
      const dateKey = new Date(event.event_date).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {} as Record<string, typeof events>);
  }, [events]);

  // Group events by month for list view
  const eventsByMonth = useMemo(() => {
    if (!events) return {};
    return events.reduce((acc, event) => {
      const date = new Date(event.event_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(event);
      return acc;
    }, {} as Record<string, typeof events>);
  }, [events]);

  // Generate calendar grid for current month
  const calendarGrid = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentWeek.push(new Date(year, month, day));
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add empty cells for remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [calendarMonth]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    if (!events) return [];
    return events.filter((event) => {
      const eventDate = new Date(event.event_date);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  if (!organization) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
      </div>
    );
  }

  // Render event card
  const renderEventCard = (event: typeof events[number]) => {
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
          {/* Status Badges */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
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
              {stripHtml(event.event_description)}
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
            <Button
              className="professional-button w-full flex-1"
              size="sm"
              onClick={() => handleOpenEventDetails(event)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Event Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render list item
  const renderListItem = (event: typeof events[number]) => {
    const eventDate = new Date(event.event_date);

    return (
      <Card
        key={event.id}
        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handleOpenEventDetails(event)}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Date Badge */}
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg flex-shrink-0 bg-purple-100 dark:bg-purple-900">
            <span className="text-xs font-medium uppercase text-purple-600 dark:text-purple-300">
              {eventDate.toLocaleDateString('en-AU', { weekday: 'short' })}
            </span>
            <span className="text-xl font-bold text-purple-700 dark:text-purple-200">
              {eventDate.getDate()}
            </span>
          </div>

          {/* Thumbnail */}
          {event.event_image && (
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 hidden sm:block">
              <img
                src={event.event_image}
                alt={event.event_name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{event.event_name}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              {event.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.venue.name}
                </span>
              )}
              {event.start_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {(() => {
                    const [hours, minutes] = event.start_time.split(':').map(Number);
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const displayHour = hours % 12 || 12;
                    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
                  })()}
                </span>
              )}
            </div>
          </div>

          {/* Chevron indicator */}
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="mt-1 text-gray-600">Manage {organization.organization_name}'s events</p>
        </div>
        <div className="flex gap-2">
          <Link to="/recurring">
            <Button variant="secondary">
              <Repeat className="mr-2 h-4 w-4" />
              Recurring
            </Button>
          </Link>
          <Link to={`/org/${orgSlug}/events/tours`}>
            <Button variant="secondary">
              <Layers className="mr-2 h-4 w-4" />
              Tours
            </Button>
          </Link>
          <Link to={`/org/${orgSlug}/events/create`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Time Filter Tabs */}
        <Tabs value={filter} onValueChange={(value) => setFilter(value as EventFilter)} className="w-auto">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingEvents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastEvents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="drafts">
              Drafts ({draftEvents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({allPublishedEvents?.length || 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Date Picker & View Toggle */}
        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="sm" className={cn(selectedDate && 'text-purple-600')}>
                <CalendarDays className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Pick date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear date filter */}
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(undefined)}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* View Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
          >
            <ToggleGroupItem value="cards" aria-label="Card view" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Cards</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view" className="gap-1.5">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendar view" className="gap-1.5">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Results Count */}
      {!isLoading && events && events.length > 0 && (
        <p className="text-sm text-gray-600">
          {events.length} {events.length === 1 ? 'event' : 'events'} found
          {selectedDate && ` for ${format(selectedDate, 'MMMM d, yyyy')}`}
        </p>
      )}

      {/* Content */}
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
              {selectedDate
                ? `No events on ${format(selectedDate, 'MMMM d, yyyy')}`
                : filter === 'upcoming'
                ? "You don't have any upcoming events"
                : filter === 'past'
                ? "You don't have any past events"
                : filter === 'drafts'
                ? "You don't have any draft events"
                : "You haven't created any events yet"}
            </p>
            {filter === 'upcoming' && !selectedDate && (
              <Link to={`/org/${orgSlug}/events/create`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Event
                </Button>
              </Link>
            )}
            {selectedDate && (
              <Button variant="secondary" onClick={() => setSelectedDate(undefined)}>
                Clear date filter
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map(renderEventCard)}
        </div>
      ) : viewMode === 'list' ? (
        /* List View - grouped by month */
        <div className="space-y-6">
          {Object.entries(eventsByMonth).map(([monthKey, monthEvents]) => {
            const [year, month] = monthKey.split('-').map(Number);
            const monthDate = new Date(year, month, 1);
            const monthName = monthDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });

            return (
              <div key={monthKey}>
                <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border">
                  {monthName}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({monthEvents.length} {monthEvents.length === 1 ? 'event' : 'events'})
                  </span>
                </h2>
                <div className="space-y-3">
                  {monthEvents.map(renderListItem)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Calendar View - Month grid */
        <Card>
          <CardContent className="p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">
                {calendarMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.flat().map((date, index) => {
                const isToday = date?.toDateString() === new Date().toDateString();
                const dayEvents = date ? getEventsForDate(date) : [];

                return (
                  <div
                    key={index}
                    className={cn(
                      'min-h-[100px] p-1 border rounded-md',
                      date ? 'bg-background' : 'bg-muted/30',
                      isToday && 'border-purple-500 border-2'
                    )}
                  >
                    {date && (
                      <>
                        <div className={cn(
                          'text-sm font-medium mb-1 text-center',
                          isToday ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'
                        )}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 truncate cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-900"
                              onClick={() => handleOpenEventDetails(event)}
                              title={event.event_name}
                            >
                              {event.event_name}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
