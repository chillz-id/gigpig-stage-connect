import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const bookingInquirySchema = z.object({
  event_date: z.string().min(1, 'Event date is required'),
  event_time: z.string().optional(),
  event_details: z.string().min(10, 'Please provide at least 10 characters of event details'),
  budget: z.string().optional(),
});

type BookingInquiryFormData = z.infer<typeof bookingInquirySchema>;

interface BookingInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  comedianId: string;
  comedianName: string;
}

export const BookingInquiryModal: React.FC<BookingInquiryModalProps> = ({
  isOpen,
  onClose,
  comedianId,
  comedianName,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingInquiryFormData>({
    resolver: zodResolver(bookingInquirySchema),
  });

  const createInquiryMutation = useMutation({
    mutationFn: async (data: BookingInquiryFormData) => {
      if (!user) throw new Error('You must be logged in to send a booking inquiry');

      const { data: inquiry, error } = await supabase
        .from('booking_inquiries')
        .insert({
          comedian_id: comedianId,
          inquirer_id: user.id,
          event_date: data.event_date,
          event_time: data.event_time || null,
          event_details: data.event_details,
          budget: data.budget ? parseFloat(data.budget) : null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return inquiry;
    },
    onSuccess: () => {
      toast({
        title: 'Booking inquiry sent!',
        description: `Your booking inquiry has been sent to ${comedianName}. They will be notified and will respond soon.`,
      });
      queryClient.invalidateQueries({ queryKey: ['booking-inquiries'] });
      reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send inquiry',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: BookingInquiryFormData) => {
    createInquiryMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book {comedianName}</DialogTitle>
          <DialogDescription>
            Send a booking inquiry with your event details. {comedianName} will be notified and will respond to your request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event_date">
              Event Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="event_date"
              type="date"
              {...register('event_date')}
              className={errors.event_date ? 'border-red-500' : ''}
            />
            {errors.event_date && (
              <p className="text-sm text-red-500">{errors.event_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_time">Event Time</Label>
            <Input
              id="event_time"
              type="time"
              {...register('event_time')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_details">
              Event Details <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="event_details"
              placeholder="Tell us about your event: type of event, expected audience size, venue location, duration, etc."
              rows={5}
              {...register('event_details')}
              className={errors.event_details ? 'border-red-500' : ''}
            />
            {errors.event_details && (
              <p className="text-sm text-red-500">{errors.event_details.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget (AUD)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              placeholder="500.00"
              {...register('budget')}
            />
            <p className="text-sm text-muted-foreground">
              Optional: Your budget for this performance
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 professional-button"
              disabled={isSubmitting || !user}
            >
              {isSubmitting ? 'Sending...' : 'Send Inquiry'}
            </Button>
          </div>

          {!user && (
            <p className="text-sm text-center text-muted-foreground">
              You must be logged in to send a booking inquiry
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
