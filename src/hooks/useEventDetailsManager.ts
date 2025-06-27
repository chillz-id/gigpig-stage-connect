
import { useEventSelection } from './useEventSelection';
import { useTicketSalesData } from './useTicketSalesData';
import { useComedianBookingsData } from './useComedianBookingsData';

export const useEventDetailsManager = () => {
  const { selectedEvent, handleViewEventDetails, handleCloseEventDetails } = useEventSelection();
  const { ticketSales, setTicketSales, fetchTicketSales } = useTicketSalesData();
  const { comedianBookings, setComedianBookings, fetchComedianBookings } = useComedianBookingsData();

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
    selectedEvent,
    ticketSales,
    comedianBookings,
    fetchTicketSales,
    fetchComedianBookings,
    handleViewEventDetails: handleViewEventDetailsWithData,
    handleCloseEventDetails: handleCloseEventDetailsWithCleanup,
  };
};
