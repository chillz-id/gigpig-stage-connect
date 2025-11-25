import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CalendarDays, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onClear?: () => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  onClear,
  className
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleStartDateChange = (dateString: string) => {
    const date = dateString ? new Date(dateString) : null;
    onChange({ ...value, start: date });
  };

  const handleEndDateChange = (dateString: string) => {
    const date = dateString ? new Date(dateString) : null;
    onChange({ ...value, end: date });
  };

  const clearDateRange = () => {
    onChange({ start: null, end: null });
    onClear?.();
    setIsOpen(false);
  };

  const getQuickSelectPresets = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return [
      {
        label: 'Today',
        range: { start: today, end: today }
      },
      {
        label: 'Tomorrow',
        range: { 
          start: new Date(today.getTime() + 24 * 60 * 60 * 1000), 
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
        }
      },
      {
        label: 'This Week',
        range: {
          start: new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000),
          end: new Date(today.getTime() + (6 - today.getDay()) * 24 * 60 * 60 * 1000)
        }
      },
      {
        label: 'Next Week',
        range: {
          start: new Date(today.getTime() + (7 - today.getDay()) * 24 * 60 * 60 * 1000),
          end: new Date(today.getTime() + (13 - today.getDay()) * 24 * 60 * 60 * 1000)
        }
      },
      {
        label: 'This Month',
        range: {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        }
      },
      {
        label: 'Next Month',
        range: {
          start: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          end: new Date(now.getFullYear(), now.getMonth() + 2, 0)
        }
      },
      {
        label: 'Next 30 Days',
        range: {
          start: today,
          end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    ];
  };

  const handlePresetClick = (preset: { label: string; range: DateRange }) => {
    onChange(preset.range);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!value.start && !value.end) {
      return 'Select date range';
    }
    
    if (value.start && value.end) {
      if (value.start.getTime() === value.end.getTime()) {
        return value.start.toLocaleDateString();
      }
      return `${value.start.toLocaleDateString()} - ${value.end.toLocaleDateString()}`;
    }
    
    if (value.start) {
      return `From ${value.start.toLocaleDateString()}`;
    }
    
    if (value.end) {
      return `Until ${value.end.toLocaleDateString()}`;
    }
    
    return 'Select date range';
  };

  const hasSelection = value.start || value.end;

  const getButtonStyles = () => {
    if (theme === 'pleasure') {
      return "bg-white/[0.08] border-0 backdrop-blur-md text-white shadow-lg shadow-black/10 hover:bg-white/[0.12]";
    }
    return "bg-gray-800/60 border-0 backdrop-blur-md text-gray-100 shadow-lg shadow-black/20 hover:bg-gray-700/60";
  };

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return "bg-white/[0.12] backdrop-blur-md border-white/[0.20] text-white";
    }
    return "bg-gray-800/90 border-gray-600 text-gray-100";
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            className="professional-button"
            className={cn(
              "w-full justify-between rounded-xl",
              getButtonStyles()
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span>{getDisplayText()}</span>
            </div>
            {hasSelection && (
              <Badge variant="secondary" className="ml-2">
                {value.start && value.end ? '2' : '1'} date{value.start && value.end ? 's' : ''}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-80 p-0", getCardStyles())} align="start">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Select Date Range
                </CardTitle>
                {hasSelection && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateRange}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Select Presets */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Quick Select</Label>
                <div className="grid grid-cols-2 gap-2">
                  {getQuickSelectPresets().map((preset) => (
                    <Button
                      key={preset.label}
                      className="professional-button"
                      size="sm"
                      onClick={() => handlePresetClick(preset)}
                      className="text-xs"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Custom Range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={formatDateForInput(value.start)}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-xs">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={formatDateForInput(value.end)}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      min={formatDateForInput(value.start)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                  size="sm"
                >
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};