
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, Star, Heart, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MapEventDetailsProps {
  selectedShow: any;
  interestedEvents: Set<string>;
  onToggleInterested: (event: any) => void;
  onApply: (event: any) => void;
  onBuyTickets: (event: any) => void;
  onBackToList: () => void;
}

export const MapEventDetails: React.FC<MapEventDetailsProps> = ({
  selectedShow,
  interestedEvents,
  onToggleInterested,
  onApply,
  onBuyTickets,
  onBackToList,
}) => {
  const { user, hasRole } = useAuth();
  
  // Determine if user is a consumer (not an industry user)
  const isConsumer = !user || (!hasRole('comedian') && !hasRole('comedian_lite') && !hasRole('admin'));

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{selectedShow.title}</CardTitle>
            <p className="text-muted-foreground">{selectedShow.venue}</p>
            <p className="text-muted-foreground text-sm">{selectedShow.city}, {selectedShow.state}</p>
          </div>
          <div className="flex flex-col gap-2">
            {isConsumer ? (
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  interestedEvents.has(selectedShow.id) 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-muted-foreground hover:text-red-500'
                }`}
                onClick={() => onToggleInterested(selectedShow)}
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
                <Badge className="professional-button">{selectedShow.type}</Badge>
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
          {!isConsumer && (
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

        {/* Only show age restriction for consumers */}
        <div className="flex flex-wrap gap-2">
          <Badge className="professional-button text-foreground border-border">
            {selectedShow.age_restriction}
          </Badge>
          {!isConsumer && selectedShow.type && (
            <Badge className="professional-button text-foreground border-border">
              {selectedShow.type}
            </Badge>
          )}
        </div>

        {selectedShow.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">{selectedShow.description}</p>
        )}
        
        <div className="flex gap-2">
          {!isConsumer && (
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => onApply(selectedShow)}
              disabled={selectedShow.spots - selectedShow.applied_spots <= 0}
            >
              {selectedShow.spots - selectedShow.applied_spots <= 0 ? 'Show Full' : 'Apply Now'}
            </Button>
          )}
          
          {(isConsumer || selectedShow.is_paid) && (
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onBuyTickets(selectedShow)}
            >
              Buy Tickets
            </Button>
          )}
        </div>

        <Button 
          className="professional-button w-full"
          onClick={onBackToList}
        >
          Back to Event List
        </Button>
      </CardContent>
    </Card>
  );
};
