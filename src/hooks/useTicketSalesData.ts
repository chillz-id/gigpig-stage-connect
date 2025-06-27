
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TicketSale {
  id: string;
  event_id: string;
  customer_name: string;
  customer_email: string;
  ticket_quantity: number;
  total_amount: number;
  platform: string;
  purchase_date: string;
}

export const useTicketSalesData = () => {
  const [ticketSales, setTicketSales] = useState<TicketSale[]>([]);
  const { toast } = useToast();

  const fetchTicketSales = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_sales')
        .select('*')
        .eq('event_id', eventId)
        .order('purchase_date', { ascending: false });
      
      if (error) throw error;
      setTicketSales(data || []);
    } catch (error: any) {
      console.error('Error fetching ticket sales:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ticket sales.",
        variant: "destructive",
      });
    }
  };

  return {
    ticketSales,
    setTicketSales,
    fetchTicketSales,
  };
};
