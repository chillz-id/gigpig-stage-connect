import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Repeat, ChevronDown, ChevronRight, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// New type for custom dates with individual times
export interface CustomDateWithTime {
  date: Date;
  startTime: string;  // "19:00"
  endTime: string;    // "21:00"
}

interface RecurringGigPickerProps {
  pattern: 'weekly' | 'monthly' | 'custom';
  onPatternChange: (pattern: 'weekly' | 'monthly' | 'custom') => void;

  // Weekly props
  frequency: number;
  onFrequencyChange: (freq: number) => void;
  dayOfWeek?: number;
  onDayOfWeekChange: (day: number) => void;

  // Monthly props
  dayOfMonth?: number;
  onDayOfMonthChange: (day: number) => void;

  // Custom props - supports both legacy Date[] and new CustomDateWithTime[]
  customDates: Date[] | CustomDateWithTime[];
  onCustomDatesChange: (dates: Date[] | CustomDateWithTime[]) => void;

  // Default times for new custom dates (inherited from main form)
  defaultStartTime?: string;
  defaultEndTime?: string;

  // Enable per-date time editing (for org events)
  enablePerDateTimes?: boolean;

  // Common props
  endDate?: Date;
  onEndDateChange: (date: Date | undefined) => void;
}

// Helper to check if array is CustomDateWithTime[]
function isCustomDateWithTimeArray(arr: Date[] | CustomDateWithTime[]): arr is CustomDateWithTime[] {
  if (arr.length === 0) return false;
  const first = arr[0];
  return typeof first === 'object' && 'startTime' in first && 'endTime' in first;
}

// Helper to extract Date from either format
function extractDate(item: Date | CustomDateWithTime): Date {
  if (item instanceof Date) return item;
  return item.date;
}

