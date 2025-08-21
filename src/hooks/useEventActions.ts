
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { handleEventDeletionError } from '@/utils/eventErrorHandling';
import { errorService } from '@/services/errorService';

interface Event {
  id: string;
  title: string;
  event_date: string;
  venue: string;
  status: string;
  ticket_price: number | null;
  tickets_sold: number;
  comedian_slots: number;
  filled_slots: number;
  total_revenue: number;
  total_costs: number;
  profit_margin: number;
  settlement_status: string;
  promoter_id: string;
  capacity: number;
}

export const useEventActions = (
  events: Event[],
  setEvents: (events: Event[]) => void,
  onCloseEventDetails: () => void
) => {
  const { toast } = useToast();

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      // Log deletion attempt
      await errorService.logError('Event deletion initiated', {
        category: 'api_error',
        severity: 'low',
        component: 'EventActions',
        action: 'delete_event_attempt',
        metadata: { eventId },
        showToast: false,
        logToService: true,
      });

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== eventId));
      
      // Close event details if the deleted event was selected
      onCloseEventDetails();

      toast({
        title: "Event Deleted",
        description: "Event has been successfully deleted.",
      });
      
      // Log successful deletion
      await errorService.logError('Event deleted successfully', {
        category: 'api_error',
        severity: 'low',
        component: 'EventActions',
        action: 'delete_event_success',
        metadata: { eventId },
        showToast: false,
        logToService: true,
      });
    } catch (error: any) {
      console.error('Error deleting event:', error);
      // Use enhanced error handling
      await handleEventDeletionError(error, eventId);
    }
  };

  return {
    handleDeleteEvent,
  };
};
