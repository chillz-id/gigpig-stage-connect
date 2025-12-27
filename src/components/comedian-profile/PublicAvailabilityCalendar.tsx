import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarDays, Clock, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useComedianAvailability } from '@/hooks/useComedianAvailability';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isBefore, addWeeks, subWeeks } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PublicAvailabilityCalendarProps {
  comedianId: string;
  comedianName?: string;
}

const PublicAvailabilityCalendar: React.FC<PublicAvailabilityCalendarProps> = ({ 
  comedianId,
  comedianName = 'this comedian'
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    availability,
    blockedDates,
    isLoading,
    isDateAvailable
  } = useComedianAvailability(comedianId);

  // Get the week range
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const getDayStatus = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const isPast = isBefore(date, new Date()) && !isToday(date);
    
    // Check if date is in a blocked period
    const isBlocked = blockedDates?.some(blocked => {
      const blockStart = new Date(blocked.start_date);
      const blockEnd = new Date(blocked.end_date);
      return date >= blockStart && date <= blockEnd;
    });

    if (isBlocked) return 'blocked';
    if (isPast) return 'past';
    
    const available = isDateAvailable(dateString);
    return available ? 'available' : 'unavailable';
  };

  const getDayClasses = (date: Date) => {
    const status = getDayStatus(date);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const baseClasses = 'w-full aspect-square flex flex-col items-center justify-center text-sm border rounded-lg transition-colors cursor-pointer';
    
    const selectedClasses = isSelected ? 'ring-2 ring-purple-400' : '';
    
    switch (status) {
      case 'blocked':
        return `${baseClasses} ${selectedClasses} bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600 text-red-700 dark:text-red-300`;
      case 'past':
        return `${baseClasses} bg-gray-50 dark:bg-gray-800/30 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed`;
      case 'available':
        return `${baseClasses} ${selectedClasses} bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/40`;
      case 'unavailable':
        return `${baseClasses} ${selectedClasses} bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300`;
      default:
        return `${baseClasses} ${selectedClasses} bg-gray-50 dark:bg-gray-700/30 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300`;
    }
  };

  const handleDateClick = (date: Date) => {
    const status = getDayStatus(date);
    if (status === 'past') return;
    
    setSelectedDate(date);
  };

  const handleBookingRequest = () => {
    if (!selectedDate) return;
    
    if (!user) {
      navigate('/signin', { state: { from: `/comedians/${comedianId}` } });
      return;
    }

    navigate('/book-comedian', { 
      state: { 
        comedianId,
        comedianName,
        preselectedDate: format(selectedDate, 'yyyy-MM-dd')
      } 
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <Calendar className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-purple-400" />
            Availability Calendar
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button onClick={goToPreviousWeek} className="professional-button" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="font-medium">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </div>
          <div className="flex gap-2">
            <Button onClick={goToCurrentWeek} className="professional-button" size="sm">
              Today
            </Button>
            <Button onClick={goToNextWeek} className="professional-button" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {daysOfWeek.map(date => {
            const status = getDayStatus(date);
            const isPast = isBefore(date, new Date()) && !isToday(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            
            return (
              <div
                key={date.toISOString()}
                className={getDayClasses(date)}
                onClick={() => handleDateClick(date)}
              >
                <span className={isToday(date) ? 'font-bold' : ''}>
                  {format(date, 'd')}
                </span>
                <div className="mt-1">
                  {status === 'available' && !isPast && (
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                  {status === 'unavailable' && !isPast && (
                    <X className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  )}
                  {status === 'blocked' && (
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h4>
            
            <div className="flex items-center gap-2">
              {getDayStatus(selectedDate) === 'available' ? (
                <>
                  <Badge variant="default" className="bg-green-600">
                    Available
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {comedianName} is available on this date
                  </span>
                </>
              ) : getDayStatus(selectedDate) === 'blocked' ? (
                <>
                  <Badge variant="destructive">
                    Unavailable
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {comedianName} is not available during this period
                  </span>
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="bg-orange-600">
                    Not Available
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {comedianName} has not marked this date as available
                  </span>
                </>
              )}
            </div>

            {getDayStatus(selectedDate) === 'available' && (
              <Button 
                onClick={handleBookingRequest}
                className="w-full"
              >
                Request Booking for This Date
              </Button>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm border-t pt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span className="text-muted-foreground">Available for booking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-600 rounded"></div>
            <span className="text-muted-foreground">Not marked as available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span className="text-muted-foreground">Blocked/On tour</span>
          </div>
        </div>

        {/* General Booking Button */}
        <div className="border-t pt-4">
          <Button 
            className="professional-button w-full"
            onClick={() => {
              if (!user) {
                navigate('/signin', { state: { from: `/comedians/${comedianId}` } });
              } else {
                navigate('/book-comedian', { 
                  state: { 
                    comedianId,
                    comedianName
                  } 
                });
              }
            }}
          >
            Send General Booking Request
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Or select a specific date above to request booking for that date
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicAvailabilityCalendar;