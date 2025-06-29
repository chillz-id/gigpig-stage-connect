
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TicketSalesCard from './TicketSalesCard';
import ComedianBookingsCard from './ComedianBookingsCard';
import EventApplicationsPanel from './EventApplicationsPanel';

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

  // Mock event data - replace with real event data
  const eventTitle = "Wednesday Comedy Night";

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm border-white/20">
          <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20">
            Overview
          </TabsTrigger>
          <TabsTrigger value="applications" className="text-white data-[state=active]:bg-white/20">
            Applications
          </TabsTrigger>
          <TabsTrigger value="bookings" className="text-white data-[state=active]:bg-white/20">
            Bookings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 event-grid">
            <TicketSalesCard ticketSales={ticketSales} onClose={onClose} />
            <ComedianBookingsCard comedianBookings={comedianBookings} />
          </div>
        </TabsContent>
        
        <TabsContent value="applications">
          <EventApplicationsPanel
            eventId={selectedEvent}
            eventTitle={eventTitle}
          />
        </TabsContent>
        
        <TabsContent value="bookings">
          <ComedianBookingsCard comedianBookings={comedianBookings} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventDetails;
