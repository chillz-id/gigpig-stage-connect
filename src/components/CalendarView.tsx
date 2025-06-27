
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Users, Star, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mockEvents } from '@/data/mockEvents';

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  // Filter to show only upcoming events (from today onwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = mockEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    return eventDate >= today;
  });

  // Use upcoming events for all views
  const eventsToShow = upcomingEvents;

  // Determine if user is a consumer (not an industry user)
  const isConsumer = !user || (!hasRole('comedian') && !hasRole('promoter') && !hasRole('admin'));

  const handleToggleInterested = (event: any) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to mark events as interested.",
        variant: "destructive",
      });
      return;
    }

    const newInterestedEvents = new Set(interestedEvents);
    if (interestedEvents.has(event.id)) {
      newInterestedEvents.delete(event.id);
      toast({
        title: "Removed from interested",
        description: `"${event.title}" has been removed from your interested events.`,
      });
    } else {
      newInterestedEvents.add(event.id);
      toast({
        title: "Added to interested!",
        description: `"${event.title}" has been added to your calendar as an interested event.`,
      });
    }
    setInterestedEvents(newInterestedEvents);
  };

  const handleBuyTickets = (event: any) => {
    toast({
      title: "Ticket purchase",
      description: `Redirecting to ticket purchase for "${event.title}"`,
    });
  };

  const handleApply = (event: any) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to apply for shows.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Application submitted!",
      description: `Your application for "${event.title}" has been submitted successfully.`,
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }

  const getEventsForDate = (date: Date) => {
    return eventsToShow.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = day.toDateString() === today.toDateString();
                const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                const dayEvents = getEventsForDate(day);
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-[80px] p-1 border border-border cursor-pointer transition-colors
                      ${isCurrentMonth ? 'bg-card/30' : 'bg-muted/20 text-muted-foreground'}
                      ${isToday ? 'bg-primary/20 border-primary' : ''}
                      ${isSelected ? 'bg-primary/30 border-primary' : ''}
                      hover:bg-card/50
                    `}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-sm font-medium mb-1">{day.getDate()}</div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className="text-xs p-1 bg-primary/80 text-primary-foreground rounded truncate"
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          {selectedDate ? `Events on ${selectedDate.toLocaleDateString()}` : 'Select a date'}
        </h3>

        {selectedDate && selectedDateEvents.length > 0 ? (
          <div className="space-y-4">
            {selectedDateEvents.map(event => {
              const isInterested = interestedEvents.has(event.id);
              const availableSpots = (event.spots || 5) - (event.applied_spots || 0);
              
              return (
                <Card key={event.id} className="bg-card/50 backdrop-blur-sm border-border overflow-hidden">
                  {/* Event Image */}
                  {event.banner_url && (
                    <div className="aspect-[2/1] relative overflow-hidden">
                      <img 
                        src={event.banner_url} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {isConsumer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`absolute top-2 right-2 ${
                            isInterested 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-white hover:text-red-500'
                          }`}
                          onClick={() => handleToggleInterested(event)}
                        >
                          <Heart className={`w-5 h-5 ${isInterested ? 'fill-current' : ''}`} />
                        </Button>
                      )}
                    </div>
                  )}

                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{event.title}</h4>
                        <p className="text-muted-foreground">{event.venue}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {/* For consumers, only show age restriction */}
                        {isConsumer ? (
                          <Badge variant="outline" className="text-xs">
                            {event.age_restriction}
                          </Badge>
                        ) : (
                          <>
                            {event.is_verified_only && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Pro
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {event.type}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.start_time}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.city}, {event.state}
                      </div>
                      {!isConsumer && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {availableSpots} spots
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {!isConsumer && (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleApply(event)}
                          disabled={availableSpots <= 0}
                        >
                          {availableSpots <= 0 ? 'Full' : 'Apply'}
                        </Button>
                      )}
                      
                      {(isConsumer || event.is_paid) && (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleBuyTickets(event)}
                        >
                          Buy Tickets
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-semibold mb-2">No events scheduled</h4>
              <p className="text-muted-foreground">
                {selectedDate ? 'No events found for this date.' : 'Select a date to view events.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
