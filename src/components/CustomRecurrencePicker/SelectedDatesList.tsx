
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { CustomDate } from '@/types/eventTypes';

interface SelectedDatesListProps {
  selectedDates: CustomDate[];
  onRemoveDate: (date: Date) => void;
  onUpdateTimeSlot: (dateIndex: number, timeIndex: number, field: 'startTime' | 'endTime', value: string) => void;
  onAddTimeSlot: (dateIndex: number) => void;
  onRemoveTimeSlot: (dateIndex: number, timeIndex: number) => void;
}

export const SelectedDatesList: React.FC<SelectedDatesListProps> = ({
  selectedDates,
  onRemoveDate,
  onUpdateTimeSlot,
  onAddTimeSlot,
  onRemoveTimeSlot
}) => {
  if (selectedDates.length === 0) return null;

  return (
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
                  onClick={() => onRemoveDate(customDate.date)}
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
                        onChange={(e) => onUpdateTimeSlot(dateIndex, timeIndex, 'startTime', e.target.value)}
                        className="bg-white/10 border-white/20 text-white text-sm h-8"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-gray-400">End</Label>
                      <Input
                        type="time"
                        value={timeSlot.endTime}
                        onChange={(e) => onUpdateTimeSlot(dateIndex, timeIndex, 'endTime', e.target.value)}
                        className="bg-white/10 border-white/20 text-white text-sm h-8"
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onAddTimeSlot(dateIndex)}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs h-8 px-2"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      {customDate.times.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveTimeSlot(dateIndex, timeIndex)}
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
  );
};
