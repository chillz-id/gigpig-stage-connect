import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { eventsApi } from '@/services/api/events';
import { UpdateEventData } from '@/types/event';
import { 
  withEventErrorHandling, 
  validateEventData,
  handleEventUpdateError 
} from '@/utils/eventErrorHandling';
import { errorService } from '@/services/errorService';

export interface UseUpdateEventReturn {
  updateEvent: (eventId: string, data: UpdateEventData) => Promise<boolean>;
  isUpdating: boolean;
  error: Error | null;
  validationErrors: Record<string, string>;
  clearErrors: () => void;
}

export function useUpdateEvent(): UseUpdateEventReturn {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const clearErrors = () => {
    setError(null);
    setValidationErrors({});
  };

  const updateEvent = async (eventId: string, data: UpdateEventData): Promise<boolean> => {
    try {
      setIsUpdating(true);
      clearErrors();

      // Client-side validation
      const validation = validateEventData(data);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        
        // Log validation errors
        await errorService.logError(
          new Error('Event update validation failed'),
          {
            category: 'validation_error',
            severity: 'low',
            component: 'EventUpdate',
            action: 'validate_event_update',
            metadata: {
              eventId,
              errors: validation.errors,
              updateData: {
                title: data.title,
                venue: data.venue,
                date: data.event_date,
              },
            },
          }
        );

        // Show toast with first validation error
        const firstError = Object.values(validation.errors)[0];
        toast({
          title: 'Validation Error',
          description: firstError,
          variant: 'destructive',
        });
        
        return false;
      }

      // Update event with enhanced error handling
      const result = await withEventErrorHandling(
        async () => {
          const response = await eventsApi.update(eventId, data);
          
          if (response.error) {
            throw response.error;
          }
          
          if (!response.data) {
            throw new Error('Event update failed - no data returned');
          }
          
          return response.data;
        },
        {
          action: 'update',
          eventId,
          eventData: data,
        }
      );

      if (result) {
        // Success - log successful update
        await errorService.logError(
          'Event updated successfully',
          {
            category: 'api_error', // Using as info/success log
            severity: 'low',
            component: 'EventUpdate',
            action: 'update_event_success',
            metadata: {
              eventId: result.id,
              eventTitle: result.title,
              updatedFields: Object.keys(data),
            },
            showToast: false,
            logToService: true,
          }
        );

        // Show success toast
        toast({
          title: 'Event Updated',
          description: `"${result.title}" has been updated successfully.`,
        });

        return true;
      }
      
      return false;
    } catch (unexpectedError) {
      // Handle any unexpected errors that weren't caught
      console.error('Unexpected error in updateEvent:', unexpectedError);
      
      setError(unexpectedError as Error);
      
      await errorService.logError(unexpectedError as Error, {
        category: 'unknown_error',
        severity: 'high',
        component: 'EventUpdate',
        action: 'update_event_unexpected',
        metadata: {
          eventId,
          updateData: {
            title: data.title,
            venue: data.venue,
            date: data.event_date,
          },
        },
      });

      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again or contact support.',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateEvent,
    isUpdating,
    error,
    validationErrors,
    clearErrors,
  };
}