import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar as CalendarIcon,
  Plus,
  Ban,
  RefreshCw,
  Download,
  Upload,
  Calendar
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  parseISO
} from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// New components and hooks
import { GigPill, GigPillEvent, GigType } from './calendar/GigPill';
import { WeeklyViewWithTimeSlots } from './calendar/WeeklyViewWithTimeSlots';
import { GigListView } from './calendar/GigListView';
import { BlockDatesModal, BlockDatesFormData } from './calendar/BlockDatesModal';
import { EventTypeFilter } from './calendar/EventTypeFilter';
import { MonthPicker } from './calendar/MonthPicker';
import { YearPicker } from './calendar/YearPicker';
import { usePersonalGigs } from '@/hooks/usePersonalGigs';
import { useMyGigs } from '@/hooks/useMyGigs';
import { useBlockedDates } from '@/hooks/useBlockedDates';
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendarSync';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'monthly' | 'weekly' | 'list';

/**
 * ProfileCalendarView Component (REDESIGNED)
 *
 * Unified calendar view with 3 modes:
 * - Monthly: Grid view with event pills (like /gigs calendar)
 * - Weekly: Time slot view with hourly breakdown
 * - List: Chronological event list
 *
 * Features:
 * - Shows confirmed/pending gigs from applications table
 * - Shows personal gigs from personal_gigs table
 * - Shows blocked dates/times
 * - Add personal gigs (manual or Google import)
 * - Block dates/times
 * - Google Calendar two-way sync
 * - Export to .ics for Apple Calendar
 */
