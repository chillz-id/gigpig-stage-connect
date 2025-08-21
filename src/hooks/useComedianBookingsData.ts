
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ComedianBooking {
  id: string;
  event_id: string;
  comedian_id: string;
  performance_fee: number;
  payment_status: string;
  set_duration: number;
}

export const useComedianBookingsData = () => {
  const [comedianBookings, setComedianBookings] = useState<ComedianBooking[]>([]);
  const { toast } = useToast();

  const fetchComedianBookings = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('comedian_bookings')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setComedianBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching comedian bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch comedian bookings.",
        variant: "destructive",
      });
    }
  };

  return {
    comedianBookings,
    setComedianBookings,
    fetchComedianBookings,
  };
};
