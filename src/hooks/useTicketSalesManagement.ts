
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TicketSale {
  id: string;
  event_id: string;
  customer_name: string;
  customer_email: string;
  ticket_quantity: number;
  ticket_type: string;
  total_amount: number;
  platform: string;
  platform_order_id?: string;
  refund_status: string;
  purchase_date: string;
  created_at: string;
}

export const useTicketSalesManagement = (eventId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ticket sales for a specific event or all events
  const { data: ticketSales = [], isLoading, error } = useQuery({
    queryKey: ['ticket-sales', eventId],
    queryFn: async () => {
      let query = supabase
        .from('ticket_sales')
        .select('*')
        .order('purchase_date', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as TicketSale[];
    },
  });

  // Add manual ticket sale
  const addTicketSale = useMutation({
    mutationFn: async (ticketSale: Omit<TicketSale, 'id' | 'created_at' | 'purchase_date'>) => {
      const { data, error } = await supabase
        .from('ticket_sales')
        .insert([ticketSale])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-sales'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Ticket Sale Added",
        description: "The ticket sale has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error adding ticket sale:', error);
      toast({
        title: "Error",
        description: "Failed to add ticket sale.",
        variant: "destructive",
      });
    },
  });

  // Update ticket sale (e.g., refund status)
  const updateTicketSale = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TicketSale> }) => {
      const { data, error } = await supabase
        .from('ticket_sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-sales'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Ticket Sale Updated",
        description: "The ticket sale has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating ticket sale:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket sale.",
        variant: "destructive",
      });
    },
  });

  // Calculate sales metrics with AUD formatting
  const salesMetrics = {
    totalSales: ticketSales.length,
    totalRevenue: ticketSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0),
    totalTickets: ticketSales.reduce((sum, sale) => sum + sale.ticket_quantity, 0),
    averageTicketPrice: ticketSales.length > 0 
      ? ticketSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0) / ticketSales.reduce((sum, sale) => sum + sale.ticket_quantity, 0)
      : 0,
    platformBreakdown: ticketSales.reduce((acc, sale) => {
      acc[sale.platform] = (acc[sale.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    ticketSales,
    isLoading,
    error,
    salesMetrics,
    addTicketSale,
    updateTicketSale,
  };
};
