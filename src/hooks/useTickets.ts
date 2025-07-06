import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Ticket {
  id: string;
  user_id: string;
  event_id: string;
  ticket_type: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  event?: {
    id: string;
    title: string;
    venue: string;
    event_date: string;
    start_time?: string;
    banner_url?: string;
    city?: string;
    state?: string;
  };
}

export const useTickets = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch user's tickets
  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ['user-tickets', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          user_id,
          event_id,
          ticket_type,
          quantity,
          total_price,
          status,
          payment_status,
          created_at,
          events (
            id,
            title,
            venue,
            event_date,
            start_time,
            banner_url,
            city,
            state
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map the data to match our interface
      return (data || []).map(ticket => ({
        ...ticket,
        event: ticket.events
      })) as Ticket[];
    },
    enabled: !!user
  });

  // Create a new ticket purchase
  const purchaseTicketMutation = useMutation({
    mutationFn: async (ticketData: {
      event_id: string;
      ticket_type: string;
      quantity: number;
      total_price: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          event_id: ticketData.event_id,
          ticket_type: ticketData.ticket_type,
          quantity: ticketData.quantity,
          total_price: ticketData.total_price,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
      toast({
        title: "Ticket purchase initiated",
        description: "Your ticket purchase is being processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.message || "Failed to purchase ticket",
        variant: "destructive"
      });
    }
  });

  // Cancel a ticket
  const cancelTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: 'cancelled',
          payment_status: 'refunded'
        })
        .eq('id', ticketId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
      toast({
        title: "Ticket cancelled",
        description: "Your ticket has been cancelled and refunded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "Failed to cancel ticket",
        variant: "destructive"
      });
    }
  });

  return {
    tickets,
    isLoading,
    error,
    purchaseTicket: purchaseTicketMutation.mutate,
    cancelTicket: cancelTicketMutation.mutate,
    isPurchasing: purchaseTicketMutation.isPending,
    isCancelling: cancelTicketMutation.isPending
  };
};