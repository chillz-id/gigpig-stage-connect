
import { useState } from 'react';

export const useEventSelection = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const handleViewEventDetails = (eventId: string) => {
    console.log('Viewing details for event:', eventId);
    setSelectedEvent(eventId);
  };

  const handleCloseEventDetails = () => {
    setSelectedEvent(null);
  };

  return {
    selectedEvent,
    handleViewEventDetails,
    handleCloseEventDetails,
  };
};
