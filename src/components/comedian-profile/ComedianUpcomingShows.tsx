
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface ComedianUpcomingShowsProps {
  comedianId: string;
}

const ComedianUpcomingShows: React.FC<ComedianUpcomingShowsProps> = ({ comedianId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Shows
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-8">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Upcoming shows will be displayed here...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianUpcomingShows;
