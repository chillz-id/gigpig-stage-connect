import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  useComedianEvents,
  useComedianUpcomingEvents,
  useComedianPastEvents,
  useComedianDraftEvents,
  type ComedianEvent,
} from '@/hooks/useComedianEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Calendar,
  MapPin,
  Plus,
  LayoutGrid,
  List,
  CalendarDays,
  X,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
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

export default function ComedianEvents() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<EventFilter>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('comedian-events-view-mode');
    return (saved as ViewMode) || 'list';
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Persist view mode preference
  useEffect(() => {
    localStorage.setItem('comedian-events-view-mode', viewMode);
  }, [viewMode]);

  // Navigate to event management page
  const handleOpenEventDetails = (event: ComedianEvent) => {
    navigate(`/events/${event.id}/manage`);
  };

  const { data: allEvents, isLoading: allLoading } = useComedianEvents();
  const { data: upcomingEvents, isLoading: upcomingLoading } = useComedianUpcomingEvents();
  const { data: pastEvents, isLoading: pastLoading } = useComedianPastEvents();
  const { data: draftEvents, isLoading: draftsLoading } = useComedianDraftEvents();

  // Filter out drafts from allEvents for the "All" tab
  const allPublishedEvents = useMemo(() => {
    return allEvents?.filter((e) => e.is_published) || [];
  }, [allEvents]);

  const isLoading =
    filter === 'all'
      ? allLoading
      : filter === 'upcoming'
        ? upcomingLoading
        : filter === 'past'
          ? pastLoading
          : draftsLoading;
  const baseEvents =
    filter === 'all'
      ? allPublishedEvents
      : filter === 'upcoming'
        ? upcomingEvents
        : filter === 'past'
          ? pastEvents
          : draftEvents;

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

  // Group events by month for list view
  const eventsByMonth = useMemo(() => {
    if (!events) return {};
    return events.reduce(
      (acc, event) => {
        const date = new Date(event.event_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push(event);
        return acc;
      },
      {} as Record<string, typeof events>
    );
  }, [events]);

  // Generate calendar grid for current month
  const calendarGrid = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();

    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentWeek.push(new Date(year, month, day));
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

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

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Please log in to view your events</h1>
      </div>
    );
  }

  // Render event card
  const renderEventCard = (event: ComedianEvent) => {
    const eventDate = new Date(event.event_date);
    const isUpcoming = eventDate > new Date();

    return (
      <Card key={event.id} className="overflow-hidden transition-shadow hover:shadow-lg">
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
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {event.role === 'owner' ? (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                Owner
              </span>
            ) : (
              <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">
                Partner
              </span>
            )}
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

          <h3 className="mb-2 line-clamp-2 text-lg font-semibold">{event.event_name}</h3>

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

          {event.venue && (
            <div className="mb-3 flex items-start text-sm text-gray-600">
              <MapPin className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{event.venue.name}</span>
            </div>
          )}

          {event.event_description && (
            <p className="mb-4 line-clamp-2 text-sm text-gray-600">
              {stripHtml(event.event_description)}
            </p>
          )}

          {event.ticket_price && (
            <div className="mb-4 text-sm">
              <span className="font-medium">${event.ticket_price.toFixed(2)}</span>
              {event.ticket_link && <span className="ml-2 text-gray-600">• Tickets available</span>}
            </div>
          )}

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
  const renderListItem = (event: ComedianEvent) => {
    const eventDate = new Date(event.event_date);

    return (
      <Card
        key={event.id}
        className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
        onClick={() => handleOpenEventDetails(event)}
      >
        <div className="flex items-center gap-4 p-4">
          <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
            <span className="text-xs font-medium uppercase text-purple-600 dark:text-purple-300">
              {eventDate.toLocaleDateString('en-AU', { weekday: 'short' })}
            </span>
            <span className="text-xl font-bold text-purple-700 dark:text-purple-200">
              {eventDate.getDate()}
            </span>
          </div>

          {event.event_image && (
            <div className="hidden h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg sm:block">
              <img
                src={event.event_image}
                alt={event.event_name}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{event.event_name}</h3>
              {event.role === 'partner' && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
                  Partner
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              {event.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.venue.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {eventDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Events</h1>
          <p className="mt-1 text-gray-600">
            Manage your events{profile?.stage_name ? ` as ${profile.stage_name}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/tours">
            <Button variant="secondary">
              <Layers className="mr-2 h-4 w-4" />
              Tours
            </Button>
          </Link>
          <Link to="/dashboard/gigs/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as EventFilter)}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcomingEvents?.length || 0})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastEvents?.length || 0})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({draftEvents?.length || 0})</TabsTrigger>
            <TabsTrigger value="all">All ({allPublishedEvents?.length || 0})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={cn(selectedDate && 'text-purple-600')}
              >
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
              <Link to="/dashboard/gigs/add">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{events.map(renderEventCard)}</div>
      ) : viewMode === 'list' ? (
        <div className="space-y-6">
          {Object.entries(eventsByMonth).map(([monthKey, monthEvents]) => {
            const [year, month] = monthKey.split('-').map(Number);
            const monthDate = new Date(year, month, 1);
            const monthName = monthDate.toLocaleDateString('en-AU', {
              month: 'long',
              year: 'numeric',
            });

            return (
              <div key={monthKey}>
                <h2 className="mb-3 border-b border-border pb-2 text-lg font-semibold text-foreground">
                  {monthName}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({monthEvents.length} {monthEvents.length === 1 ? 'event' : 'events'})
                  </span>
                </h2>
                <div className="space-y-3">{monthEvents.map(renderListItem)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                  )
                }
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">
                {calendarMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                  )
                }
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.flat().map((date, index) => {
                const isToday = date?.toDateString() === new Date().toDateString();
                const dayEvents = date ? getEventsForDate(date) : [];

                return (
                  <div
                    key={index}
                    className={cn(
                      'min-h-[100px] rounded-md border p-1',
                      date ? 'bg-background' : 'bg-muted/30',
                      isToday && 'border-2 border-purple-500'
                    )}
                  >
                    {date && (
                      <>
                        <div
                          className={cn(
                            'mb-1 text-center text-sm font-medium',
                            isToday
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-muted-foreground'
                          )}
                        >
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="cursor-pointer truncate rounded bg-purple-100 p-1 text-xs text-purple-800 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-200 dark:hover:bg-purple-900"
                              onClick={() => handleOpenEventDetails(event)}
                              title={event.event_name}
                            >
                              {event.event_name}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-center text-xs text-muted-foreground">
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
