
import { useEventData } from './useEventData';
import { useEventActions } from './useEventActions';
import { useEventDetailsManager } from './useEventDetailsManager';

export const useEventManagement = () => {
  const { events, setEvents, loading, fetchEvents } = useEventData();
  const {
    selectedEvent,
    ticketSales,
    comedianBookings,
    fetchTicketSales,
    fetchComedianBookings,
    handleViewEventDetails,
    handleCloseEventDetails,
  } = useEventDetailsManager();
  
  const { handleDeleteEvent } = useEventActions(events, setEvents, handleCloseEventDetails);

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
    handleViewEventDetails,
    handleCloseEventDetails,
  };
};
