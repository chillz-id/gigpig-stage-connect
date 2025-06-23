
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CustomRecurrencePickerProps {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
}

export const CustomRecurrencePicker: React.FC<CustomRecurrencePickerProps> = ({
  selectedDates,
  onDatesChange
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const dateString = date.toDateString();
    const isAlreadySelected = selectedDates.some(d => d.toDateString() === dateString);

    if (isAlreadySelected) {
      // Remove the date
      onDatesChange(selectedDates.filter(d => d.toDateString() !== dateString));
    } else {
      // Add the date
      onDatesChange([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const removeDate = (dateToRemove: Date) => {
    onDatesChange(selectedDates.filter(d => d.toDateString() !== dateToRemove.toDateString()));
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.some(d => d.toDateString() === date.toDateString());
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarIcon className="w-4 h-4" />
          Custom Recurring Dates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
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
              onSelect={handleDateSelect}
              modifiers={{
                selected: selectedDates
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

        {selectedDates.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Selected Dates ({selectedDates.length}):</h4>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selectedDates.map((date, index) => (
                <Badge key={index} variant="outline" className="text-white border-white/30">
                  {format(date, 'MMM dd, yyyy')}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => removeDate(date)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
