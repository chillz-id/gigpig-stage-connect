
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Users, Star } from 'lucide-react';

interface MapShow {
  id: string;
  title: string;
  venue: string;
  time: string;
  spots: number;
  appliedSpots: number;
  type: string;
  pay: string;
  x: number; // position on map (percentage)
  y: number; // position on map (percentage)
}

const sydneyShows: MapShow[] = [
  {
    id: '1',
    title: 'Comedy Night at The Rocks',
    venue: 'The Comedy Store',
    time: '8:00 PM',
    spots: 8,
    appliedSpots: 3,
    type: 'Open Mic',
    pay: 'Free',
    x: 45,
    y: 35
  },
  {
    id: '2',
    title: 'Harbour Laughs',
    venue: 'Circular Quay Comedy Club',
    time: '7:30 PM',
    spots: 6,
    appliedSpots: 2,
    type: 'Semi-Pro',
    pay: '$50',
    x: 50,
    y: 30
  },
  {
    id: '3',
    title: 'Bondi Beach Comedy',
    venue: 'The Bucket List',
    time: '9:00 PM',
    spots: 5,
    appliedSpots: 1,
    type: 'Pro',
    pay: '$100',
    x: 65,
    y: 55
  },
  {
    id: '4',
    title: 'Surry Hills Stand-up',
    venue: 'The Lounge',
    time: '8:30 PM',
    spots: 7,
    appliedSpots: 4,
    type: 'Mixed',
    pay: '$30',
    x: 48,
    y: 45
  },
  {
    id: '5',
    title: 'Newtown Comedy Collective',
    venue: 'The Factory Theatre',
    time: '7:00 PM',
    spots: 10,
    appliedSpots: 6,
    type: 'Open Mic',
    pay: 'Free',
    x: 35,
    y: 50
  }
];

export const MapView: React.FC = () => {
  const [selectedShow, setSelectedShow] = useState<MapShow | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Sydney Comedy Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gradient-to-br from-blue-200 to-green-200 rounded-lg overflow-hidden" style={{ height: '500px' }}>
              {/* Simple Sydney map representation */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-300/30 to-green-300/30">
                {/* Harbor */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-32 h-16 bg-blue-400/60 rounded-full"></div>
                {/* City areas */}
                <div className="absolute top-16 left-1/3 w-24 h-24 bg-gray-300/40 rounded"></div>
                <div className="absolute bottom-16 right-1/4 w-20 h-20 bg-yellow-200/40 rounded"></div>
              </div>

              {/* Show markers */}
              {sydneyShows.map((show) => (
                <button
                  key={show.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all hover:scale-110 ${
                    selectedShow?.id === show.id 
                      ? 'bg-primary scale-125' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  style={{ left: `${show.x}%`, top: `${show.y}%` }}
                  onClick={() => setSelectedShow(show)}
                >
                  <span className="sr-only">{show.title}</span>
                </button>
              ))}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Comedy Venues</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span>Selected</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          {selectedShow ? 'Show Details' : 'Select a venue'}
        </h3>

        {selectedShow ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{selectedShow.title}</CardTitle>
                  <p className="text-muted-foreground">{selectedShow.venue}</p>
                </div>
                <Badge variant="outline">{selectedShow.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedShow.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedShow.spots - selectedShow.appliedSpots} spots available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedShow.pay}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 bg-primary hover:bg-primary/90">
                  Apply Now
                </Button>
                <Button variant="outline">More Info</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8 text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-semibold mb-2">Explore Sydney's Comedy Scene</h4>
              <p className="text-muted-foreground text-sm">
                Click on any red marker to see show details and apply
              </p>
            </CardContent>
          </Card>
        )}

        {/* Show list */}
        <div className="space-y-2">
          <h4 className="font-semibold">All Shows</h4>
          {sydneyShows.map((show) => (
            <button
              key={show.id}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedShow?.id === show.id 
                  ? 'bg-primary/10 border-primary' 
                  : 'bg-card/30 border-border hover:bg-card/50'
              }`}
              onClick={() => setSelectedShow(show)}
            >
              <div className="font-medium text-sm">{show.title}</div>
              <div className="text-xs text-muted-foreground">{show.venue} • {show.time}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
