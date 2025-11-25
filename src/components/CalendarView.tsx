import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Users, Star, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEvents } from '@/hooks/data/useEvents';
import { ModernEventCard } from '@/components/ModernEventCard';

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());
  const [appliedEvents, setAppliedEvents] = useState<Set<string>>(new Set());
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const isComedian = user && (hasRole('comedian') || hasRole('comedian_lite'));
  
  // Get events from the hook
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { items: events, isLoading } = useEvents({
    date_from: today.toISOString(),
    status: 'published'
  });

  // Use upcoming events for all views
  const eventsToShow = events || [];

  // Determine if user is a consumer (not an industry user)
  const isConsumer = !user || (!hasRole('comedian') && !hasRole('comedian_lite') && !hasRole('admin'));

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

    const newAppliedEvents = new Set(appliedEvents);
    if (appliedEvents.has(event.id)) {
      // Unapply
      newAppliedEvents.delete(event.id);
      toast({
        title: "Application removed",
        description: `Your application for "${event.title}" has been removed.`,
      });
    } else {
      // Apply
      newAppliedEvents.add(event.id);
      toast({
        title: "Application submitted!",
        description: `Your application for "${event.title}" has been submitted successfully.`,
      });
    }
    setAppliedEvents(newAppliedEvents);
  };

  const handleDayClick = (date: Date, dayEvents: any[]) => {
    setSelectedDate(date);

    // If comedian clicks a date with events, toggle apply on first event
    if (isComedian && dayEvents.length > 0) {
      const firstEvent = dayEvents[0];
      handleApply(firstEvent);
    }
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
                <Button className="professional-button" size="sm" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button className="professional-button" size="sm" onClick={goToNextMonth}>
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
                const hasAppliedToDate = isComedian && dayEvents.some(event => appliedEvents.has(event.id));

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[80px] p-1 border border-border cursor-pointer transition-colors
                      ${isCurrentMonth ? 'bg-card/30' : 'bg-muted/20 text-muted-foreground'}
                      ${isToday ? 'bg-primary/20 border-primary' : ''}
                      ${isSelected ? 'bg-primary/30 border-primary' : ''}
                      ${hasAppliedToDate ? 'bg-green-500/20 border-green-500' : ''}
                      hover:bg-card/50
                    `}
                    onClick={() => handleDayClick(day, dayEvents)}
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
              const hasApplied = appliedEvents.has(event.id);
              return (
                <div key={event.id} className="relative">
                  <ModernEventCard
                    show={event}
                    interestedEvents={interestedEvents}
                    onToggleInterested={handleToggleInterested}
                    onApply={handleApply}
                    onBuyTickets={handleBuyTickets}
                    onShowDetails={() => {}}
                    onGetDirections={() => {}}
                  />
                  {isComedian && (
                    <div className="mt-2">
                      <button
                        onClick={() => handleApply(event)}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          hasApplied
                            ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30 border border-green-500'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                      >
                        {hasApplied ? 'Applied ✓' : 'Apply'}
                      </button>
                    </div>
                  )}
                </div>
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
