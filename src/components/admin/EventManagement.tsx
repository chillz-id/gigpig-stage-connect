
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EventFilters from './EventFilters';
import EventsTable from './EventsTable';
import EventDetails from './EventDetails';

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
}

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

interface ComedianBooking {
  id: string;
  event_id: string;
  comedian_id: string;
  performance_fee: number;
  payment_status: string;
  set_duration: number;
}

const EventManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [ticketSales, setTicketSales] = useState<TicketSale[]>([]);
  const [comedianBookings, setComedianBookings] = useState<ComedianBooking[]>([]);
  const { toast } = useToast();

  // Fetch events from database
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch ticket sales for selected event
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

  // Fetch comedian bookings for selected event
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

  useEffect(() => {
    fetchEvents();

    // Set up real-time subscriptions
    const ticketSalesSubscription = supabase
      .channel('ticket_sales_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_sales' }, 
        () => {
          fetchEvents(); // Refresh events to get updated counts
          if (selectedEvent) fetchTicketSales(selectedEvent);
        }
      )
      .subscribe();

    const comedianBookingsSubscription = supabase
      .channel('comedian_bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comedian_bookings' }, 
        () => {
          fetchEvents();
          if (selectedEvent) fetchComedianBookings(selectedEvent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketSalesSubscription);
      supabase.removeChannel(comedianBookingsSubscription);
    };
  }, [selectedEvent]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== eventId));
      toast({
        title: "Event Deleted",
        description: "Event has been successfully deleted.",
      });
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    }
  };

  const handleViewEventDetails = (eventId: string) => {
    setSelectedEvent(eventId);
    fetchTicketSales(eventId);
    fetchComedianBookings(eventId);
  };

  const handleCloseEventDetails = () => {
    setSelectedEvent(null);
    setTicketSales([]);
    setComedianBookings([]);
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading events...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Event Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EventFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          
          <EventsTable 
            events={filteredEvents}
            onViewDetails={handleViewEventDetails}
            onDeleteEvent={handleDeleteEvent}
          />
        </CardContent>
      </Card>

      <EventDetails 
        selectedEvent={selectedEvent}
        ticketSales={ticketSales}
        comedianBookings={comedianBookings}
        onClose={handleCloseEventDetails}
      />
    </div>
  );
};

export default EventManagement;
