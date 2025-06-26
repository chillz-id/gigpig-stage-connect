
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GoogleMapsComponent } from '@/components/GoogleMapsComponent';
import { MapEventDetails } from '@/components/MapEventDetails';
import { MapEventList } from '@/components/MapEventList';

export const MapView: React.FC = () => {
  const [selectedShow, setSelectedShow] = useState<any>(null);
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());
  const { isMemberView } = useViewMode();
  const { user } = useAuth();
  const { toast } = useToast();

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
          <MapEventDetails
            selectedShow={selectedShow}
            interestedEvents={interestedEvents}
            onToggleInterested={handleToggleInterested}
            onApply={handleApply}
            onBuyTickets={handleBuyTickets}
            onBackToList={() => setSelectedShow(null)}
          />
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

        <MapEventList
          onEventSelect={setSelectedShow}
          selectedShow={selectedShow}
        />
      </div>
    </div>
  );
};
