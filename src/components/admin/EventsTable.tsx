
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { EventsTableProps } from './events-table/types';
import EventsTableHeader from './events-table/EventsTableHeader';
import EventsTableRow from './events-table/EventsTableRow';
import EventsEmptyState from './events-table/EventsEmptyState';

const EventsTable: React.FC<EventsTableProps> = ({ events, onDeleteEvent }) => {
  const navigate = useNavigate();

  const handleViewEvent = (eventId: string) => {
    navigate(`/admin/events/${eventId}`);
  };

  const handleEditEvent = (eventId: string) => {
    navigate(`/admin/events/${eventId}`);
  };

  if (events.length === 0) {
    return <EventsEmptyState />;
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Events Management</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <EventsTableHeader />
            <tbody>
              {events.map((event) => (
                <EventsTableRow
                  key={event.id}
                  event={event}
                  onViewEvent={handleViewEvent}
                  onEditEvent={handleEditEvent}
                  onDeleteEvent={onDeleteEvent}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsTable;
