
import { useState } from 'react';

export const useEventSelection = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const handleViewEventDetails = (eventId: string) => {
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
