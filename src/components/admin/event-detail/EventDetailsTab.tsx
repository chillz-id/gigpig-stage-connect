
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Event {
  id: string;
  title: string;
  venue: string;
  event_date: string;
  status: string;
  capacity: number;
  tickets_sold: number;
  total_revenue: number;
  comedian_slots: number;
  filled_slots: number;
  city: string;
  state: string;
}

interface EventDetailsTabProps {
  eventId: string;
  event: Event;
  onEventUpdate: (event: Event) => void;
}

const EventDetailsTab: React.FC<EventDetailsTabProps> = ({ eventId, event, onEventUpdate }) => {
  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Event Details & Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-white/60 text-center py-8">
          Event details management functionality coming soon...
          <br />
          Event: {event.title}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventDetailsTab;
