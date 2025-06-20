
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MapPin, Clock, Users } from 'lucide-react';
import { mockShows } from '@/data/mockData';
import { format, isSameDay, parseISO } from 'date-fns';

export const CalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filter for only confirmed shows and convert to have proper dates
  const confirmedShows = mockShows
    .filter(show => show.status === 'open') // Updated to use valid status from mockData
    .map((show, index) => ({
      ...show,
      dateObj: new Date(2025, 5, 19 + (index % 14)) // Spread shows across 2 weeks
    }));

  const selectedDateShows = confirmedShows.filter(show => 
    isSameDay(show.dateObj, selectedDate)
  );

  const datesWithShows = confirmedShows.map(show => show.dateObj);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            modifiers={{
              hasShows: datesWithShows
            }}
            modifiersStyles={{
              hasShows: { 
                backgroundColor: 'hsl(var(--primary))', 
                color: 'hsl(var(--primary-foreground))',
                borderRadius: '6px'
              }
            }}
            className="rounded-md border bg-background/50"
          />
          <div className="mt-4 text-sm text-muted-foreground">
            Dates with open shows are highlighted
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          Open Shows on {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        
        {selectedDateShows.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8 text-center">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-semibold mb-2">No open shows this day</h4>
              <p className="text-muted-foreground">
                Select a highlighted date to see available shows
              </p>
            </CardContent>
          </Card>
        ) : (
          selectedDateShows.map((show) => (
            <Card key={show.id} className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{show.title}</CardTitle>
                    <p className="text-muted-foreground">{show.venue}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{show.type}</Badge>
                    <Badge className="bg-green-500">Open</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{show.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{show.time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>Apply for slot</span>
                  </div>
                </div>
                
                <p className="text-sm">{show.description}</p>
                
                <div className="flex gap-2">
                  <Button className="flex-1 bg-primary hover:bg-primary/90">
                    View Details
                  </Button>
                  <Button variant="outline">Contact Promoter</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
