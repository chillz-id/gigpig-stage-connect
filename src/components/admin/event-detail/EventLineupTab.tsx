
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Plus, Search, Edit, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ComedianBooking {
  id: string;
  comedian_id: string;
  performance_fee: number;
  payment_status: string;
  set_duration: number;
  performance_notes?: string;
  currency: string;
  created_at: string;
  // Join with profiles for comedian info
  comedian_name?: string;
  comedian_email?: string;
}

interface EventLineupTabProps {
  eventId: string;
}

const EventLineupTab: React.FC<EventLineupTabProps> = ({ eventId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<ComedianBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalFees, setTotalFees] = useState(0);

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

      // Transform data to include comedian info
      const transformedBookings = bookingsData?.map(booking => ({
        ...booking,
        comedian_name: booking.profiles?.stage_name || booking.profiles?.name || 'Unknown Comedian',
        comedian_email: booking.profiles?.email || ''
      })) || [];

      setBookings(transformedBookings);
      
      // Calculate total fees
      const total = transformedBookings.reduce((sum, booking) => sum + Number(booking.performance_fee), 0);
      setTotalFees(total);

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

  useEffect(() => {
    fetchLineupData();
  }, [eventId]);

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredBookings = bookings.filter(booking =>
    booking.comedian_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.comedian_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="text-white/60 text-sm">Total Comedians</div>
            <div className="text-2xl font-bold text-white">{bookings.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="text-white/60 text-sm">Total Performance Fees</div>
            <div className="text-2xl font-bold text-white">${totalFees.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="text-white/60 text-sm">Paid Comedians</div>
            <div className="text-2xl font-bold text-white">
              {bookings.filter(b => b.payment_status === 'paid').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
          <Input
            placeholder="Search comedians..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
        </div>
        
        <Button
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Book Comedian
        </Button>
      </div>

      {/* Lineup Table */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Event Lineup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-white/80 font-medium p-3">Comedian</th>
                  <th className="text-left text-white/80 font-medium p-3">Contact</th>
                  <th className="text-left text-white/80 font-medium p-3">Set Duration</th>
                  <th className="text-left text-white/80 font-medium p-3">Performance Fee</th>
                  <th className="text-left text-white/80 font-medium p-3">Payment Status</th>
                  <th className="text-left text-white/80 font-medium p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="text-white p-3">
                      <div>
                        <div className="font-medium">{booking.comedian_name}</div>
                        {booking.performance_notes && (
                          <div className="text-sm text-white/60 mt-1">
                            {booking.performance_notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-white p-3 text-sm">
                      {booking.comedian_email}
                    </td>
                    <td className="text-white p-3">
                      {booking.set_duration || 'N/A'} minutes
                    </td>
                    <td className="text-white p-3">
                      ${Number(booking.performance_fee).toFixed(2)} {booking.currency}
                    </td>
                    <td className="text-white p-3">
                      <select
                        value={booking.payment_status}
                        onChange={(e) => updatePaymentStatus(booking.id, e.target.value)}
                        className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </td>
                    <td className="text-white p-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/10 p-2 h-auto"
                          title="Edit Booking"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteBooking(booking.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-400/10 hover:text-red-300 p-2 h-auto"
                          title="Remove from Lineup"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredBookings.length === 0 && (
              <div className="text-center py-8 text-white/60">
                {searchTerm 
                  ? 'No comedians found matching your search'
                  : 'No comedians booked yet'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventLineupTab;
