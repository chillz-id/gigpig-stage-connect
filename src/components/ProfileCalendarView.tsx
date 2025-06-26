
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Edit, Trash2 } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { useUser } from '@/contexts/UserContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ProfileCalendarView: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch user's calendar events
  const { data: calendarEvents = [], isLoading } = useQuery({
    queryKey: ['calendar-events', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('comedian_id', user.id)
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Filter events for the selected date
  const selectedDateEvents = calendarEvents.filter(event => 
    isSameDay(parseISO(event.event_date), selectedDate)
  );

  const datesWithEvents = calendarEvents.map(event => parseISO(event.event_date));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
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
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            My Calendar
          </CardTitle>
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
            Dates with your events are highlighted
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
                You don't have any events scheduled for this day
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
                    <span>{format(parseISO(event.event_date), 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>Calendar sync: {event.calendar_sync_status}</span>
                  </div>
                </div>
                
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
