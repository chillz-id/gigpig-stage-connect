import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Edit, Trash2, Plus } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  venue: string;
  event_date: string;
  status: string;
  calendar_sync_status?: string;
}

export const ProfileCalendarView: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Determine if user is a consumer (not an industry user)
  const isConsumer = !user || (!hasRole('comedian') && !hasRole('promoter') && !hasRole('admin'));
  const isComedian = hasRole('comedian');

  // Fetch calendar events based on user type
  const { data: calendarEvents = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events', user?.id, isConsumer],
    queryFn: async () => {
      if (!user?.id) return [];

      if (isConsumer) {
        // For consumers, fetch events they're interested in
        const { data, error } = await supabase
          .from('user_interests')
          .select('id, event_title, venue, event_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(interest => ({
          id: interest.id,
          title: interest.event_title || 'Event',
          venue: interest.venue || 'Venue TBA',
          event_date: interest.event_date || new Date().toISOString(),
          status: 'interested',
          calendar_sync_status: 'manual'
        }));
      } else if (isComedian) {
        // For comedians, fetch their bookings from comedian_bookings table
        const { data, error } = await supabase
          .from('comedian_bookings')
          .select(`
            id,
            status,
            fee,
            events!inner(
              id,
              title,
              venue,
              date,
              created_at
            )
          `)
          .eq('comedian_id', user.id)
          .order('events.date', { ascending: true });

        if (error) throw error;
        return (data || []).map(booking => ({
          id: booking.id,
          title: booking.events?.title || 'Gig',
          venue: booking.events?.venue || 'Venue TBA',
          event_date: booking.events?.date || new Date().toISOString(),
          status: booking.status,
          calendar_sync_status: 'confirmed'
        }));
      } else {
        // For promoters, fetch events they created
        const { data, error } = await supabase
          .from('events')
          .select('id, title, venue, date, status')
          .eq('promoter_id', user.id)
          .order('date', { ascending: true });

        if (error) throw error;
        return (data || []).map(event => ({
          id: event.id,
          title: event.title,
          venue: event.venue,
          event_date: event.date,
          status: event.status || 'published',
          calendar_sync_status: 'published'
        }));
      }
    },
    enabled: !!user?.id
  });

  // Filter events for the selected date
  const selectedDateEvents = calendarEvents.filter(event => 
    event.event_date && isSameDay(parseISO(event.event_date), selectedDate)
  );

  const datesWithEvents = calendarEvents
    .filter(event => event.event_date)
    .map(event => parseISO(event.event_date));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'interested':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleEditEvent = (eventId: string) => {
    toast({
      title: "Edit Event",
      description: "Event editing functionality will be implemented soon"
    });
  };

  const handleCancelEvent = (eventId: string) => {
    toast({
      title: "Cancel Event",
      description: "Event cancellation functionality will be implemented soon"
    });
  };

  const handleAddEvent = () => {
    toast({
      title: "Add Event",
      description: "Event creation functionality will be implemented soon"
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {isConsumer ? 'Event Calendar' : isComedian ? 'My Gig Calendar' : 'My Events'}
            </CardTitle>
            {/* Only show Add Event button for promoters */}
            {!isConsumer && !isComedian && (
              <Button size="sm" onClick={handleAddEvent}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-md mx-auto">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              modifiers={{
                hasEvents: datesWithEvents
              }}
              modifiersStyles={{
                hasEvents: { 
                  backgroundColor: 'hsl(var(--primary))', 
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: '6px'
                }
              }}
              className="rounded-md border bg-background/50"
            />
          </div>
          <div className="mt-4 text-sm text-muted-foreground text-center">
            {isConsumer 
              ? 'Dates with events you\'re interested in are highlighted'
              : isComedian
                ? 'Dates with your confirmed and pending gigs are highlighted'
                : 'Dates with your events are highlighted'
            }
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          Events on {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        
        {selectedDateEvents.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8 text-center">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-semibold mb-2">No events scheduled</h4>
              <p className="text-muted-foreground">
                {isConsumer 
                  ? "You don't have any events of interest for this day"
                  : "You don't have any events scheduled for this day"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          selectedDateEvents.map((event) => (
            <Card key={event.id} className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <p className="text-muted-foreground">{event.venue}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.event_date ? format(parseISO(event.event_date), 'h:mm a') : 'Time TBA'}</span>
                  </div>
                  {!isConsumer && event.calendar_sync_status && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>Sync: {event.calendar_sync_status}</span>
                    </div>
                  )}
                </div>
                
                {!isConsumer && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEditEvent(event.id)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCancelEvent(event.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
