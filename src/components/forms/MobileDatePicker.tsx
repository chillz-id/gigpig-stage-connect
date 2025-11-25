/**
 * MobileDatePicker Component
 *
 * Mobile-optimized date picker with:
 * - Native HTML5 date input on mobile (best UX)
 * - Calendar popover on desktop
 * - 44px touch targets
 * - Clear error states
 * - Time picker support
 * - Date range support
 */

import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '@/hooks/useMobileLayout';

interface MobileDatePickerProps {
  /** Selected date */
  value: Date | undefined;
  /** Callback when date changes */
  onChange: (date: Date | undefined) => void;
  /** Field label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required field */
  required?: boolean;
  /** Include time picker (shows time input on mobile) */
  includeTime?: boolean;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Additional CSS classes */
  className?: string;
}

export function MobileDatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  error,
  disabled = false,
  required = false,
  includeTime = false,
  minDate,
  maxDate,
  className
}: MobileDatePickerProps) {
  const { isMobile } = useMobileLayout();

  // Format date for native input (YYYY-MM-DD or YYYY-MM-DDTHH:mm)
  const formatForNativeInput = (date: Date | undefined): string => {
    if (!date) return '';
    if (includeTime) {
      return format(date, "yyyy-MM-dd'T'HH:mm");
    }
    return format(date, 'yyyy-MM-dd');
  };

  // Parse native input value to Date
  const parseNativeInput = (value: string): Date | undefined => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  // Handle native input change
  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseNativeInput(e.target.value);
    onChange(parsed);
  };

  // Mobile: Use native HTML5 date/datetime-local input
  if (isMobile) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Input
          type={includeTime ? 'datetime-local' : 'date'}
          value={formatForNativeInput(value)}
          onChange={handleNativeChange}
          disabled={disabled}
          required={required}
          min={minDate ? formatForNativeInput(minDate) : undefined}
          max={maxDate ? formatForNativeInput(maxDate) : undefined}
          className={cn(
            "h-11 touch-target-44",
            error && "border-red-500 focus-visible:ring-red-500"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? 'date-error' : undefined}
        />
        {error && (
          <p id="date-error" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Desktop: Use calendar popover
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? 'date-error' : undefined}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              includeTime ? (
                format(value, 'PPp')
              ) : (
                format(value, 'PPP')
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            disabled={(date) => {
              if (disabled) return true;
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
          />
          {includeTime && value && (
            <div className="p-3 border-t">
              <Label className="text-sm font-medium mb-2 block">Time</Label>
              <Input
                type="time"
                value={format(value, 'HH:mm')}
                onChange={(e) => {
                  if (!value) return;
                  const [hours, minutes] = e.target.value.split(':').map(Number);
                  const newDate = new Date(value);
                  newDate.setHours(hours, minutes);
                  onChange(newDate);
                }}
                className="h-9"
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
      {error && (
        <p id="date-error" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default MobileDatePicker;
