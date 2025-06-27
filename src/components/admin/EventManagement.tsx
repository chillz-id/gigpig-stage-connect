
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Eye, Edit, Trash2, MapPin, DollarSign, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'ongoing': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getSettlementBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'completed': return 'default';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

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
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-300"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Events Table */}
          <div className="rounded-lg border border-white/20 bg-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-gray-300">Event</TableHead>
                  <TableHead className="text-gray-300">Date & Venue</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Tickets</TableHead>
                  <TableHead className="text-gray-300">Comedians</TableHead>
                  <TableHead className="text-gray-300">Revenue</TableHead>
                  <TableHead className="text-gray-300">Settlement</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id} className="border-white/20">
                    <TableCell>
                      <div className="text-white">
                        <div className="font-medium">{event.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-white">
                        <div className="text-sm">{new Date(event.event_date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.venue}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(event.status)}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white">
                      <div className="text-sm">
                        {event.tickets_sold} sold
                      </div>
                      <div className="text-xs text-gray-300">
                        ${event.ticket_price || 0} each
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      <div className="text-sm">
                        {event.filled_slots}/{event.comedian_slots}
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-purple-500 h-1.5 rounded-full" 
                          style={{ width: `${(event.filled_slots / event.comedian_slots) * 100}%` }}
                        ></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-3 h-3" />
                        {event.total_revenue.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-300">
                        Profit: ${event.profit_margin.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSettlementBadgeVariant(event.settlement_status)}>
                        {event.settlement_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-white hover:bg-white/20"
                          onClick={() => handleViewEventDetails(event.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-8 text-gray-300">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No events found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Modal/Section */}
      {selectedEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Ticket Sales
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setSelectedEvent(null)}
                  className="ml-auto text-white hover:bg-white/20"
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticketSales.length > 0 ? (
                  ticketSales.map((sale) => (
                    <div key={sale.id} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">{sale.customer_name}</p>
                          <p className="text-sm text-gray-300">{sale.customer_email}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(sale.purchase_date).toLocaleDateString()} via {sale.platform}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white">${sale.total_amount}</p>
                          <p className="text-sm text-gray-300">{sale.ticket_quantity} tickets</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-300 text-center py-4">No ticket sales yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Comedian Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comedianBookings.length > 0 ? (
                  comedianBookings.map((booking) => (
                    <div key={booking.id} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">Comedian ID: {booking.comedian_id}</p>
                          <p className="text-sm text-gray-300">{booking.set_duration} minutes</p>
                          <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {booking.payment_status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-white">${booking.performance_fee}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-300 text-center py-4">No comedian bookings yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EventManagement;
