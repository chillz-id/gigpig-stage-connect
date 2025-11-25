
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Star, 
  Mic,
  AlertCircle,
  CheckCircle,
  Navigation
} from 'lucide-react';
import { useEventSpots } from '@/hooks/useEventSpots';
import { useAuth } from '@/contexts/AuthContext';
import { useEventApplications } from '@/hooks/useEventApplications';
import { cn } from '@/lib/utils';

interface EventDetailsPopupProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onApply: (event: any) => void;
  onBuyTickets: (event: any) => void;
  onGetDirections: (event: any) => void;
  isIndustryUser: boolean;
  isConsumerUser: boolean;
}

export const EventDetailsPopup: React.FC<EventDetailsPopupProps> = ({
  event,
  isOpen,
  onClose,
  onApply,
  onBuyTickets,
  onGetDirections,
  isIndustryUser,
  isConsumerUser
}) => {
  const { spots, isLoading: spotsLoading } = useEventSpots(event?.id || '');
  const { user, hasRole } = useAuth();
  const { userApplications } = useEventApplications();
  const [applicationStatus, setApplicationStatus] = useState<'pending' | 'accepted' | 'rejected' | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  
  useEffect(() => {
    if (user && userApplications && event) {
      const application = userApplications.find(app => app.event_id === event.id);
      setHasApplied(!!application);
      setApplicationStatus(application?.status || null);
    }
  }, [user, userApplications, event]);

  if (!event) return null;

  const eventDate = new Date(event.event_date);
  const now = new Date();
  const isUpcoming = eventDate >= now;
  
  const filledSpots = spots?.filter(spot => spot.is_filled) || [];
  const availableSpots = spots?.filter(spot => !spot.is_filled) || [];

  // Determine if user is a consumer (not an industry user)
  const isConsumer = !user || (!hasRole('comedian') && !hasRole('comedian_lite') && !hasRole('admin'));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Banner */}
          {event.image_url && (
            <div className="aspect-[3/1] relative rounded-lg overflow-hidden">
              <img 
                src={event.image_url} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-xl font-bold">{event.venue}</h2>
                <p className="text-gray-200">{event.city}, {event.state}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Event Details */}
              <div className="space-y-4">
                {!isUpcoming && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">This event has already occurred</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{eventDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{event.start_time || 'Time TBA'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{event.city}, {event.state}</span>
                  </div>
                  {/* Show paid event info for industry users */}
                  {!isConsumer && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>{event.is_paid ? 'Paid Event' : 'Free Event'}</span>
                    </div>
                  )}
                </div>

                {event.address && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Full Address:</p>
                    <p>{event.address}</p>
                  </div>
                )}

                {event.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Description:</p>
                    <p className="text-foreground">{event.description}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {/* For consumers, only show age restriction */}
                  {isConsumer ? (
                    <Badge className="professional-button">
                      {event.age_restriction}
                    </Badge>
                  ) : (
                    <>
                      {event.type && (
                        <Badge className="professional-button">
                          {event.type}
                        </Badge>
                      )}
                      <Badge className="professional-button">
                        {event.age_restriction}
                      </Badge>
                      <Badge className="professional-button">
                        {event.dress_code}
                      </Badge>
                      {event.is_verified_only && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                          <Star className="w-3 h-3 mr-1" />
                          Comedian Pro
                        </Badge>
                      )}
                      {event.allow_recording && (
                        <Badge className="professional-button text-green-600 border-green-600">
                          Recording Allowed
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                {/* Only show requirements for industry users */}
                {!isConsumer && event.requirements && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Requirements:</p>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-foreground whitespace-pre-line">{event.requirements}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Confirmed Line-up */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Confirmed Line-up ({filledSpots.length})
                </h3>
                {filledSpots.length > 0 ? (
                  <div className="space-y-3">
                    {filledSpots.map((spot, index) => (
                      <div key={spot.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {index + 1}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{spot.spot_name}</p>
                            <p className="text-sm text-muted-foreground">{spot.duration_minutes} minutes</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Only show payment info for industry users */}
                          {!isConsumer && spot.is_paid && (
                            <Badge className="bg-green-600">
                              ${spot.payment_amount} {spot.currency}
                            </Badge>
                          )}
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mic className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No confirmed comedians yet</p>
                    {isUpcoming && <p className="text-sm text-muted-foreground">Be the first to apply!</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {isUpcoming ? 'Spots Available' : 'Event Status'}
                </h3>
                <div className="text-center">
                  {isUpcoming ? (
                    <>
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {availableSpots.length}
                      </div>
                      <p className="text-muted-foreground">out of {spots?.length || 0} total spots</p>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-muted-foreground mb-2">
                        Past Event
                      </div>
                      <p className="text-muted-foreground">This event has concluded</p>
                    </>
                  )}
                </div>
              </div>

              {/* Available Spots Details - only show for industry users */}
              {!isConsumer && isUpcoming && availableSpots.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Available Spots</h3>
                  <div className="space-y-3">
                    {availableSpots.map((spot) => (
                      <div key={spot.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{spot.spot_name}</p>
                          {spot.is_paid && (
                            <Badge className="bg-green-600 text-xs">
                              ${spot.payment_amount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {spot.duration_minutes} minutes
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Status */}
              {isIndustryUser && hasApplied && (
                <div className="p-4 rounded-lg border bg-accent/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">Application Status</h4>
                      <Badge 
                        variant={
                          applicationStatus === 'accepted' ? 'default' : 
                          applicationStatus === 'rejected' ? 'destructive' : 
                          'secondary'
                        }
                        className={cn(
                          applicationStatus === 'accepted' && "bg-green-500 hover:bg-green-600",
                          applicationStatus === 'pending' && "bg-yellow-500 hover:bg-yellow-600"
                        )}
                      >
                        {applicationStatus === 'accepted' && 'Accepted'}
                        {applicationStatus === 'rejected' && 'Not Selected'}
                        {applicationStatus === 'pending' && 'Pending Review'}
                      </Badge>
                    </div>
                  </div>
                  {applicationStatus === 'accepted' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Congratulations! You've been selected for this event.
                    </p>
                  )}
                  {applicationStatus === 'pending' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Your application is being reviewed. We'll notify you once a decision is made.
                    </p>
                  )}
                  {applicationStatus === 'rejected' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Unfortunately, you weren't selected for this event. Keep applying to other shows!
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {isIndustryUser && isUpcoming && !isConsumer && !hasApplied && (
                  <Button 
                    onClick={() => onApply(event)}
                    disabled={availableSpots.length <= 0}
                    className="w-full"
                  >
                    {availableSpots.length <= 0 ? 'Show Full' : 'Apply Now'}
                  </Button>
                )}
                
                {(isConsumerUser || isConsumer) && event.is_paid && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => onBuyTickets(event)}
                  >
                    Buy Tickets
                  </Button>
                )}
                
                {event.address && (
                  <Button
                    className="professional-button"
                    onClick={() => onGetDirections(event)}
                    className="w-full flex items-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Get Directions
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
