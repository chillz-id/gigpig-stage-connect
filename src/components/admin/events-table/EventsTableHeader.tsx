
import React from 'react';

const EventsTableHeader = () => {
  return (
    <thead className="bg-white/5 border-b border-white/20">
      <tr>
        <th className="text-left text-white/80 font-medium p-4">Event</th>
        <th className="text-left text-white/80 font-medium p-4">Date & Venue</th>
        <th className="text-left text-white/80 font-medium p-4">Status</th>
        <th className="text-left text-white/80 font-medium p-4">Tickets</th>
        <th className="text-left text-white/80 font-medium p-4">Lineup</th>
        <th className="text-left text-white/80 font-medium p-4">Revenue</th>
        <th className="text-left text-white/80 font-medium p-4">Settlement</th>
        <th className="text-left text-white/80 font-medium p-4">Actions</th>
      </tr>
    </thead>
  );
};

export default EventsTableHeader;
