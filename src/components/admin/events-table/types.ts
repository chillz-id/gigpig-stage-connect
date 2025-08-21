
export interface Event {
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

export interface EventsTableProps {
  events: Event[];
  onDeleteEvent: (eventId: string) => void;
}
