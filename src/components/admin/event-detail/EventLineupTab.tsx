
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EventLineupTabProps {
  eventId: string;
}

const EventLineupTab: React.FC<EventLineupTabProps> = ({ eventId }) => {
  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Lineup Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-white/60 text-center py-8">
          Lineup management functionality coming soon...
          <br />
          Event ID: {eventId}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventLineupTab;
