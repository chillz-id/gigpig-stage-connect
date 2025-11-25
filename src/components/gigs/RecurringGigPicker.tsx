import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Repeat } from 'lucide-react';
import { format } from 'date-fns';

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

  // Custom props
  customDates: Date[];
  onCustomDatesChange: (dates: Date[]) => void;

  // Common props
  endDate?: Date;
  onEndDateChange: (date: Date | undefined) => void;
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
  endDate,
  onEndDateChange,
}) => {
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
              selected={customDates}
              onSelect={(dates) => onCustomDatesChange(dates || [])}
              disabled={(date) => date < new Date()}
              className="rounded-md border border-white/20 bg-white/5"
            />
            {customDates.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-white font-medium">
                  Selected dates ({customDates.length}):
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {customDates
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date, index) => (
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

      {pattern === 'custom' && customDates.length > 0 && (
        <div className="text-sm text-purple-300 bg-purple-400/10 p-3 rounded-lg">
          This event will occur on {customDates.length} selected date{customDates.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
