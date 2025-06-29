
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EventSettlementsTabProps {
  eventId: string;
}

const EventSettlementsTab: React.FC<EventSettlementsTabProps> = ({ eventId }) => {
  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Financial Settlements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-white/60 text-center py-8">
          Settlement management functionality coming soon...
          <br />
          Event ID: {eventId}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventSettlementsTab;
