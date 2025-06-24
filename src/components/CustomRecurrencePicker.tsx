
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';
import { CustomDate } from '@/types/eventTypes';
import { CalendarSection } from './CustomRecurrencePicker/CalendarSection';
import { SelectedDatesList } from './CustomRecurrencePicker/SelectedDatesList';

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
      onDatesChange(selectedDates.filter((_, index) => index !== existingDateIndex));
    } else {
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
        <CalendarSection
          isCalendarOpen={isCalendarOpen}
          selectedDates={selectedDates}
          onToggleCalendar={() => setIsCalendarOpen(!isCalendarOpen)}
          onDateSelect={handleDateSelect}
        />

        <SelectedDatesList
          selectedDates={selectedDates}
          onRemoveDate={removeDate}
          onUpdateTimeSlot={updateTimeSlot}
          onAddTimeSlot={addTimeSlot}
          onRemoveTimeSlot={removeTimeSlot}
        />
      </CardContent>
    </Card>
  );
};
