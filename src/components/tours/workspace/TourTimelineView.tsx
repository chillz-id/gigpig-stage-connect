import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tour, TourStop } from '@/types/tour';

interface TourTimelineViewProps {
  tour: Tour;
  stops: TourStop[];
}

export function TourTimelineView({ tour, stops }: TourTimelineViewProps) {
  // Placeholder until timeline visualization is implemented
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white">Tour Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400">
          Timeline view coming soon. {tour.name} currently has {stops.length} planned stops.
        </p>
      </CardContent>
    </Card>
  );
}
