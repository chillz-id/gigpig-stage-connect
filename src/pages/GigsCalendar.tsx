import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Loader2, MapPin, Search, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useAustralianSessionCalendar } from '@/hooks/useAustralianSessionCalendar';
import type { BrowseEvent } from '@/services/event/event-browse-service';
import LoadingSpinner from '@/components/LoadingSpinner';

const monthLabel = (date: Date) => format(date, 'MMMM yyyy');

const formatEventTime = (value: string | null | undefined) => {
  if (!value) return 'TBC';
  try {
    const parsed = parseISO(value);
    return format(parsed, 'h:mmaaa');
  } catch (error) {
    return 'TBC';
  }
};

const getDayKey = (date: Date) => format(date, 'yyyy-MM-dd');

/**
 * Gigs Calendar Page - Browse upcoming comedy gigs in calendar view
 * For comedians to find gig opportunities in a monthly calendar layout
 */
const GigsCalendar: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  // Get month from URL params
  const searchParams = new URLSearchParams(location.search);
  const monthParam = searchParams.get('month');
  const initialDate = monthParam ? new Date(monthParam) : new Date();

  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(initialDate));
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch events for current month + next month (2 months total for better performance)
  const fetchStart = startOfMonth(currentMonth);
  const fetchEnd = endOfMonth(addMonths(currentMonth, 1));
  const { data: events = [], isLoading } = useAustralianSessionCalendar(fetchStart, fetchEnd, 'Sydney');

  // Calendar grid (always starts on Monday)
  const calendarRange = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, BrowseEvent[]>();

    // Filter by search term
    const filteredEvents = events.filter(event => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        event.title?.toLowerCase().includes(term) ||
        event.venue?.toLowerCase().includes(term) ||
        event.city?.toLowerCase().includes(term)
      );
    });

    filteredEvents.forEach((event) => {
      const dateKey = event.event_date?.slice(0, 10);
      if (!dateKey) return;
      const existing = map.get(dateKey) ?? [];
      existing.push(event);
      map.set(dateKey, existing);
    });
    return map;
  }, [events, searchTerm]);

  const handlePrevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    setCurrentMonth(prev);

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('month', format(prev, 'yyyy-MM'));
    window.history.replaceState({}, '', url.toString());
  };

  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1);
    setCurrentMonth(next);

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('month', format(next, 'yyyy-MM'));
    window.history.replaceState({}, '', url.toString());
  };

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  if (isLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", getBackgroundStyles())}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Find Gigs</h1>
              <p className="text-white/80">
                Upcoming comedy shows in Sydney
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by show name, venue, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
        </div>

        {/* Calendar */}
        <Card className="bg-white/[0.08] backdrop-blur-md border-white/[0.20]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="text-white text-xl">
                {monthLabel(currentMonth)}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="text-white hover:bg-white/10"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-white/60 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarRange.map((day) => {
                const dayKey = getDayKey(day);
                const dayEvents = eventsByDay.get(dayKey) ?? [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "min-h-[100px] p-2 rounded-lg border transition-colors",
                      isCurrentMonth
                        ? "bg-white/5 border-white/10"
                        : "bg-white/[0.02] border-white/5",
                      isCurrentDay && "ring-2 ring-purple-400",
                      dayEvents.length > 0 && "cursor-pointer hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      isCurrentMonth ? "text-white" : "text-white/40",
                      isCurrentDay && "text-purple-400"
                    )}>
                      {format(day, 'd')}
                    </div>

                    {/* Event Pills */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <a
                          key={event.id}
                          href={event.ticket_url ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "block px-2 py-1 rounded text-xs truncate transition-colors",
                            theme === 'pleasure'
                              ? "bg-purple-500/30 hover:bg-purple-500/50 text-purple-100"
                              : "bg-red-600/30 hover:bg-red-600/50 text-red-100"
                          )}
                          title={`${event.title} - ${formatEventTime(event.event_date)}`}
                        >
                          {formatEventTime(event.event_date)} {event.title}
                        </a>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-white/60 px-2">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Event List Below Calendar */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            All Events This Month ({events.filter(e => {
              const dateKey = e.event_date?.slice(0, 10);
              return dateKey && calendarRange.some(day => getDayKey(day) === dateKey);
            }).length})
          </h2>

          {events.length === 0 ? (
            <Card className="bg-white/[0.08] backdrop-blur-md border-white/[0.20]">
              <CardContent className="p-8 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-white/40" />
                <h3 className="text-xl font-bold text-white mb-2">No Events Found</h3>
                <p className="text-white/60">
                  No upcoming comedy shows found for this month. Check back later!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events
                .filter(e => {
                  const dateKey = e.event_date?.slice(0, 10);
                  if (!dateKey) return false;
                  return calendarRange.some(day => getDayKey(day) === dateKey);
                })
                .sort((a, b) => {
                  const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
                  const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
                  return dateA - dateB;
                })
                .map((event) => (
                  <Card key={event.id} className="bg-white/[0.08] backdrop-blur-md border-white/[0.20] hover:bg-white/10 transition-colors overflow-hidden">
                    {event.banner_url && (
                      <div className="relative h-48 w-full">
                        <img
                          src={event.banner_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-white text-lg line-clamp-2">
                          {event.title}
                        </CardTitle>
                        {event.ticket_url && (
                          <a
                            href={event.ticket_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 flex-shrink-0"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-white/80 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {event.event_date ? format(parseISO(event.event_date), 'EEE, MMM d @ h:mmaaa') : 'TBC'}
                        </span>
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{event.venue}</span>
                        </div>
                      )}
                      {event.city && (
                        <Badge variant="outline" className="text-white border-white/20">
                          {event.city}
                        </Badge>
                      )}
                      {event.total_ticket_count !== null && event.total_capacity !== null && (
                        <div className="text-sm text-white/60">
                          {event.total_ticket_count} / {event.total_capacity} tickets sold
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GigsCalendar;
