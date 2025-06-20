
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Edit, Trash2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { useUser } from '@/contexts/UserContext';

// Mock data for user's confirmed events
const mockUserEvents = [
  {
    id: '1',
    title: 'Friday Night Comedy Show',
    venue: 'The Laugh Track',
    location: 'Los Angeles, CA',
    date: new Date(2025, 5, 21), // June 21, 2025
    time: '8:00 PM',
    status: 'confirmed',
    type: 'performance',
    description: 'Main set - 15 minutes',
    payment: '$150'
  },
  {
    id: '2',
    title: 'Saturday Showcase',
    venue: 'Comedy Central Club',
    location: 'Hollywood, CA',
    date: new Date(2025, 5, 22), // June 22, 2025
    time: '9:30 PM',
    status: 'confirmed',
    type: 'performance',
    description: 'Opening act - 5 minutes',
    payment: '$75'
  },
  {
    id: '3',
    title: 'Corporate Event',
    venue: 'Tech Conference 2025',
    location: 'San Francisco, CA',
    date: new Date(2025, 5, 28), // June 28, 2025
    time: '7:00 PM',
    status: 'pending',
    type: 'corporate',
    description: 'Clean comedy set for corporate audience',
    payment: '$500'
  }
];

export const ProfileCalendarView: React.FC = () => {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filter events for the selected date
  const selectedDateEvents = mockUserEvents.filter(event => 
    isSameDay(event.date, selectedDate)
  );

  const datesWithEvents = mockUserEvents.map(event => event.date);

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
          <div className="mt-4 text-sm text-muted-foreground">
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
                    <Badge variant="outline">{event.type}</Badge>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{event.payment}</span>
                  </div>
                </div>
                
                <p className="text-sm">{event.description}</p>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                  <Button size="sm" variant="outline">
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
