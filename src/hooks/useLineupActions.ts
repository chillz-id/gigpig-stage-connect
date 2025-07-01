
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

export const useLineupActions = (
  eventId: string,
  bookings: ComedianBooking[],
  setBookings: React.Dispatch<React.SetStateAction<ComedianBooking[]>>,
  selectedBookings: string[],
  setSelectedBookings: React.Dispatch<React.SetStateAction<string[]>>,
  eventRevenue: number,
  fetchLineupData: () => Promise<void>
) => {
  const { toast } = useToast();

  const handleSelectBooking = async (bookingId: string, isSelected: boolean) => {
    try {
      // Update selection in database
      const { error } = await supabase
        .from('comedian_bookings')
        .update({ is_selected: isSelected })
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, is_selected: isSelected }
          : booking
      ));

      setSelectedBookings(prev => 
        isSelected 
          ? [...prev, bookingId]
          : prev.filter(id => id !== bookingId)
      );
    } catch (error: any) {
      console.error('Error updating selection:', error);
      toast({
        title: "Error",
        description: "Failed to update selection",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = async () => {
    const allSelected = selectedBookings.length === bookings.length;
    const newSelection = !allSelected;
    
    try {
      // Update all bookings in database
      const { error } = await supabase
        .from('comedian_bookings')
        .update({ is_selected: newSelection })
        .eq('event_id', eventId);

      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(booking => ({ ...booking, is_selected: newSelection })));
      setSelectedBookings(newSelection ? bookings.map(b => b.id) : []);

      toast({
        title: newSelection ? "All Selected" : "All Deselected",
        description: `${newSelection ? 'Selected' : 'Deselected'} ${bookings.length} comedians`,
      });
    } catch (error: any) {
      console.error('Error updating all selections:', error);
      toast({
        title: "Error",
        description: "Failed to update selections",
        variant: "destructive",
      });
    }
  };

  const handleCreateInvoices = async () => {
    if (selectedBookings.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select comedians to create invoices for",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate total amount for selected bookings
      const selectedBookingData = bookings.filter(b => selectedBookings.includes(b.id));
      let totalAmount = 0;
      
      for (const booking of selectedBookingData) {
        if (booking.payment_type === 'fixed') {
          totalAmount += Number(booking.performance_fee);
        } else if (booking.payment_type === 'percentage_revenue') {
          totalAmount += (eventRevenue * booking.percentage_amount / 100);
        } else if (booking.payment_type === 'percentage_door') {
          totalAmount += (eventRevenue * booking.percentage_amount / 100);
        }
      }

      // Create batch payment record
      const { data: batchPayment, error: batchError } = await supabase
        .from('batch_payments')
        .insert({
          event_id: eventId,
          total_amount: totalAmount,
          selected_bookings: selectedBookings,
          processing_status: 'pending',
          notes: `Batch payment for ${selectedBookings.length} comedian(s)`
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Update payment status for selected bookings
      const { error: updateError } = await supabase
        .from('comedian_bookings')
        .update({ payment_status: 'processing' })
        .in('id', selectedBookings);

      if (updateError) throw updateError;

      // Refresh data
      await fetchLineupData();

      toast({
        title: "Invoices Created",
        description: `Created batch payment for ${selectedBookings.length} comedian(s) totaling $${totalAmount.toFixed(2)}`,
      });

      // Clear selections
      setSelectedBookings([]);
      
    } catch (error: any) {
      console.error('Error creating invoices:', error);
      toast({
        title: "Error",
        description: "Failed to create invoices",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to remove this comedian from the lineup?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('comedian_bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
      
      toast({
        title: "Booking Removed",
        description: "Comedian has been removed from the lineup",
      });
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Error",
        description: "Failed to remove booking",
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('comedian_bookings')
        .update({ payment_status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, payment_status: newStatus }
          : booking
      ));

      toast({
        title: "Payment Status Updated",
        description: `Payment status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  return {
    handleSelectBooking,
    handleSelectAll,
    handleCreateInvoices,
    handleDeleteBooking,
    updatePaymentStatus,
  };
};
