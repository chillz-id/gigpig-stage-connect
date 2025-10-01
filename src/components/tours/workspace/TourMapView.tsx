import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tour, TourStop } from '@/types/tour';

interface TourMapViewProps {
  tour: Tour;
  stops: TourStop[];
}

export function TourMapView({ tour, stops }: TourMapViewProps) {
  // Placeholder until routing map is implemented
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white">Route Map</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400">
          Interactive map coming soon. {tour.name} currently has {stops.length} plotted stops.
        </p>
      </CardContent>
    </Card>
  );
}
