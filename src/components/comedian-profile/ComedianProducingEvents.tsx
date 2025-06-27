
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface ComedianProducingEventsProps {
  comedianId: string;
}

const ComedianProducingEvents: React.FC<ComedianProducingEventsProps> = ({ comedianId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Co-Producing Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-8">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Events they organize and produce will be shown here...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianProducingEvents;
