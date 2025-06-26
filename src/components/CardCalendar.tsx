
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CardCalendarProps {
  selectedMonth: number;
  selectedYear: number;
  events: any[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export const CardCalendar: React.FC<CardCalendarProps> = ({
  selectedMonth,
  selectedYear,
  events,
  onDateSelect,
  selectedDate
}) => {
  const firstDay = new Date(selectedYear, selectedMonth, 1);
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === selectedMonth;
            const isToday = day.toDateString() === today.toDateString();
            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
            const dayEvents = getEventsForDate(day);
            
            return (
              <div
                key={index}
                className={`
                  min-h-[60px] p-1 border border-border cursor-pointer transition-colors text-xs
                  ${isCurrentMonth ? 'bg-card/30' : 'bg-muted/20 text-muted-foreground'}
                  ${isToday ? 'bg-primary/20 border-primary' : ''}
                  ${isSelected ? 'bg-primary/30 border-primary' : ''}
                  hover:bg-card/50
                `}
                onClick={() => onDateSelect(day)}
              >
                <div className="font-medium mb-1">{day.getDate()}</div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className="text-[10px] p-1 bg-primary/80 text-primary-foreground rounded truncate"
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
