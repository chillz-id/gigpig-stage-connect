
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Users, Star, Heart } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GoogleMapsComponent } from '@/components/GoogleMapsComponent';
import { mockEvents } from '@/data/mockEvents';

export const MapView: React.FC = () => {
  const [selectedShow, setSelectedShow] = useState<any>(null);
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());
  const { isMemberView } = useViewMode();
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter to show only upcoming events (from today onwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today

  const upcomingEvents = mockEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    return eventDate >= today;
  });

  // Always use upcoming events for all views
  const eventsToShow = upcomingEvents;

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
        <GoogleMapsComponent
          height="500px"
          showAddressInput={false}
          onAddressSelect={(address, lat, lng) => {
            // Find event near this location if needed
            console.log('Map location selected:', address, lat, lng);
          }}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          {selectedShow ? 'Event Details' : 'Comedy Events'}
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

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setSelectedShow(null)}
              >
                Back to Event List
              </Button>
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
                Select an event from the list below to see details
              </p>
            </CardContent>
          </Card>
        )}

        {/* Show list */}
        <div className="space-y-2">
          <h4 className="font-semibold">All {isMemberView ? 'Events' : 'Shows'} ({eventsToShow.length})</h4>
          <div className="max-h-96 overflow-y-auto space-y-2">
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
                <div className="text-xs text-muted-foreground">
                  {show.city}, {show.state} • {new Date(show.event_date).toLocaleDateString()}
                </div>
                {show.type && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">{show.type}</Badge>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
