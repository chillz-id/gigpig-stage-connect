
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ComedianBooking {
  id: string;
  comedian_id: string;
  performance_fee: number;
  payment_status: string;
  set_duration: number;
  performance_notes?: string;
  currency: string;
  created_at: string;
  is_selected: boolean;
  payment_type: 'fixed' | 'percentage_revenue' | 'percentage_door';
  percentage_amount: number;
  is_editable: boolean;
  comedian_name?: string;
  comedian_email?: string;
}

export const useLineupData = (eventId: string) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<ComedianBooking[]>([]);
  const [totalFees, setTotalFees] = useState(0);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [eventRevenue, setEventRevenue] = useState(0);

  const fetchLineupData = async () => {
    try {
      setLoading(true);
      
      // Fetch comedian bookings with profile information
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('comedian_bookings')
        .select(`
          *,
          profiles!comedian_bookings_comedian_id_fkey (
            name,
            email,
            stage_name
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Transform data to include comedian info with proper type casting
      const transformedBookings = bookingsData?.map(booking => ({
        ...booking,
        comedian_name: booking.profiles?.stage_name || booking.profiles?.name || 'Unknown Comedian',
        comedian_email: booking.profiles?.email || '',
        is_selected: booking.is_selected || false,
        payment_type: (booking.payment_type || 'fixed') as 'fixed' | 'percentage_revenue' | 'percentage_door',
        percentage_amount: booking.percentage_amount || 0,
        is_editable: booking.is_editable !== false
      })) || [];

      setBookings(transformedBookings);
      
      // Get selected bookings
      const selected = transformedBookings
        .filter(booking => booking.is_selected)
        .map(booking => booking.id);
      setSelectedBookings(selected);

      // Fetch event revenue for percentage calculations
      const { data: revenueData } = await supabase
        .from('ticket_sales')
        .select('total_amount')
        .eq('event_id', eventId);
      
      const totalRevenue = revenueData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      setEventRevenue(totalRevenue);
      
      // Calculate total fees including percentage-based payments
      await calculateTotalFees(transformedBookings, totalRevenue);

    } catch (error: any) {
      console.error('Error fetching lineup data:', error);
      toast({
        title: "Error",
        description: "Failed to load lineup data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalFees = async (bookingsList: ComedianBooking[], revenue: number) => {
    let total = 0;
    
    for (const booking of bookingsList) {
      if (booking.payment_type === 'fixed') {
        total += Number(booking.performance_fee);
      } else if (booking.payment_type === 'percentage_revenue') {
        total += (revenue * booking.percentage_amount / 100);
      } else if (booking.payment_type === 'percentage_door') {
        total += (revenue * booking.percentage_amount / 100);
      }
    }
    
    setTotalFees(total);
  };

  useEffect(() => {
    fetchLineupData();
  }, [eventId]);

  return {
    loading,
    bookings,
    setBookings,
    totalFees,
    selectedBookings,
    setSelectedBookings,
    eventRevenue,
    fetchLineupData,
  };
};
