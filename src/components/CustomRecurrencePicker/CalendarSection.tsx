
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CustomDate } from '@/types/eventTypes';

interface CalendarSectionProps {
  isCalendarOpen: boolean;
  selectedDates: CustomDate[];
  onToggleCalendar: () => void;
  onDateSelect: (date: Date | undefined) => void;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  isCalendarOpen,
  selectedDates,
  onToggleCalendar,
  onDateSelect
}) => {
  return (
    <>
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={onToggleCalendar}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          {isCalendarOpen ? 'Hide Calendar' : 'Select Dates'}
        </Button>
      </div>

      {isCalendarOpen && (
        <div className="bg-white/10 p-4 rounded-lg">
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={onDateSelect}
            modifiers={{
              selected: selectedDates.map(d => d.date)
            }}
            modifiersStyles={{
              selected: {
                backgroundColor: '#8b5cf6',
                color: 'white'
              }
            }}
            className={cn("p-3 pointer-events-auto")}
            disabled={(date) => date < new Date()}
          />
          <p className="text-sm text-gray-300 mt-2">
            Click on dates to select/deselect them for your recurring events
          </p>
        </div>
      )}
    </>
  );
};
