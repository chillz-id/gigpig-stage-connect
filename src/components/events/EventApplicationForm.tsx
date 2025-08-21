import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useEventApplications } from '@/hooks/useEventApplications';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  message: z.string().min(10, {
    message: "Please provide a message with at least 10 characters",
  }),
  spotType: z.enum(['spot', 'feature', 'headline', 'mc'], {
    required_error: "Please select a spot type",
  }),
  availabilityConfirmed: z.boolean().refine((val) => val === true, {
    message: "You must confirm your availability",
  }),
  requirementsAcknowledged: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge the performance requirements",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface EventApplicationFormProps {
  eventId: string;
  eventTitle?: string;
  eventDate?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const EventApplicationForm: React.FC<EventApplicationFormProps> = ({
  eventId,
  eventTitle,
  eventDate,
  onCancel,
  onSuccess,
}) => {
  const { applyToEvent, isApplying } = useEventApplications(eventId);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
      spotType: undefined,
      availabilityConfirmed: false,
      requirementsAcknowledged: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Convert spot type to match database constraint (capitalize first letter)
      const spotTypeMap: Record<string, string> = {
        'spot': 'Guest',
        'feature': 'Feature',
        'headline': 'Headliner',
        'mc': 'MC'
      };
      
      await applyToEvent({
        event_id: eventId,
        message: data.message,
        status: 'pending',
        spot_type: spotTypeMap[data.spotType] || 'Feature',
        availability_confirmed: data.availabilityConfirmed,
        requirements_acknowledged: data.requirementsAcknowledged
      });
      
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting application:', error);
    }
  };

  const spotTypeOptions = [
    { value: 'spot', label: 'Regular Spot' },
    { value: 'feature', label: 'Feature Act' },
    { value: 'headline', label: 'Headliner' },
    { value: 'mc', label: 'MC/Host' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {eventTitle && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{eventTitle}</h3>
            {eventDate && (
              <p className="text-sm text-muted-foreground">
                {new Date(eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Letter / Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us why you'd be a great fit for this event..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Share your experience, style, and why you're interested in performing at this event.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="spotType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Spot Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your preferred spot type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {spotTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the type of performance spot you're applying for.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="availabilityConfirmed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I confirm my availability for this event
                </FormLabel>
                <FormDescription>
                  I understand that if selected, I am expected to arrive on time and perform as scheduled.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requirementsAcknowledged"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I acknowledge the performance requirements
                </FormLabel>
                <FormDescription>
                  I have read and understand all event requirements including performance duration, content guidelines, and venue rules.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={isApplying}
            className="flex-1"
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isApplying}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};