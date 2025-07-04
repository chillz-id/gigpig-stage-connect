
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Event = Tables<'events'>;
type EventInsert = TablesInsert<'events'>;
type EventUpdate = TablesUpdate<'events'>;

interface CustomDate {
  date: Date;
  times: Array<{
    startTime: string;
    endTime: string;
  }>;
}

export const useEvents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all events
  const {
    data: events = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data as Event[];
    }
  });

  // Fetch user's events (for promoters)
  const {
    data: userEvents = [],
    isLoading: isLoadingUserEvents
  } = useQuery({
    queryKey: ['user-events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('promoter_id', user.id)
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data as Event[];
    }
  });

  // Create single or recurring events
  const createEventMutation = useMutation({
    mutationFn: async (eventData: EventInsert & { 
      isRecurring?: boolean;
      recurrencePattern?: string;
      recurrenceEndDate?: string;
      customDates?: CustomDate[];
      spotDetails?: Array<{
        spot_name: string;
        is_paid: boolean;
        payment_amount?: number;
        currency: string;
        duration_minutes?: number;
      }>;
    }) => {
      console.log('=== CREATE EVENT MUTATION START ===', eventData);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('=== AUTH ERROR IN CREATE EVENT ===', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      if (!user) {
        console.error('=== NO USER IN CREATE EVENT ===');
        throw new Error('User not authenticated - please log in and try again');
      }
      
      console.log('=== CREATE EVENT: USER AUTHENTICATED ===', { userId: user.id, email: user.email });

      const { spotDetails, isRecurring, recurrencePattern, recurrenceEndDate, customDates, ...baseEventData } = eventData;
      
      // Generate series ID for recurring events
      const seriesId = isRecurring ? crypto.randomUUID() : null;

      let eventsToCreate = [];
      
      if (isRecurring && recurrencePattern === 'custom' && customDates && customDates.length > 0) {
        // Generate events for custom dates with their specific times
        customDates.forEach((customDate, dateIndex) => {
          customDate.times.forEach((timeSlot, timeIndex) => {
            // Create separate events for each time slot
            const eventDateTime = new Date(customDate.date);
            const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
            eventDateTime.setHours(hours, minutes, 0, 0);
            
            eventsToCreate.push({
              ...baseEventData,
              promoter_id: user.id,
              event_date: eventDateTime.toISOString(),
              start_time: timeSlot.startTime,
              end_time: timeSlot.endTime || null,
              is_recurring: true,
              recurrence_pattern: recurrencePattern,
              parent_event_id: dateIndex === 0 && timeIndex === 0 ? null : eventsToCreate[0]?.id || null,
              series_id: seriesId
            });
          });
        });
      } else if (isRecurring && recurrencePattern && recurrenceEndDate) {
        // Generate recurring events
        const startDate = new Date(baseEventData.event_date);
        const endDate = new Date(recurrenceEndDate);
        let currentDate = new Date(startDate);
        let isFirst = true;

        while (currentDate <= endDate) {
          eventsToCreate.push({
            ...baseEventData,
            promoter_id: user.id,
            event_date: currentDate.toISOString(),
            is_recurring: true,
            recurrence_pattern: recurrencePattern,
            parent_event_id: isFirst ? null : eventsToCreate[0]?.id || null,
            series_id: seriesId,
            recurrence_end_date: recurrenceEndDate
          });

          // Increment date based on pattern
          if (recurrencePattern === 'weekly') {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (recurrencePattern === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          
          isFirst = false;
        }
      } else {
        // Single event
        eventsToCreate.push({
          ...baseEventData,
          promoter_id: user.id
        });
      }

      // Insert events
      console.log('=== INSERTING EVENTS ===', eventsToCreate);
      const { data: createdEvents, error } = await supabase
        .from('events')
        .insert(eventsToCreate)
        .select();

      if (error) {
        console.error('=== EVENT CREATION ERROR ===', error);
        throw new Error(`Failed to create event: ${error.message}`);
      }
      
      console.log('=== EVENTS CREATED SUCCESSFULLY ===', createdEvents);

      // Create spots for each event if provided
      if (spotDetails && spotDetails.length > 0) {
        const spotsToCreate = [];
        createdEvents.forEach((event, eventIndex) => {
          spotDetails.forEach((spot, spotIndex) => {
            spotsToCreate.push({
              event_id: event.id,
              spot_name: spot.spot_name,
              is_paid: spot.is_paid,
              payment_amount: spot.payment_amount || 0,
              currency: spot.currency,
              duration_minutes: spot.duration_minutes || 5,
              spot_order: spotIndex + 1
            });
          });
        });

        const { error: spotsError } = await supabase
          .from('event_spots')
          .insert(spotsToCreate);

        if (spotsError) throw spotsError;
      }

      return createdEvents;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      const eventCount = data.length;
      toast({
        title: eventCount > 1 ? "Recurring events created" : "Event created",
        description: eventCount > 1 
          ? `${eventCount} events have been created successfully`
          : "Your event has been created successfully"
      });
    },
    onError: (error) => {
      console.error('=== CREATE EVENT MUTATION ERROR ===', error);
      toast({
        title: "Failed to create event",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }: EventUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      toast({
        title: "Event updated",
        description: "Your event has been updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update event",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      toast({
        title: "Event deleted",
        description: "Your event has been deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete event",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  return {
    events,
    userEvents,
    isLoading,
    isLoadingUserEvents,
    error,
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending
  };
};
