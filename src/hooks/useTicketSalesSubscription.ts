
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTicketSalesSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabase
      .channel('ticket_sales_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_sales'
        },
        (payload) => {
          
          // Invalidate relevant queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['ticket-sales'] });
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);
};
