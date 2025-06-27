import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mockEvents } from '@/data/mockEvents';
import { ModernEventCard } from '@/components/ModernEventCard';

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50 min-h-screen p-6">
      <div className="lg:col-span-2">
        <Card className="bg-white shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Calendar className="w-5 h-5" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="border-gray-200">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextMonth} className="border-gray-200">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
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
                      min-h-[80px] p-1 border border-gray-100 cursor-pointer transition-colors rounded-lg
                      ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                      ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                      ${isSelected ? 'bg-blue-100 border-blue-300' : ''}
                      hover:bg-gray-50
                    `}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-sm font-medium mb-1">{day.getDate()}</div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className="text-xs p-1 bg-blue-500 text-white rounded truncate"
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500">
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

      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-900">
          {selectedDate ? `Events on ${selectedDate.toLocaleDateString()}` : 'Select a date'}
        </h3>

        {selectedDate && selectedDateEvents.length > 0 ? (
          <div className="space-y-4">
            {selectedDateEvents.map(event => (
              <ModernEventCard
                key={event.id}
                show={event}
                interestedEvents={interestedEvents}
                onToggleInterested={handleToggleInterested}
                onApply={handleApply}
                onBuyTickets={handleBuyTickets}
                onShowDetails={() => {}} // No details handler needed for calendar
                onGetDirections={() => {}} // No directions handler needed for calendar
              />
            ))}
          </div>
        ) : (
          <Card className="bg-white shadow-sm border-gray-200">
            <CardContent className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h4 className="text-lg font-semibold mb-2 text-gray-900">No events scheduled</h4>
              <p className="text-gray-600">
                {selectedDate ? 'No events found for this date.' : 'Select a date to view events.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
