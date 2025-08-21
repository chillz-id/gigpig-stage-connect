
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, isSameDay } from 'date-fns';

interface RecurringEventDateSelectorProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onDateSelected: (date: Date) => void;
}

export const RecurringEventDateSelector: React.FC<RecurringEventDateSelectorProps> = ({
  event,
  isOpen,
  onClose,
  onDateSelected
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  if (!event) return null;

  // Generate upcoming event dates based on recurrence pattern
  const generateRecurringDates = (startDate: Date, pattern: string, count: number = 8) => {
    const dates = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < count; i++) {
      dates.push(new Date(currentDate));
      
      switch (pattern) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        default:
          currentDate = addWeeks(currentDate, 1); // Default to weekly
      }
    }
    
    return dates;
  };

  const eventStartDate = new Date(event.event_date);
  const recurringDates = generateRecurringDates(
    eventStartDate,
    event.recurrence_pattern || 'weekly'
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleConfirmDate = () => {
    if (selectedDate) {
      onDateSelected(selectedDate);
      setSelectedDate(undefined);
    }
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    onClose();
  };

  // Filter out past dates
  const upcomingDates = recurringDates.filter(date => date >= new Date());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Select Event Date</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{event.start_time}</span>
              </div>
            </div>
            <Badge className="mt-2 bg-blue-600">
              Recurring {event.recurrence_pattern || 'Weekly'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Dates List */}
            <div>
              <h4 className="font-medium mb-3">Upcoming Shows</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {upcomingDates.map((date, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDate && isSameDay(selectedDate, date)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="font-medium">
                      {format(date, 'EEEE, MMMM d')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(date, 'yyyy')} • {event.start_time}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar View */}
            <div>
              <h4 className="font-medium mb-3">Calendar View</h4>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                modifiers={{
                  eventDates: upcomingDates
                }}
                modifiersStyles={{
                  eventDates: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    borderRadius: '6px',
                  }
                }}
                className="rounded-md border pointer-events-auto"
              />
            </div>
          </div>

          {/* Selected Date Display */}
          {selectedDate && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <span className="font-medium">Selected Date</span>
              </div>
              <p className="text-lg font-semibold">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {event.start_time} at {event.venue}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDate}
              disabled={!selectedDate}
              className="bg-green-600 hover:bg-green-700"
            >
              Continue to Tickets
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
