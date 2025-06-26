
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Users, Star, Heart } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Using the same mock data as Browse.tsx
const mockEvents = [
  // January 2025 Events
  {
    id: 'mock-1',
    title: 'New Year Comedy Kickoff',
    venue: 'The Laugh Track',
    city: 'Sydney',
    state: 'NSW',
    address: '123 Comedy Street, Sydney NSW 2000',
    event_date: '2025-01-03',
    start_time: '8:00 PM',
    end_time: '10:00 PM',
    description: 'Start the new year with laughs! Featuring top comedians from across Australia.',
    type: 'Mixed',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: true,
    spots: 8,
    applied_spots: 3,
    status: 'open',
    allow_recording: false,
    dress_code: 'Smart Casual',
    banner_url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&h=400&fit=crop',
    requirements: 'Comedian Pro members only',
    x: 45,
    y: 35
  },
  {
    id: 'mock-2',
    title: 'Melbourne Open Mic Night',
    venue: 'Brew & Laugh Cafe',
    city: 'Melbourne',
    state: 'VIC',
    address: '456 Laughter Lane, Melbourne VIC 3000',
    event_date: '2025-01-05',
    start_time: '7:30 PM',
    end_time: '9:30 PM',
    description: 'Weekly open mic night for new and experienced comedians to test their material.',
    type: 'Open Mic',
    age_restriction: 'All Ages',
    is_paid: false,
    is_verified_only: false,
    spots: 12,
    applied_spots: 8,
    status: 'open',
    allow_recording: true,
    dress_code: 'Casual',
    banner_url: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=400&fit=crop',
    is_recurring: true,
    recurrence_pattern: 'Weekly',
    series_id: 'series-1',
    x: 25,
    y: 60
  },
  {
    id: 'mock-3',
    title: 'Brisbane Comedy Showcase',
    venue: 'The Comedy Corner',
    city: 'Brisbane',
    state: 'QLD',
    address: '789 Funny Street, Brisbane QLD 4000',
    event_date: '2025-01-08',
    start_time: '8:30 PM',
    end_time: '11:00 PM',
    description: 'Professional comedy showcase featuring established comedians.',
    type: 'Professional',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: false,
    spots: 6,
    applied_spots: 4,
    status: 'open',
    allow_recording: false,
    dress_code: 'Smart Casual',
    banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop',
    x: 55,
    y: 25
  },
  {
    id: 'mock-4',
    title: 'Perth Sunset Comedy',
    venue: 'Sunset Lounge',
    city: 'Perth',
    state: 'WA',
    address: '321 Sunset Drive, Perth WA 6000',
    event_date: '2025-01-10',
    start_time: '6:00 PM',
    end_time: '8:30 PM',
    description: 'Enjoy comedy with a beautiful sunset view over Perth.',
    type: 'Mixed',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: false,
    spots: 10,
    applied_spots: 6,
    status: 'open',
    allow_recording: true,
    dress_code: 'Casual',
    banner_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop',
    x: 10,
    y: 50
  },
  {
    id: 'mock-5',
    title: 'Adelaide Comedy Festival Preview',
    venue: 'Adelaide Arts Centre',
    city: 'Adelaide',
    state: 'SA',
    address: '567 Arts Way, Adelaide SA 5000',
    event_date: '2025-01-12',
    start_time: '7:00 PM',
    end_time: '9:00 PM',
    description: 'Preview night for the upcoming Adelaide Comedy Festival.',
    type: 'Professional',
    age_restriction: '16+',
    is_paid: true,
    is_verified_only: true,
    spots: 5,
    applied_spots: 5,
    status: 'full',
    allow_recording: false,
    dress_code: 'Smart Casual',
    banner_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    requirements: 'Comedian Pro members only',
    x: 28,
    y: 70
  },
  {
    id: 'mock-6',
    title: 'Gold Coast Beach Comedy',
    venue: 'Beachside Bar',
    city: 'Gold Coast',
    state: 'QLD',
    address: '888 Beach Road, Gold Coast QLD 4217',
    event_date: '2025-01-15',
    start_time: '8:00 PM',
    end_time: '10:00 PM',
    description: 'Comedy by the beach with ocean views.',
    type: 'Mixed',
    age_restriction: '18+',
    is_paid: false,
    is_verified_only: false,
    spots: 8,
    applied_spots: 3,
    status: 'open',
    allow_recording: true,
    dress_code: 'Beach Casual',
    banner_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
    x: 65,
    y: 20
  },
  {
    id: 'mock-7',
    title: 'Newcastle Comedy Night',
    venue: 'The Steel City Club',
    city: 'Newcastle',
    state: 'NSW',
    address: '999 Steel Street, Newcastle NSW 2300',
    event_date: '2025-01-18',
    start_time: '7:30 PM',
    end_time: '9:30 PM',
    description: 'Local comedy night featuring Newcastle\'s best comedians.',
    type: 'Open Mic',
    age_restriction: '18+',
    is_paid: false,
    is_verified_only: false,
    spots: 10,
    applied_spots: 7,
    status: 'open',
    allow_recording: true,
    dress_code: 'Casual',
    banner_url: 'https://images.unsplash.com/photo-1588270937732-b6ba75eb8b45?w=800&h=400&fit=crop',
    x: 48,
    y: 40
  },
  {
    id: 'mock-8',
    title: 'Canberra Capitol Comedy',
    venue: 'Parliament House Comedy Club',
    city: 'Canberra',
    state: 'ACT',
    address: '111 Parliament Drive, Canberra ACT 2600',
    event_date: '2025-01-20',
    start_time: '8:00 PM',
    end_time: '10:30 PM',
    description: 'Political satire and general comedy in the nation\'s capital.',
    type: 'Professional',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: true,
    spots: 6,
    applied_spots: 4,
    status: 'open',
    allow_recording: false,
    dress_code: 'Business Casual',
    banner_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop',
    requirements: 'Comedian Pro members only',
    x: 52,
    y: 50
  }
];

