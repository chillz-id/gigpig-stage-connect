import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plus, X } from 'lucide-react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { EventFormData, RecurringSettings } from '@/types/eventTypes';

interface EventSchedulingProps {
  control: Control<EventFormData>;
  errors: FieldErrors<EventFormData>;
  recurringSettings: RecurringSettings;
  onRecurringSettingsChange: (updates: Partial<RecurringSettings>) => void;
}

export const EventScheduling: React.FC<EventSchedulingProps> = ({ 
  control, 
  errors,
  recurringSettings,
  onRecurringSettingsChange 
}) => {
  // State for controlling the Select's open state
  const [isPatternSelectOpen, setIsPatternSelectOpen] = useState(false);
  
  // Local state for end date to prevent re-renders during interaction
  const [localEndDate, setLocalEndDate] = useState(recurringSettings.endDate);
  
  // Ref to store pending value during selection
  const pendingPatternValue = useRef<string | null>(null);
  
  // Handle value selection without updating state immediately
  const handlePatternSelect = useCallback((value: string) => {
    pendingPatternValue.current = value;
  }, []);
  
  // Update state only when dropdown closes
  const handlePatternOpenChange = useCallback((open: boolean) => {
    setIsPatternSelectOpen(open);
    
    // When closing, apply the pending value
    if (!open && pendingPatternValue.current) {
      onRecurringSettingsChange({ pattern: pendingPatternValue.current });
      pendingPatternValue.current = null;
    }
  }, [onRecurringSettingsChange]);

  // Sync local end date with prop
  useEffect(() => {
    setLocalEndDate(recurringSettings.endDate);
  }, [recurringSettings.endDate]);

  // Handle end date blur to update parent state
  const handleEndDateBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value !== recurringSettings.endDate) {
      onRecurringSettingsChange({ endDate: value });
    }
  }, [recurringSettings.endDate, onRecurringSettingsChange]);

  const addCustomDate = () => {
    const newDate = prompt('Enter date (YYYY-MM-DD):');
    if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      onRecurringSettingsChange({
        customDates: [...(recurringSettings.customDates || []), newDate]
      });
    }
  };

  const removeCustomDate = (index: number) => {
    const newDates = [...(recurringSettings.customDates || [])];
    newDates.splice(index, 1);
    onRecurringSettingsChange({ customDates: newDates });
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Event Scheduling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="date">Event Date *</Label>
            <Controller
              name="date"
              control={control}
              rules={{ required: 'Event date is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="date"
                  type="date"
                  className="bg-white/10 border-white/20 text-white"
                />
              )}
            />
            {errors.date && (
              <p className="text-red-400 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="doorsTime">Doors Time</Label>
            <Controller
              name="doorsTime"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    {...field}
                    id="doorsTime"
                    type="time"
                    className="bg-white/10 border-white/20 text-white pl-10"
                    placeholder="Optional"
                  />
                </div>
              )}
            />
          </div>

          <div>
            <Label htmlFor="time">Start Time *</Label>
            <Controller
              name="time"
              control={control}
              rules={{ required: 'Start time is required' }}
              render={({ field }) => (
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    {...field}
                    id="time"
                    type="time"
                    className="bg-white/10 border-white/20 text-white pl-10"
                  />
                </div>
              )}
            />
            {errors.time && (
              <p className="text-red-400 text-sm mt-1">{errors.time.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    {...field}
                    id="endTime"
                    type="time"
                    className="bg-white/10 border-white/20 text-white pl-10"
                  />
                </div>
              )}
            />
          </div>
        </div>

        {/* Recurring Event Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRecurring"
              checked={recurringSettings.isRecurring}
              onCheckedChange={(checked) => {
                if (checked !== recurringSettings.isRecurring) {
                  onRecurringSettingsChange({ isRecurring: !!checked });
                }
              }}
              className="border-white/20"
            />
            <Label htmlFor="isRecurring" className="text-sm font-medium">
              This is a recurring event
            </Label>
          </div>

          {recurringSettings.isRecurring && (
            <div className="space-y-4 pl-6 border-l-2 border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pattern">Recurrence Pattern</Label>
                  <Select 
                    key="recurrence-pattern-select"
                    value={recurringSettings.pattern} 
                    onValueChange={handlePatternSelect}
                    open={isPatternSelectOpen}
                    onOpenChange={handlePatternOpenChange}
                  >
                    <SelectTrigger 
                      type="button"
                      className="bg-white/10 border-white/20 text-white"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">
                        Weekly
                      </SelectItem>
                      <SelectItem value="biweekly">
                        Bi-weekly
                      </SelectItem>
                      <SelectItem value="monthly">
                        Monthly
                      </SelectItem>
                      <SelectItem value="custom">
                        Custom Dates
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className={recurringSettings.pattern === 'custom' ? 'opacity-0 pointer-events-none' : ''}>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={localEndDate}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    onBlur={handleEndDateBlur}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              {recurringSettings.pattern === 'custom' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Custom Dates</Label>
                    <Button
                      type="button"
                      onClick={addCustomDate}
                      size="sm"
                      className="professional-button border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Date
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {recurringSettings.customDates?.map((date, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={date}
                          onChange={(e) => {
                            const newDates = [...(recurringSettings.customDates || [])];
                            newDates[index] = e.target.value;
                            onRecurringSettingsChange({ customDates: newDates });
                          }}
                          type="date"
                          className="bg-white/10 border-white/20 text-white flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => removeCustomDate(index)}
                          size="sm"
                          variant="destructive"
                          className="px-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};