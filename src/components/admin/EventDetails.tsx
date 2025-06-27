
import React from 'react';
import TicketSalesCard from './TicketSalesCard';
import ComedianBookingsCard from './ComedianBookingsCard';

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

interface EventDetailsProps {
  selectedEvent: string | null;
  ticketSales: TicketSale[];
  comedianBookings: ComedianBooking[];
  onClose: () => void;
}

const EventDetails = ({ selectedEvent, ticketSales, comedianBookings, onClose }: EventDetailsProps) => {
  if (!selectedEvent) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TicketSalesCard ticketSales={ticketSales} onClose={onClose} />
      <ComedianBookingsCard comedianBookings={comedianBookings} />
    </div>
  );
};

export default EventDetails;
