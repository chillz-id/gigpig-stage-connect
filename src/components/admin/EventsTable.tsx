
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, MapPin, DollarSign, Eye, Edit, Trash2 } from 'lucide-react';
import { Drama } from 'lucide-react';

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
  capacity?: number;
}

interface EventsTableProps {
  events: Event[];
  onViewDetails: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

const EventsTable = ({ events, onViewDetails, onDeleteEvent }: EventsTableProps) => {
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

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-300">
        <Drama className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-content">No events found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="table-container rounded-lg border border-white/20 bg-white/5">
      <Table className="responsive-table admin-table">
        <TableHeader>
          <TableRow className="border-white/20">
            <TableHead className="text-gray-300 min-w-[150px]">Event</TableHead>
            <TableHead className="text-gray-300 min-w-[120px]">Date & Venue</TableHead>
            <TableHead className="text-gray-300 mobile-hide">Status</TableHead>
            <TableHead className="text-gray-300 min-w-[80px]">Tickets</TableHead>
            <TableHead className="text-gray-300 min-w-[100px]">Comedians</TableHead>
            <TableHead className="text-gray-300 mobile-hide">Revenue</TableHead>
            <TableHead className="text-gray-300 mobile-hide">Settlement</TableHead>
            <TableHead className="text-gray-300 min-w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} className="border-white/20">
              <TableCell className="min-w-[150px]">
                <div className="text-white">
                  <div className="font-medium text-sm md:text-base">{event.title}</div>
                </div>
              </TableCell>
              <TableCell className="min-w-[120px]">
                <div className="text-white">
                  <div className="text-xs md:text-sm">{new Date(event.event_date).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="mobile-hide">
                <Badge variant={getStatusBadgeVariant(event.status)}>
                  {event.status}
                </Badge>
              </TableCell>
              <TableCell className="text-white min-w-[80px]">
                <div className="text-xs md:text-sm">
                  {event.tickets_sold} sold
                </div>
                <div className="text-xs text-gray-300">
                  ${event.ticket_price || 0}
                </div>
              </TableCell>
              <TableCell className="text-white min-w-[100px]">
                <div className="flex items-center gap-1 text-xs md:text-sm">
                  <Drama className="w-3 h-3 flex-shrink-0" />
                  {event.filled_slots}/{event.comedian_slots}
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full" 
                    style={{ width: `${(event.filled_slots / event.comedian_slots) * 100}%` }}
                  ></div>
                </div>
              </TableCell>
              <TableCell className="text-white mobile-hide">
                <div className="flex items-center gap-1 text-sm">
                  <DollarSign className="w-3 h-3" />
                  {event.total_revenue.toFixed(2)}
                </div>
                <div className="text-xs text-gray-300">
                  Profit: ${event.profit_margin.toFixed(2)}
                </div>
              </TableCell>
              <TableCell className="mobile-hide">
                <Badge variant={getSettlementBadgeVariant(event.settlement_status)}>
                  {event.settlement_status}
                </Badge>
              </TableCell>
              <TableCell className="min-w-[120px]">
                <div className="flex gap-1 table-actions">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-white hover:bg-white/20 min-h-[44px] md:min-h-[32px] min-w-[44px] md:min-w-[32px]"
                    onClick={() => onViewDetails(event.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-white hover:bg-white/20 min-h-[44px] md:min-h-[32px] min-w-[44px] md:min-w-[32px]"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20 min-h-[44px] md:min-h-[32px] min-w-[44px] md:min-w-[32px]"
                    onClick={() => onDeleteEvent(event.id)}
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
  );
};

export default EventsTable;
