
import { useEventData } from './useEventData';
import { useTicketSalesData } from './useTicketSalesData';
import { useComedianBookingsData } from './useComedianBookingsData';
import { useEventActions } from './useEventActions';
import { useEventSelection } from './useEventSelection';

export const useEventManagement = () => {
  const { events, setEvents, loading, fetchEvents } = useEventData();
  const { ticketSales, setTicketSales, fetchTicketSales } = useTicketSalesData();
  const { comedianBookings, setComedianBookings, fetchComedianBookings } = useComedianBookingsData();
  const { selectedEvent, handleViewEventDetails, handleCloseEventDetails } = useEventSelection();
  
  const { handleDeleteEvent } = useEventActions(events, setEvents, handleCloseEventDetails);

  const handleViewEventDetailsWithData = (eventId: string) => {
    handleViewEventDetails(eventId);
    fetchTicketSales(eventId);
    fetchComedianBookings(eventId);
  };

  const handleCloseEventDetailsWithCleanup = () => {
    handleCloseEventDetails();
    setTicketSales([]);
    setComedianBookings([]);
  };

  return {
    events,
    setEvents,
    loading,
    selectedEvent,
    ticketSales,
    comedianBookings,
    fetchEvents,
    fetchTicketSales,
    fetchComedianBookings,
    handleDeleteEvent,
    handleViewEventDetails: handleViewEventDetailsWithData,
    handleCloseEventDetails: handleCloseEventDetailsWithCleanup,
  };
};