export const MapView: React.FC = () => {
  const [selectedShow, setSelectedShow] = useState<any>(null);
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());
  const { isMemberView } = useViewMode();
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter to show only upcoming events for member view
  const upcomingEvents = mockEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    const now = new Date();
    return eventDate >= now;
  });

  // Use upcoming events for member view, all events for other views
  const eventsToShow = isMemberView ? upcomingEvents : mockEvents;

  const handleToggleInterested = (event: any) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to mark events as interested.",
        variant: "destructive",
      });
      return;
    }

    const newInterestedEvents = new Set(interestedEvents);
    if (interestedEvents.has(event.id)) {
      newInterestedEvents.delete(event.id);
      toast({
        title: "Removed from interested",
        description: `"${event.title}" has been removed from your interested events.`,
      });
    } else {
      newInterestedEvents.add(event.id);
      toast({
        title: "Added to interested!",
        description: `"${event.title}" has been added to your calendar as an interested event.`,
      });
    }
    setInterestedEvents(newInterestedEvents);
  };

  const handleBuyTickets = (event: any) => {
    toast({
      title: "Ticket purchase",
      description: `Redirecting to ticket purchase for "${event.title}"`,
    });
  };

  const handleApply = (event: any) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to apply for shows.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Application submitted!",
      description: `Your application for "${event.title}" has been submitted successfully.`,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Australia Comedy Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gradient-to-br from-blue-200 to-green-200 rounded-lg overflow-hidden" style={{ height: '500px' }}>
              {/* Simple Australia map representation */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-300/30 to-green-300/30">
                {/* Major cities representation */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-32 h-16 bg-blue-400/60 rounded-full"></div>
                <div className="absolute top-16 left-1/3 w-24 h-24 bg-gray-300/40 rounded"></div>
                <div className="absolute bottom-16 right-1/4 w-20 h-20 bg-yellow-200/40 rounded"></div>
                <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-orange-200/40 rounded"></div>
              </div>

              {/* Show markers */}
              {eventsToShow.map((show) => (
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
          {selectedShow ? 'Event Details' : 'Select a venue'}
        </h3>

        {selectedShow ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{selectedShow.title}</CardTitle>
                  <p className="text-muted-foreground">{selectedShow.venue}</p>
                  <p className="text-muted-foreground text-sm">{selectedShow.city}, {selectedShow.state}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {isMemberView ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${
                        interestedEvents.has(selectedShow.id) 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-muted-foreground hover:text-red-500'
                      }`}
                      onClick={() => handleToggleInterested(selectedShow)}
                    >
                      <Heart className={`w-5 h-5 ${interestedEvents.has(selectedShow.id) ? 'fill-current' : ''}`} />
                    </Button>
                  ) : (
                    <>
                      {selectedShow.is_verified_only && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                          <Star className="w-3 h-3 mr-1" />
                          Comedian Pro
                        </Badge>
                      )}
                      <Badge variant="outline">{selectedShow.type}</Badge>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedShow.start_time}</span>
                </div>
                {!isMemberView && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedShow.spots - selectedShow.applied_spots} spots available</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedShow.city}, {selectedShow.state}</span>
                </div>
              </div>

              {/* Only show age restriction for member view */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-foreground border-border">
                  {selectedShow.age_restriction}
                </Badge>
                {!isMemberView && selectedShow.type && (
                  <Badge variant="outline" className="text-foreground border-border">
                    {selectedShow.type}
                  </Badge>
                )}
              </div>

              {selectedShow.description && (
                <p className="text-muted-foreground text-sm line-clamp-2">{selectedShow.description}</p>
              )}
              
              <div className="flex gap-2">
                {!isMemberView && (
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => handleApply(selectedShow)}
                    disabled={selectedShow.spots - selectedShow.applied_spots <= 0}
                  >
                    {selectedShow.spots - selectedShow.applied_spots <= 0 ? 'Show Full' : 'Apply Now'}
                  </Button>
                )}
                
                {(isMemberView || selectedShow.is_paid) && (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleBuyTickets(selectedShow)}
                  >
                    Buy Tickets
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8 text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-semibold mb-2">
                {isMemberView ? 'Explore Events Across Australia' : 'Explore Australia\'s Comedy Scene'}
              </h4>
              <p className="text-muted-foreground text-sm">
                Click on any red marker to see {isMemberView ? 'event' : 'show'} details
              </p>
            </CardContent>
          </Card>
        )}

        {/* Show list */}
        <div className="space-y-2">
          <h4 className="font-semibold">All {isMemberView ? 'Events' : 'Shows'}</h4>
          {eventsToShow.map((show) => (
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
              <div className="text-xs text-muted-foreground">{show.venue} • {show.start_time}</div>
              <div className="text-xs text-muted-foreground">{show.city}, {show.state}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
