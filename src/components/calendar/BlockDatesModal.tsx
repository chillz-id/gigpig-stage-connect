import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export type RecurringType = 'none' | 'weekly' | 'monthly' | 'yearly';

export interface BlockDatesFormData {
  dateStart: Date;
  dateEnd: Date;
  timeStart?: string;
  timeEnd?: string;
  reason: string;
  recurringType: RecurringType;
}

interface BlockDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BlockDatesFormData) => Promise<void>;
  initialData?: Partial<BlockDatesFormData>;
}

/**
 * BlockDatesModal Component
 *
 * Modal for blocking date ranges with optional time-specific blocks:
 * - Date range picker (start/end dates)
 * - Optional time pickers for partial day blocks
 * - Reason text field
 * - Recurring type selector (None/Weekly/Monthly/Yearly)
 * - Validation for dates and times
 */
export const BlockDatesModal: React.FC<BlockDatesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [dateStart, setDateStart] = useState<Date | undefined>(
    initialData?.dateStart || undefined
  );
  const [dateEnd, setDateEnd] = useState<Date | undefined>(
    initialData?.dateEnd || undefined
  );
  const [timeStart, setTimeStart] = useState<string>(initialData?.timeStart || '');
  const [timeEnd, setTimeEnd] = useState<string>(initialData?.timeEnd || '');
  const [reason, setReason] = useState<string>(initialData?.reason || '');
  const [recurringType, setRecurringType] = useState<RecurringType>(
    initialData?.recurringType || 'none'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!dateStart) {
      newErrors.dateStart = 'Start date is required';
    }

    if (!dateEnd) {
      newErrors.dateEnd = 'End date is required';
    }

    if (dateStart && dateEnd && dateEnd < dateStart) {
      newErrors.dateEnd = 'End date must be after start date';
    }

    // If both times are specified, validate time order
    if (timeStart && timeEnd) {
      const [startHour, startMin] = timeStart.split(':').map(Number);
      const [endHour, endMin] = timeEnd.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        newErrors.timeEnd = 'End time must be after start time';
      }
    }

    // If only one time is specified, require both
    if ((timeStart && !timeEnd) || (!timeStart && timeEnd)) {
      newErrors.time = 'Both start and end times are required for time-specific blocks';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !dateStart || !dateEnd) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        dateStart,
        dateEnd,
        timeStart: timeStart || undefined,
        timeEnd: timeEnd || undefined,
        reason: reason.trim(),
        recurringType,
      });
      handleClose();
    } catch (error) {
      console.error('Error saving blocked dates:', error);
      setErrors({ submit: 'Failed to save blocked dates. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setDateStart(undefined);
    setDateEnd(undefined);
    setTimeStart('');
    setTimeEnd('');
    setReason('');
    setRecurringType('none');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Block Dates</DialogTitle>
          <DialogDescription>
            Block dates on your calendar to mark when you're unavailable.
            Optionally specify times for partial day blocks.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="date-start">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-start"
                    variant="secondary"
                    className={cn(
                      'justify-start text-left font-normal',
                      !dateStart && 'text-muted-foreground',
                      errors.dateStart && 'border-red-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateStart ? format(dateStart, 'PP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateStart}
                    onSelect={setDateStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dateStart && (
                <p className="text-xs text-red-500">{errors.dateStart}</p>
              )}
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="date-end">End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-end"
                    variant="secondary"
                    className={cn(
                      'justify-start text-left font-normal',
                      !dateEnd && 'text-muted-foreground',
                      errors.dateEnd && 'border-red-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateEnd ? format(dateEnd, 'PP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateEnd}
                    onSelect={setDateEnd}
                    initialFocus
                    disabled={(date) => dateStart ? date < dateStart : false}
                  />
                </PopoverContent>
              </Popover>
              {errors.dateEnd && (
                <p className="text-xs text-red-500">{errors.dateEnd}</p>
              )}
            </div>
          </div>

          {/* Time Range (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="time-start" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Start Time (optional)
              </Label>
              <Input
                id="time-start"
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className={errors.time ? 'border-red-500' : ''}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="time-end" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                End Time (optional)
              </Label>
              <Input
                id="time-end"
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className={cn(errors.time || errors.timeEnd ? 'border-red-500' : '')}
              />
            </div>
          </div>
          {(errors.time || errors.timeEnd) && (
            <p className="text-xs text-red-500 -mt-2">
              {errors.time || errors.timeEnd}
            </p>
          )}

          {/* Recurring Type */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="recurring-type">Recurring Pattern</Label>
            <Select value={recurringType} onValueChange={(value) => setRecurringType(value as RecurringType)}>
              <SelectTrigger id="recurring-type">
                <SelectValue placeholder="Select recurring pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None - Single occurrence</SelectItem>
                <SelectItem value="weekly">Weekly - Repeats every week</SelectItem>
                <SelectItem value="monthly">Monthly - Repeats every month</SelectItem>
                <SelectItem value="yearly">Yearly - Repeats every year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Why are you blocking these dates? (e.g., 'On holiday', 'Medical appointment')"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={errors.reason ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.reason && (
              <p className="text-xs text-red-500">{errors.reason}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Block Dates'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
