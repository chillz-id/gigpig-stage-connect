
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit, Trash2, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  capacity: number;
}

interface EventsTableProps {
  events: Event[];
  onDeleteEvent: (eventId: string) => void;
}

const EventsTable: React.FC<EventsTableProps> = ({ events, onDeleteEvent }) => {
  const navigate = useNavigate();

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
      case 'open':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSettlementBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/admin/events/${eventId}`);
  };

  const handleEditEvent = (eventId: string) => {
    navigate(`/admin/events/${eventId}`);
  };

  if (events.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 text-white/60 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Events Found</h3>
          <p className="text-white/60">No events match your current search criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Events Management</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/20">
              <tr>
                <th className="text-left text-white/80 font-medium p-4">Event</th>
                <th className="text-left text-white/80 font-medium p-4">Date & Venue</th>
                <th className="text-left text-white/80 font-medium p-4">Status</th>
                <th className="text-left text-white/80 font-medium p-4">Tickets</th>
                <th className="text-left text-white/80 font-medium p-4">Lineup</th>
                <th className="text-left text-white/80 font-medium p-4">Revenue</th>
                <th className="text-left text-white/80 font-medium p-4">Settlement</th>
                <th className="text-left text-white/80 font-medium p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div>
                      <h3 
                        className="font-medium text-white mb-1 cursor-pointer hover:text-blue-300 transition-colors"
                        onClick={() => handleViewEvent(event.id)}
                        title="Click to view event details"
                      >
                        {event.title}
                      </h3>
                      <div className="text-sm text-white/60">
                        {event.ticket_price ? formatCurrency(event.ticket_price) : 'Free'} tickets
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-white text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-sm">
                        <MapPin className="w-3 h-3" />
                        {event.venue}
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <Badge variant={getStatusBadgeVariant(event.status)}>
                      {event.status}
                    </Badge>
                  </td>
                  
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-white text-sm">
                        <Users className="w-3 h-3" />
                        {event.tickets_sold} / {event.capacity}
                      </div>
                      <div className="text-white/60 text-xs">
                        {event.capacity > 0 ? Math.round((event.tickets_sold / event.capacity) * 100) : 0}% sold
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="text-white text-sm">
                      {event.filled_slots} / {event.comedian_slots}
                    </div>
                    <div className="text-white/60 text-xs">
                      comedians booked
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-white text-sm">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(event.total_revenue)}
                      </div>
                      <div className="text-white/60 text-xs">
                        Profit: {formatCurrency(event.profit_margin)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <Badge variant={getSettlementBadgeVariant(event.settlement_status)}>
                      {event.settlement_status}
                    </Badge>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleViewEvent(event.id)}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10 p-2 h-auto"
                        title="View Event Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleEditEvent(event.id)}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10 p-2 h-auto"
                        title="Edit Event"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => onDeleteEvent(event.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-400/10 hover:text-red-300 p-2 h-auto"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsTable;