export const ProfileCalendarView: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [isBlockDatesModalOpen, setIsBlockDatesModalOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<GigType[]>(['confirmed', 'personal']);

  const isComedian = hasRole('comedian') || hasRole('comedian_lite');

  // Hooks for data management
  const { personalGigs, deletePersonalGig, createPersonalGig } = usePersonalGigs();
  const { manualGigs } = useMyGigs();
  const { blockedDates, createBlockedDates, deleteBlockedDates } = useBlockedDates();
  const {
    syncStatus,
    connectGoogleCalendar,
    importFromGoogle,
    exportToGoogle,
    disconnect
  } = useGoogleCalendarSync();

  // Fetch bookings from both applications AND event_spots tables
  const { data: confirmedBookings = [] } = useQuery({
    queryKey: ['comedian-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id || !isComedian) return [];

      const bookings: Array<{ id: string; status: string; events: any }> = [];

      // 1. Fetch from applications table (comedian applied to event)
      const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select('id, status, event_id')
        .eq('comedian_id', user.id)
        .in('status', ['accepted', 'pending']);

      if (applicationsError) {
        console.error('Error fetching applications:', applicationsError);
      }

      // 2. Fetch from event_spots table (promoter added comedian directly)
      const { data: eventSpots, error: spotsError } = await supabase
        .from('event_spots')
        .select('id, confirmation_status, event_id')
        .eq('comedian_id', user.id)
        .in('confirmation_status', ['confirmed', 'pending']);

      if (spotsError) {
        console.error('Error fetching event spots:', spotsError);
      }

      // Collect all event IDs from both sources
      const applicationEventIds = (applications || []).map(a => a.event_id).filter(Boolean);
      const spotEventIds = (eventSpots || []).map(s => s.event_id).filter(Boolean);
      const allEventIds = [...new Set([...applicationEventIds, ...spotEventIds])];

      if (allEventIds.length === 0) return [];

      // Batch-fetch all related events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, venue, event_date, start_time')
        .in('id', allEventIds);

      if (eventsError) throw eventsError;

      const eventMap = new Map(events?.map(e => [e.id, e]) || []);

      // Map applications to bookings
      (applications || []).forEach(application => {
        const event = eventMap.get(application.event_id!);
        if (event) {
          bookings.push({
            id: application.id,
            status: application.status === 'accepted' ? 'confirmed' : application.status,
            events: event
          });
        }
      });

      // Map event_spots to bookings (avoid duplicates by event_id)
      const addedEventIds = new Set(bookings.map(b => b.events?.id));
      (eventSpots || []).forEach(spot => {
        const event = eventMap.get(spot.event_id!);
        if (event && !addedEventIds.has(event.id)) {
          bookings.push({
            id: spot.id,
            status: spot.confirmation_status === 'confirmed' ? 'confirmed' : 'pending',
            events: event
          });
          addedEventIds.add(event.id);
        }
      });

      return bookings;
    },
    enabled: !!user?.id && isComedian
  });

  // Combine all events into unified format
  const allEvents: GigPillEvent[] = useMemo(() => {
    const events: GigPillEvent[] = [];

    // Add confirmed and pending bookings
    confirmedBookings.forEach(booking => {
      if (booking.events) {
        // event_date is stored in UTC (e.g., "2025-12-29 08:00:00+00")
        // start_time is stored as local time (e.g., "19:00" or "19:00:00")
        // We need to combine the DATE from event_date with the TIME from start_time
        const eventDateRaw = booking.events.event_date;
        const startTime = booking.events.start_time;

        // Extract date portion (YYYY-MM-DD) from event_date
        const datePortion = eventDateRaw?.includes('T')
          ? eventDateRaw.split('T')[0]
          : eventDateRaw?.split(' ')[0];

        // Combine date with local start_time, falling back to event_date if no start_time
        let combinedDateTime: string;
        if (datePortion && startTime) {
          // Create ISO-like string with local time: "2025-12-29T19:00:00"
          combinedDateTime = `${datePortion}T${startTime}`;
        } else {
          // Fallback to original event_date if start_time is missing
          combinedDateTime = eventDateRaw;
        }

        events.push({
          id: booking.id,
          title: booking.events.title,
          venue: booking.events.venue,
          date: combinedDateTime,
          end_time: null,
          type: booking.status === 'confirmed' ? 'confirmed' : 'pending' as GigType,
          notes: null
        });
      }
    });

    // Add personal gigs
    personalGigs.forEach(gig => {
      events.push({
        id: gig.id,
        title: gig.title,
        venue: gig.venue,
        date: gig.date,
        end_time: gig.end_time,
        type: 'personal' as GigType,
        notes: gig.notes
      });
    });

    // Add manual gigs
    manualGigs.forEach(gig => {
      events.push({
        id: gig.id,
        title: gig.title,
        venue: gig.venue_name,
        date: gig.start_datetime,
        end_time: gig.end_datetime,
        type: 'personal' as GigType,
        notes: gig.notes,
        is_recurring: gig.is_recurring,
        parent_gig_id: gig.parent_gig_id
      });
    });

    console.log('📅 [ProfileCalendarView] Events compiled:', {
      confirmedBookings: confirmedBookings.length,
      personalGigs: personalGigs.length,
      manualGigs: manualGigs.length,
      totalEvents: events.length,
      manualGigsData: manualGigs
    });

    return events;
  }, [confirmedBookings, personalGigs, manualGigs]);

  // Filter events based on selected types
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => selectedTypes.includes(event.type));
  }, [allEvents, selectedTypes]);

  // Transform blocked dates for WeeklyView
  const blockedTimes = useMemo(() => {
    return blockedDates.map(block => ({
      id: block.id,
      dateStart: new Date(block.start_date),
      dateEnd: new Date(block.end_date),
      reason: block.reason || undefined
    }));
  }, [blockedDates]);

  // Group filtered events by date for monthly view
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, GigPillEvent[]> = {};

    filteredEvents.forEach(event => {
      if (!event.date) return;
      // Handle both ISO format (2025-12-29T19:00:00) and timestamp format (2025-12-29 08:00:00+00)
      const dateKey = event.date.includes('T')
        ? event.date.split('T')[0]
        : event.date.split(' ')[0];
      if (!dateKey) return;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey]!.push(event);
    });

    return grouped;
  }, [filteredEvents]);

  // Calendar grid days for monthly view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedMonth]);

  // Handlers
  const handleBlockDates = async (data: BlockDatesFormData) => {
    await createBlockedDates(data);
  };

  const handleDeleteGig = async (eventId: string, type: GigType) => {
    if (type === 'personal') {
      await deletePersonalGig(eventId);
    }
  };

  const handleImportFromGoogle = async () => {
    const count = await importFromGoogle({
      timeMin: new Date().toISOString(),
      maxResults: 50
    });

    if (count > 0) {
      setIsAddGigModalOpen(false);
    }
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleToday = () => {
    setSelectedMonth(new Date());
  };

  if (!isComedian) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
          <p className="text-muted-foreground">
            Calendar view is only available for comedians
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              My Calendar
            </CardTitle>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate('/dashboard/gigs/add')}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Gig
              </Button>

              <Button
                onClick={() => setIsBlockDatesModalOpen(true)}
                className="professional-button"
                size="sm"
              >
                <Ban className="w-4 h-4 mr-2" />
                Block Dates
              </Button>

              {syncStatus.isConnected ? (
                <>
                  <Button
                    onClick={() => importFromGoogle()}
                    className="professional-button"
                    size="sm"
                    disabled={syncStatus.isSyncing}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Import from Google
                  </Button>
                  <Button
                    onClick={() => disconnect()}
                    variant="ghost"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Connected
                  </Button>
                </>
              ) : (
                <Button
                  onClick={connectGoogleCalendar}
                  className="professional-button"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Connect Google Calendar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* View Tabs and Filter */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
              <EventTypeFilter selectedTypes={selectedTypes} onChange={setSelectedTypes} />
            </div>

            {/* Monthly View */}
            <TabsContent value="monthly" className="mt-0">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button className="professional-button" size="sm" onClick={handlePreviousMonth}>
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <MonthPicker selectedMonth={selectedMonth} onChange={setSelectedMonth}>
                      <Button variant="ghost" className="text-lg font-semibold hover:bg-white/10">
                        {format(selectedMonth, 'MMMM')}
                      </Button>
                    </MonthPicker>
                    <YearPicker selectedMonth={selectedMonth} onChange={setSelectedMonth}>
                      <Button variant="ghost" className="text-lg font-semibold hover:bg-white/10">
                        {format(selectedMonth, 'yyyy')}
                      </Button>
                    </YearPicker>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleToday}>
                    Today
                  </Button>
                </div>
                <Button className="professional-button" size="sm" onClick={handleNextMonth}>
                  Next
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-muted-foreground p-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDate[dateKey] || [];
                    const isCurrentMonth = isSameMonth(day, selectedMonth);
                    const isCurrentDay = isToday(day);

                    return (
                      <div
                        key={index}
                        className={cn(
                          "min-h-24 p-2 border rounded-lg",
                          isCurrentDay && "bg-primary/10 border-primary",
                          !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                          isCurrentMonth && !isCurrentDay && "bg-card border-border"
                        )}
                      >
                        <div className="text-sm font-medium mb-1">
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <GigPill
                              key={event.id}
                              event={event}
                              onDelete={handleDeleteGig}
                              showDelete={true}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Weekly View */}
            <TabsContent value="weekly" className="mt-0">
              <WeeklyViewWithTimeSlots
                events={filteredEvents}
                blockedTimes={blockedTimes}
                onEventDelete={handleDeleteGig}
                showDelete={true}
              />
            </TabsContent>

            {/* List View */}
            <TabsContent value="list" className="mt-0">
              <GigListView
                events={filteredEvents}
                onEventDelete={handleDeleteGig}
                showDelete={true}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals */}
      <BlockDatesModal
        isOpen={isBlockDatesModalOpen}
        onClose={() => setIsBlockDatesModalOpen(false)}
        onSave={handleBlockDates}
      />
    </div>
  );
};
