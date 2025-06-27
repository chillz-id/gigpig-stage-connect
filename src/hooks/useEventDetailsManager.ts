
import { useEventSelection } from './useEventSelection';
import { useTicketSalesManagement } from './useTicketSalesManagement';
import { useComedianBookingsData } from './useComedianBookingsData';

export const useEventDetailsManager = () => {
  const { selectedEvent, handleViewEventDetails, handleCloseEventDetails } = useEventSelection();
  const { ticketSales, addTicketSale, updateTicketSale } = useTicketSalesManagement(selectedEvent || undefined);
  const { comedianBookings, setComedianBookings, fetchComedianBookings } = useComedianBookingsData();

  const handleViewEventDetailsWithData = (eventId: string) => {
    handleViewEventDetails(eventId);
    fetchComedianBookings(eventId);
  };

  const handleCloseEventDetailsWithCleanup = () => {
    handleCloseEventDetails();
    setComedianBookings([]);
  };

  return {
    selectedEvent,
    ticketSales,
    comedianBookings,
    fetchComedianBookings,
    handleViewEventDetails: handleViewEventDetailsWithData,
    handleCloseEventDetails: handleCloseEventDetailsWithCleanup,
  };
};
