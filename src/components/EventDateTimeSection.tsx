
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Repeat } from 'lucide-react';
import { CustomRecurrencePicker } from '@/components/CustomRecurrencePicker';

interface CustomDate {
  date: Date;
  times: Array<{
    startTime: string;
    endTime: string;
  }>;
}

interface RecurringSettings {
  isRecurring: boolean;
  pattern: string;
  endDate: string;
  customDates: CustomDate[];
}

interface EventDateTimeSectionProps {
  formData: {
    date: string;
    time: string;
    endTime: string;
  };
  recurringSettings: RecurringSettings;
  onFormDataChange: (updates: Partial<EventDateTimeSectionProps['formData']>) => void;
  onRecurringSettingsChange: (updates: Partial<RecurringSettings>) => void;
}

export const EventDateTimeSection: React.FC<EventDateTimeSectionProps> = ({
  formData,
  recurringSettings,
  onFormDataChange,
  onRecurringSettingsChange
}) => {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Date & Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => onFormDataChange({ date: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="time">Start Time *</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => onFormDataChange({ time: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => onFormDataChange({ endTime: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>

        {/* Recurring Events */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Repeat className="w-4 h-4" />
              Recurring Event Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="isRecurring">Create Recurring Event</Label>
              <Switch
                id="isRecurring"
                checked={recurringSettings.isRecurring}
                onCheckedChange={(checked) => onRecurringSettingsChange({ isRecurring: checked })}
              />
            </div>

            {recurringSettings.isRecurring && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pattern">Recurrence Pattern</Label>
                  <Select 
                    value={recurringSettings.pattern} 
                    onValueChange={(value) => onRecurringSettingsChange({ pattern: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom Dates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recurringSettings.pattern === 'custom' ? (
                  <CustomRecurrencePicker
                    selectedDates={recurringSettings.customDates}
                    onDatesChange={(dates) => onRecurringSettingsChange({ customDates: dates })}
                  />
                ) : (
                  <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={recurringSettings.endDate}
                      onChange={(e) => onRecurringSettingsChange({ endDate: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                      required={recurringSettings.isRecurring && recurringSettings.pattern !== 'custom'}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
