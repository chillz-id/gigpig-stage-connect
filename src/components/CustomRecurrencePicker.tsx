
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CustomDate {
  date: Date;
  times: Array<{
    startTime: string;
    endTime: string;
  }>;
}

interface CustomRecurrencePickerProps {
  selectedDates: CustomDate[];
  onDatesChange: (dates: CustomDate[]) => void;
}

export const CustomRecurrencePicker: React.FC<CustomRecurrencePickerProps> = ({
  selectedDates,
  onDatesChange
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const dateString = date.toDateString();
    const existingDateIndex = selectedDates.findIndex(d => d.date.toDateString() === dateString);

    if (existingDateIndex !== -1) {
      // Remove the date
      onDatesChange(selectedDates.filter((_, index) => index !== existingDateIndex));
    } else {
      // Add the date with default time
      const newCustomDate: CustomDate = {
        date: date,
        times: [{
          startTime: '19:00',
          endTime: '22:00'
        }]
      };
      onDatesChange([...selectedDates, newCustomDate].sort((a, b) => a.date.getTime() - b.date.getTime()));
    }
  };

  const removeDate = (dateToRemove: Date) => {
    onDatesChange(selectedDates.filter(d => d.date.toDateString() !== dateToRemove.toDateString()));
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.some(d => d.date.toDateString() === date.toDateString());
  };

  const updateTimeSlot = (dateIndex: number, timeIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const updatedDates = [...selectedDates];
    updatedDates[dateIndex].times[timeIndex][field] = value;
    onDatesChange(updatedDates);
  };

  const addTimeSlot = (dateIndex: number) => {
    const updatedDates = [...selectedDates];
    updatedDates[dateIndex].times.push({
      startTime: '19:00',
      endTime: '22:00'
    });
    onDatesChange(updatedDates);
  };

  const removeTimeSlot = (dateIndex: number, timeIndex: number) => {
    const updatedDates = [...selectedDates];
    if (updatedDates[dateIndex].times.length > 1) {
      updatedDates[dateIndex].times.splice(timeIndex, 1);
      onDatesChange(updatedDates);
    }
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

        {selectedDates.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Selected Dates & Times ({selectedDates.length}):</h4>
            <div className="space-y-4">
              {selectedDates.map((customDate, dateIndex) => (
                <Card key={dateIndex} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-white border-white/30">
                          {format(customDate.date, 'MMM dd, yyyy')}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDate(customDate.date)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock className="w-4 h-4" />
                        Time Slots ({customDate.times.length})
                      </div>
                      
                      {customDate.times.map((timeSlot, timeIndex) => (
                        <div key={timeIndex} className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label className="text-xs text-gray-400">Start</Label>
                            <Input
                              type="time"
                              value={timeSlot.startTime}
                              onChange={(e) => updateTimeSlot(dateIndex, timeIndex, 'startTime', e.target.value)}
                              className="bg-white/10 border-white/20 text-white text-sm h-8"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs text-gray-400">End</Label>
                            <Input
                              type="time"
                              value={timeSlot.endTime}
                              onChange={(e) => updateTimeSlot(dateIndex, timeIndex, 'endTime', e.target.value)}
                              className="bg-white/10 border-white/20 text-white text-sm h-8"
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addTimeSlot(dateIndex)}
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs h-8 px-2"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            {customDate.times.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTimeSlot(dateIndex, timeIndex)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 px-2"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
