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
import { EventBannerUpload } from '@/components/gigs/EventBannerUpload';
import { CalendarIcon, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface AddGigFormData {
  title: string;
  venue?: string;
  date: Date;
  endTime?: string;
  description?: string;
  ticket_link?: string;
  banner_url?: string;
  source: 'manual' | 'google_import';
}

interface AddGigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddGigFormData) => Promise<void>;
  onImportFromGoogle?: () => void;
  initialData?: Partial<AddGigFormData>;
}

/**
 * AddGigModal Component
 *
 * Modal for adding personal gigs to calendar:
 * - Manual gig entry with title, venue, date, time, notes
 * - Optional Google Calendar import button
 * - Form validation
 * - Saves to personal_gigs table
 */
export const AddGigModal: React.FC<AddGigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onImportFromGoogle,
  initialData,
}) => {
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [venue, setVenue] = useState<string>(initialData?.venue || '');
  const [date, setDate] = useState<Date | undefined>(initialData?.date || undefined);
  const [time, setTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>(initialData?.endTime || '');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [ticketLink, setTicketLink] = useState<string>(initialData?.ticket_link || '');
  const [bannerUrl, setBannerUrl] = useState<string>(initialData?.banner_url || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Gig title is required';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (!time) {
      newErrors.time = 'Start time is required';
    }

    // If end time is specified, validate it's after start time
    if (time && endTime) {
      const [startHour, startMin] = time.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !date || !time) {
      return;
    }

    // Combine date and time into ISO timestamp
    const [hours, minutes] = time.split(':').map(Number);
    const gigDate = new Date(date);
    gigDate.setHours(hours, minutes, 0, 0);

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        venue: venue.trim() || undefined,
        date: gigDate,
        endTime: endTime || undefined,
        description: description.trim() || undefined,
        ticket_link: ticketLink.trim() || undefined,
        banner_url: bannerUrl || undefined,
        source: 'manual',
      });
      handleClose();
    } catch (error) {
      console.error('Error saving gig:', error);
      setErrors({ submit: 'Failed to save gig. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setVenue('');
    setDate(undefined);
    setTime('');
    setEndTime('');
    setDescription('');
    setTicketLink('');
    setBannerUrl('');
    setErrors({});
    onClose();
  };

  const handleImportClick = () => {
    if (onImportFromGoogle) {
      onImportFromGoogle();
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Personal Gig</DialogTitle>
          <DialogDescription>
            Add a gig to your calendar manually or import from Google Calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Google Calendar Import Button */}
          {onImportFromGoogle && (
            <div className="flex flex-col gap-2 pb-2 border-b">
              <Button
                type="button"
                variant="secondary"
                onClick={handleImportClick}
                className="w-full"
                disabled={isSaving}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Import from Google Calendar
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Or manually enter gig details below
              </p>
            </div>
          )}

          {/* Event Banner */}
          <div className="flex flex-col gap-2">
            <Label>Event Banner (Optional)</Label>
            <EventBannerUpload
              onBannerSelected={setBannerUrl}
              currentBannerUrl={bannerUrl}
            />
          </div>

          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Gig Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Open Mic Night at Comedy Store"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Venue */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="venue">Venue (optional)</Label>
            <Input
              id="venue"
              placeholder="e.g., The Comedy Store"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="secondary"
                  className={cn(
                    'justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                    errors.date && 'border-red-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-xs text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="time" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Start Time *
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={errors.time ? 'border-red-500' : ''}
              />
              {errors.time && (
                <p className="text-xs text-red-500">{errors.time}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="end-time" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                End Time (optional)
              </Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={errors.endTime ? 'border-red-500' : ''}
              />
              {errors.endTime && (
                <p className="text-xs text-red-500">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Show Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Show Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your show, what makes it special, what the audience can expect..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Ticket Link */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="ticket_link">Ticket Link (optional)</Label>
            <Input
              id="ticket_link"
              type="url"
              placeholder="https://humanitix.com/... or https://eventbrite.com/..."
              value={ticketLink}
              onChange={(e) => setTicketLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Where customers can buy tickets. This will appear on your public EPK.
            </p>
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
            {isSaving ? 'Adding...' : 'Add Gig'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