export const RecurringGigPicker: React.FC<RecurringGigPickerProps> = ({
  pattern,
  onPatternChange,
  frequency,
  onFrequencyChange,
  dayOfWeek,
  onDayOfWeekChange,
  dayOfMonth,
  onDayOfMonthChange,
  customDates,
  onCustomDatesChange,
  defaultStartTime = '19:00',
  defaultEndTime = '21:00',
  enablePerDateTimes = false,
  endDate,
  onEndDateChange,
}) => {
  const [expandedDateIndex, setExpandedDateIndex] = useState<number | null>(null);

  const daysOfWeek = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Convert custom dates to CustomDateWithTime[] for internal use
  const customDatesWithTime: CustomDateWithTime[] = enablePerDateTimes
    ? isCustomDateWithTimeArray(customDates)
      ? customDates
      : customDates.map(date => ({
          date,
          startTime: defaultStartTime,
          endTime: defaultEndTime,
        }))
    : [];

  // Get plain dates for calendar selection
  const selectedDates = customDates.map(extractDate);

  // Handle calendar date selection
  const handleCalendarSelect = (dates: Date[] | undefined) => {
    if (!dates) {
      onCustomDatesChange([]);
      return;
    }

    if (enablePerDateTimes) {
      // For per-date times mode, preserve existing times for dates that were already selected
      const existingDateMap = new Map(
        customDatesWithTime.map(d => [d.date.toDateString(), d])
      );

      const newDatesWithTime: CustomDateWithTime[] = dates.map(date => {
        const existing = existingDateMap.get(date.toDateString());
        if (existing) {
          return existing;
        }
        return {
          date,
          startTime: defaultStartTime,
          endTime: defaultEndTime,
        };
      });

      onCustomDatesChange(newDatesWithTime);
    } else {
      // Legacy mode - just pass dates
      onCustomDatesChange(dates);
    }
  };

  // Handle time update for a specific date
  const handleTimeUpdate = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...customDatesWithTime];
    updated[index] = { ...updated[index], [field]: value };
    onCustomDatesChange(updated);
  };

  // Remove a specific date
  const handleRemoveDate = (index: number) => {
    if (enablePerDateTimes) {
      const updated = customDatesWithTime.filter((_, i) => i !== index);
      onCustomDatesChange(updated);
    } else {
      const updated = selectedDates.filter((_, i) => i !== index);
      onCustomDatesChange(updated);
    }
    setExpandedDateIndex(null);
  };

  // Toggle date expansion
  const toggleDateExpansion = (index: number) => {
    setExpandedDateIndex(expandedDateIndex === index ? null : index);
  };

  // Sort dates for display
  const sortedDatesWithTime = [...customDatesWithTime].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());

  return (
    <div className="space-y-4 p-4 border border-white/20 rounded-lg bg-white/5">
      <div className="flex items-center gap-2 text-white">
        <Repeat className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold">Recurring Event Pattern</h3>
      </div>

      <Tabs value={pattern} onValueChange={(value) => onPatternChange(value as 'weekly' | 'monthly' | 'custom')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        {/* Weekly Pattern */}
        <TabsContent value="weekly" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weekly-frequency" className="text-white">Frequency</Label>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">Every</span>
              <Input
                id="weekly-frequency"
                type="number"
                min="1"
                max="52"
                value={frequency}
                onChange={(e) => onFrequencyChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-white/10 border-white/20 text-white"
              />
              <span className="text-white text-sm">week(s)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">On day</Label>
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => onDayOfWeekChange(day.value)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${dayOfWeek === day.value
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }
                    border
                  `}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekly-end-date" className="text-white">Ends on (optional)</Label>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              disabled={(date) => date < new Date()}
              className="rounded-md border border-white/20 bg-white/5"
            />
            {endDate && (
              <p className="text-sm text-gray-300">
                Ends: {format(endDate, 'PPP')}
              </p>
            )}
          </div>
        </TabsContent>

        {/* Monthly Pattern */}
        <TabsContent value="monthly" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthly-frequency" className="text-white">Frequency</Label>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">Every</span>
              <Input
                id="monthly-frequency"
                type="number"
                min="1"
                max="12"
                value={frequency}
                onChange={(e) => onFrequencyChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-white/10 border-white/20 text-white"
              />
              <span className="text-white text-sm">month(s)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="day-of-month" className="text-white">On day</Label>
            <Select
              value={dayOfMonth?.toString()}
              onValueChange={(value) => onDayOfMonthChange(parseInt(value))}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select day of month" />
              </SelectTrigger>
              <SelectContent>
                {daysOfMonth.map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly-end-date" className="text-white">Ends on (optional)</Label>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              disabled={(date) => date < new Date()}
              className="rounded-md border border-white/20 bg-white/5"
            />
            {endDate && (
              <p className="text-sm text-gray-300">
                Ends: {format(endDate, 'PPP')}
              </p>
            )}
          </div>
        </TabsContent>

        {/* Custom Pattern */}
        <TabsContent value="custom" className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Select specific dates</Label>
            <p className="text-sm text-gray-300">
              Choose multiple dates when this event will occur
            </p>
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={handleCalendarSelect}
              disabled={(date) => date < new Date()}
              className="rounded-md border border-white/20 bg-white/5"
            />

            {/* Selected dates with per-date time editing */}
            {enablePerDateTimes && sortedDatesWithTime.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm text-white font-medium">
                  Selected dates ({sortedDatesWithTime.length}):
                </p>
                <div className="space-y-1">
                  {sortedDatesWithTime.map((dateWithTime, index) => {
                    const isExpanded = expandedDateIndex === index;
                    return (
                      <div
                        key={dateWithTime.date.toISOString()}
                        className="border border-white/20 rounded-lg overflow-hidden bg-white/5"
                      >
                        {/* Date header - clickable to expand */}
                        <button
                          type="button"
                          onClick={() => toggleDateExpansion(index)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-purple-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-white text-sm">
                              {format(dateWithTime.date, 'EEE, MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {dateWithTime.startTime} - {dateWithTime.endTime}
                            </span>
                          </div>
                        </button>

                        {/* Expandable time editor */}
                        <div
                          className={cn(
                            'overflow-hidden transition-all duration-200 ease-in-out',
                            isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                          )}
                        >
                          <div className="px-3 py-3 border-t border-white/10 bg-white/5 space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <Label className="text-gray-300 text-xs">Start:</Label>
                                <Input
                                  type="time"
                                  value={dateWithTime.startTime}
                                  onChange={(e) => handleTimeUpdate(index, 'startTime', e.target.value)}
                                  className="w-28 h-8 bg-white/10 border-white/20 text-white text-sm"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-gray-300 text-xs">End:</Label>
                                <Input
                                  type="time"
                                  value={dateWithTime.endTime}
                                  onChange={(e) => handleTimeUpdate(index, 'endTime', e.target.value)}
                                  className="w-28 h-8 bg-white/10 border-white/20 text-white text-sm"
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDate(index)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-7"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Remove Date
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legacy display for non-per-date-time mode */}
            {!enablePerDateTimes && sortedDates.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-white font-medium">
                  Selected dates ({sortedDates.length}):
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {sortedDates.map((date, index) => (
                    <p key={index} className="text-xs text-gray-300">
                      • {format(date, 'PPP')}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview text */}
      {pattern === 'weekly' && dayOfWeek !== undefined && (
        <div className="text-sm text-purple-300 bg-purple-400/10 p-3 rounded-lg">
          This event will repeat every {frequency > 1 ? `${frequency} weeks` : 'week'} on{' '}
          {daysOfWeek.find(d => d.value === dayOfWeek)?.label}
          {endDate && ` until ${format(endDate, 'PP')}`}
        </div>
      )}

      {pattern === 'monthly' && dayOfMonth !== undefined && (
        <div className="text-sm text-purple-300 bg-purple-400/10 p-3 rounded-lg">
          This event will repeat every {frequency > 1 ? `${frequency} months` : 'month'} on day {dayOfMonth}
          {endDate && ` until ${format(endDate, 'PP')}`}
        </div>
      )}

      {pattern === 'custom' && selectedDates.length > 0 && (
        <div className="text-sm text-purple-300 bg-purple-400/10 p-3 rounded-lg">
          This event will occur on {selectedDates.length} selected date{selectedDates.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
