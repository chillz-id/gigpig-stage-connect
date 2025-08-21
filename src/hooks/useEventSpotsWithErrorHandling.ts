import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { errorService } from '@/services/errorService';
import { parseEventError } from '@/utils/eventErrorHandling';

export interface EventSpot {
  id?: string;
  event_id: string;
  performer_id: string;
  order_number: number;
  performance_type: string;
  duration_minutes: number;
}

export interface UseEventSpotsReturn {
  addSpot: (eventId: string, spot: Omit<EventSpot, 'id' | 'event_id'>) => Promise<boolean>;
  updateSpot: (spotId: string, updates: Partial<EventSpot>) => Promise<boolean>;
  removeSpot: (spotId: string) => Promise<boolean>;
  reorderSpots: (eventId: string, spots: EventSpot[]) => Promise<boolean>;
  isProcessing: boolean;
  error: Error | null;
}

export function useEventSpotsWithErrorHandling(): UseEventSpotsReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const addSpot = async (
    eventId: string, 
    spot: Omit<EventSpot, 'id' | 'event_id'>
  ): Promise<boolean> => {
    try {
      setIsProcessing(true);
      setError(null);

      // Check for duplicate performer
      const { data: existingSpots, error: checkError } = await supabase
        .from('event_spots')
        .select('performer_id')
        .eq('event_id', eventId)
        .eq('performer_id', spot.performer_id);

      if (checkError) throw checkError;

      if (existingSpots && existingSpots.length > 0) {
        const error = new Error('Performer already has a spot in this event');
        await errorService.logError(error, {
          category: 'validation_error',
          severity: 'low',
          component: 'EventSpots',
          action: 'add_spot_duplicate',
          metadata: { eventId, performerId: spot.performer_id },
        });

        toast({
          title: 'Duplicate Performer',
          description: 'This performer already has a spot in the event.',
          variant: 'destructive',
        });

        return false;
      }

      const { error: insertError } = await supabase
        .from('event_spots')
        .insert({
          event_id: eventId,
          ...spot,
        });

      if (insertError) {
        const parsedError = parseEventError(insertError);
        
        await errorService.logError(insertError, {
          category: 'database_error',
          severity: 'medium',
          component: 'EventSpots',
          action: 'add_spot',
          metadata: { eventId, spot },
        });

        toast({
          title: 'Failed to add spot',
          description: parsedError.userMessage,
          variant: 'destructive',
        });

        return false;
      }

      toast({
        title: 'Spot Added',
        description: 'Performer spot has been added successfully.',
      });

      return true;
    } catch (error: any) {
      setError(error);
      console.error('Error adding spot:', error);
      
      await errorService.logError(error, {
        category: 'unknown_error',
        severity: 'high',
        component: 'EventSpots',
        action: 'add_spot_unexpected',
        metadata: { eventId, spot },
      });

      toast({
        title: 'Error',
        description: 'Failed to add performer spot.',
        variant: 'destructive',
      });

      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSpot = async (
    spotId: string, 
    updates: Partial<EventSpot>
  ): Promise<boolean> => {
    try {
      setIsProcessing(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('event_spots')
        .update(updates)
        .eq('id', spotId);

      if (updateError) {
        const parsedError = parseEventError(updateError);
        
        await errorService.logError(updateError, {
          category: 'database_error',
          severity: 'medium',
          component: 'EventSpots',
          action: 'update_spot',
          metadata: { spotId, updates },
        });

        toast({
          title: 'Failed to update spot',
          description: parsedError.userMessage,
          variant: 'destructive',
        });

        return false;
      }

      toast({
        title: 'Spot Updated',
        description: 'Performer spot has been updated successfully.',
      });

      return true;
    } catch (error: any) {
      setError(error);
      console.error('Error updating spot:', error);
      
      await errorService.logError(error, {
        category: 'unknown_error',
        severity: 'high',
        component: 'EventSpots',
        action: 'update_spot_unexpected',
        metadata: { spotId, updates },
      });

      toast({
        title: 'Error',
        description: 'Failed to update performer spot.',
        variant: 'destructive',
      });

      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const removeSpot = async (spotId: string): Promise<boolean> => {
    try {
      setIsProcessing(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('event_spots')
        .delete()
        .eq('id', spotId);

      if (deleteError) {
        const parsedError = parseEventError(deleteError);
        
        await errorService.logError(deleteError, {
          category: 'database_error',
          severity: 'medium',
          component: 'EventSpots',
          action: 'remove_spot',
          metadata: { spotId },
        });

        toast({
          title: 'Failed to remove spot',
          description: parsedError.userMessage,
          variant: 'destructive',
        });

        return false;
      }

      toast({
        title: 'Spot Removed',
        description: 'Performer spot has been removed successfully.',
      });

      return true;
    } catch (error: any) {
      setError(error);
      console.error('Error removing spot:', error);
      
      await errorService.logError(error, {
        category: 'unknown_error',
        severity: 'high',
        component: 'EventSpots',
        action: 'remove_spot_unexpected',
        metadata: { spotId },
      });

      toast({
        title: 'Error',
        description: 'Failed to remove performer spot.',
        variant: 'destructive',
      });

      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const reorderSpots = async (
    eventId: string, 
    spots: EventSpot[]
  ): Promise<boolean> => {
    try {
      setIsProcessing(true);
      setError(null);

      // Update order numbers for all spots
      const updates = spots.map((spot, index) => ({
        id: spot.id,
        order_number: index + 1,
      }));

      // Batch update using Promise.all
      const updatePromises = updates.map(update =>
        supabase
          .from('event_spots')
          .update({ order_number: update.order_number })
          .eq('id', update.id)
      );

      const results = await Promise.all(updatePromises);
      const hasError = results.some(result => result.error);

      if (hasError) {
        const firstError = results.find(r => r.error)?.error;
        
        await errorService.logError(firstError || new Error('Reorder failed'), {
          category: 'database_error',  
          severity: 'medium',
          component: 'EventSpots',
          action: 'reorder_spots',
          metadata: { eventId, spotsCount: spots.length },
        });

        toast({
          title: 'Failed to reorder spots',
          description: 'Some spots could not be reordered. Please try again.',
          variant: 'destructive',
        });

        return false;
      }

      // Success - no toast for reordering as it's a frequent operation
      return true;
    } catch (error: any) {
      setError(error);
      console.error('Error reordering spots:', error);
      
      await errorService.logError(error, {
        category: 'unknown_error',
        severity: 'high',
        component: 'EventSpots',
        action: 'reorder_spots_unexpected',
        metadata: { eventId, spotsCount: spots.length },
      });

      toast({
        title: 'Error',
        description: 'Failed to reorder performer spots.',
        variant: 'destructive',
      });

      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    addSpot,
    updateSpot,
    removeSpot,
    reorderSpots,
    isProcessing,
    error,
  };
}