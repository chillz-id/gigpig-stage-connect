import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { eventsApi } from '@/services/api/events';
import { CreateEventData } from '@/types/event';
import { 
  withEventErrorHandling, 
  validateEventData,
  handleEventCreationError 
} from '@/utils/eventErrorHandling';
import { errorService } from '@/services/errorService';

export interface UseCreateEventReturn {
  createEvent: (data: CreateEventData) => Promise<any>;
  isCreating: boolean;
  error: Error | null;
  validationErrors: Record<string, string>;
  clearErrors: () => void;
}

export function useCreateEvent(): UseCreateEventReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const clearErrors = () => {
    setError(null);
    setValidationErrors({});
  };

  const createEvent = async (data: CreateEventData) => {
    try {
      setIsCreating(true);
      clearErrors();

      // Client-side validation
      const validation = validateEventData(data);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        
        // Log validation errors
        await errorService.logError(
          new Error('Event validation failed'),
          {
            category: 'validation_error',
            severity: 'low',
            component: 'EventCreation',
            action: 'validate_event',
            metadata: {
              errors: validation.errors,
              eventData: {
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
        
        return;
      }

      // Create event with enhanced error handling
      const result = await withEventErrorHandling(
        async () => {
          const response = await eventsApi.create(data);
          
          if (response.error) {
            throw response.error;
          }
          
          if (!response.data) {
            throw new Error('Event creation failed - no data returned');
          }
          
          return response.data;
        },
        {
          action: 'create',
          eventData: data,
        }
      );

      if (result) {
        // Success - log successful creation
        await errorService.logError(
          'Event created successfully',
          {
            category: 'api_error', // Using as info/success log
            severity: 'low',
            component: 'EventCreation',
            action: 'create_event_success',
            metadata: {
              eventId: result.id,
              eventTitle: result.title,
            },
            showToast: false,
            logToService: true,
          }
        );

        // Show success toast
        toast({
          title: 'Event Created',
          description: `"${result.title}" has been created successfully.`,
        });

        // Navigate to admin event detail page only if not a draft
        if (data.status !== 'draft') {
          navigate(`/admin/events/${result.id}`);
        }
        
        // Return the created event
        return result;
      }
    } catch (unexpectedError) {
      // Handle any unexpected errors that weren't caught
      console.error('Unexpected error in createEvent:', unexpectedError);
      
      setError(unexpectedError as Error);
      
      await errorService.logError(unexpectedError as Error, {
        category: 'unknown_error',
        severity: 'high',
        component: 'EventCreation',
        action: 'create_event_unexpected',
        metadata: {
          eventData: {
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
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createEvent,
    isCreating,
    error,
    validationErrors,
    clearErrors,
  };
}