
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { Event } from './types';
import { getStatusBadgeVariant, getSettlementBadgeVariant, formatCurrency } from './utils';

interface EventsTableRowProps {
  event: Event;
  onViewEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

const EventsTableRow: React.FC<EventsTableRowProps> = ({
  event,
  onViewEvent,
  onEditEvent,
  onDeleteEvent,
}) => {
  return (
    <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
      <td className="p-4">
        <div>
          <h3 
            className="font-medium text-white mb-1 cursor-pointer hover:text-blue-300 transition-colors"
            onClick={() => onViewEvent(event.id)}
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
            onClick={() => onViewEvent(event.id)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 p-2 h-auto"
            title="View Event Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => onEditEvent(event.id)}
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
  );
};

export default EventsTableRow;
