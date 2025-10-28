import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { useTickets } from '@/hooks/useTickets';
import { useSubmitApplication } from '@/hooks/useSubmitApplication';
import { ApplicationForm } from '@/components/ApplicationForm';
import { ApplicationFormData } from '@/types/application';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Calendar, MapPin, Clock, Users, DollarSign, Info, Edit, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useEvent } from '@/hooks/data/useEvents';
import { WaitlistForm } from '@/components/WaitlistForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const EventDetailPublic = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const { purchaseTicket, isPurchasing } = useTickets();
  const { submitApplication, isSubmitting } = useSubmitApplication();
  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // Determine user type
  const isComedian = user && hasRole('comedian');
  const isPromoter = user && hasRole('promoter');
  const isIndustryUser = isComedian || isPromoter || (user && hasRole('admin'));
  const isCustomer = !isIndustryUser;

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event-public', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('No event ID provided');

      // First try to get from Supabase
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_spots (
            id,
            spot_name,
            is_paid,
            payment_amount,
            duration_minutes
          )
        `)
        .eq('id', eventId)
        .in('status', ['open', 'closed'])
        .single();

      if (!data) {
        throw new Error('Event not found');
      }

      // Fetch promoter profile separately since no FK exists
      if (data.promoter_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, bio')
          .eq('id', data.promoter_id)
          .single();

        if (profileData) {
          data.profiles = profileData;
        }
      }

      return data;
    }
  });

  const { data: applications } = useQuery({
    queryKey: ['event-applications-count', eventId],
    queryFn: async () => {
      if (!eventId) return { total: 0, accepted: 0 };

      const { count: total } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      const { count: accepted } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'accepted');

      return { total: total || 0, accepted: accepted || 0 };
    },
    enabled: !!eventId
  });

  const handleApply = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to apply for this event.",
        variant: "destructive"
      });
      navigate('/auth', { state: { from: { pathname: `/events/${eventId}` } } });
      return;
    }

    // Show the application form dialog
    setShowApplicationForm(true);
  };

  const handleSubmitApplication = async (data: ApplicationFormData) => {
    try {
      await submitApplication({
        event_id: data.event_id,
        message: data.message,
        spot_type: data.spot_type,
        availability_confirmed: data.availability_confirmed,
        requirements_acknowledged: data.requirements_acknowledged
      });
      setShowApplicationForm(false);
    } catch (error) {
      console.error('Failed to submit application:', error);
    }
  };

  const handleBuyTickets = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to purchase tickets.",
        variant: "destructive"
      });
      navigate('/auth', { state: { from: { pathname: `/events/${eventId}` } } });
      return;
    }

    if (event?.ticketing_type === 'external' && event.external_ticket_url) {
      window.open(event.external_ticket_url, '_blank');
    } else if (event?.ticketing_type === 'internal') {
      // For now, create a basic ticket purchase
      // In a real implementation, this would open a ticket selection modal
      purchaseTicket({
        event_id: event.id,
        ticket_type: 'General Admission',
        quantity: 1,
        total_price: 25.00 // Default price, should come from event ticket data
      });
    } else {
      toast({
        title: "Tickets not available",
        description: "Ticket sales for this event are not available yet.",
        variant: "destructive"
      });
    }
  };

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/10 backdrop-blur-sm border-white/20';
    }
    return 'bg-gray-800/90 border-gray-600';
  };

  if (isLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", getBackgroundStyles())}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", getBackgroundStyles())}>
        <Card className={cn("max-w-md w-full", getCardStyles())}>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Event not found</h2>
            <p className="text-gray-300 mb-4">This event may have been removed or is not available.</p>
            <Button onClick={() => navigate('/shows')} variant="default">
              Browse Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const isPastEvent = eventDate < new Date();

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-8">
        {/* Event Banner */}
        {event.image_url && (
          <div className="mb-8 rounded-lg overflow-hidden h-64 md:h-96">
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <Card className={cn(getCardStyles(), "text-white")}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl md:text-3xl mb-2">{event.title}</CardTitle>
                    <div className="flex items-center gap-4 text-gray-300">
                      <Badge variant={isPastEvent ? "secondary" : "default"}>
                        {isPastEvent ? "Past Event" : "Upcoming"}
                      </Badge>
                      {event.show_type && (
                        <Badge variant="outline">{event.show_type}</Badge>
                      )}
                    </div>
                  </div>
                  {user && (event.promoter_id === user.id || hasRole('admin')) && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/events/${eventId}/manage`)}
                        className="flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Manage Event
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/events/${eventId}/edit`)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Event
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span>{event.start_time || 'Time TBA'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span>
                      {applications?.accepted || 0} / {event.spots || 0} spots filled
                    </span>
                  </div>
                </div>

                {event.address && (
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-gray-300">
                      {event.address}, {event.city}, {event.state}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Description */}
            {event.description && (
              <Card className={cn(getCardStyles(), "text-white")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    About This Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-gray-300">
                    {event.full_description || event.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Submission Guidelines - Only for Comedians */}
            {isComedian && event.submission_guidelines && event.submission_guidelines.length > 0 && (
              <Card className={cn(getCardStyles(), "text-white")}>
                <CardHeader>
                  <CardTitle>Application Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {event.submission_guidelines.map((guideline: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span>{guideline}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* What to Expect - Different content for comedians vs customers */}
            {((isComedian && event.what_to_expect) || (isCustomer && event.customer_what_to_expect) || (!user && event.customer_what_to_expect)) && (
              <Card className={cn(getCardStyles(), "text-white")}>
                <CardHeader>
                  <CardTitle>
                    {isComedian ? "What to Expect as a Performer" : "What to Expect"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(isComedian ? event.what_to_expect : (event.customer_what_to_expect || event.what_to_expect))?.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Venue Details */}
            {event.venue_details && (
              <Card className={cn(getCardStyles(), "text-white")}>
                <CardHeader>
                  <CardTitle>Venue Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300">{event.venue_details.description}</p>
                  
                  {event.venue_details.amenities && event.venue_details.amenities.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Amenities</h4>
                      <ul className="space-y-1">
                        {event.venue_details.amenities.map((amenity: string, index: number) => (
                          <li key={index} className="flex items-center gap-2 text-gray-300">
                            <span className="text-blue-400">•</span>
                            <span>{amenity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Parking: </span>
                      <span className="text-gray-300">{event.venue_details.parking}</span>
                    </div>
                    <div>
                      <span className="font-medium">Accessibility: </span>
                      <span className="text-gray-300">{event.venue_details.accessibility}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Event Spots - Show different details for comedians vs customers */}
            {event.event_spots && event.event_spots.length > 0 && (
              <Card className={cn(getCardStyles(), "text-white")}>
                <CardHeader>
                  <CardTitle>
                    {isComedian ? "Available Performance Spots" : "Tonight's Lineup"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {event.event_spots.map((spot: any) => (
                      <div key={spot.id} className="p-3 rounded-lg bg-white/5 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{spot.spot_name}</h4>
                            {/* Show different info for comedians vs customers */}
                            {isComedian ? (
                              <>
                                {spot.description && (
                                  <p className="text-sm text-gray-400 mt-1">{spot.description}</p>
                                )}
                                {spot.duration_minutes && (
                                  <p className="text-xs text-gray-500">{spot.duration_minutes} minutes</p>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-gray-400 mt-1">
                                {spot.duration_minutes ? `${spot.duration_minutes} minutes` : 'Performance slot'}
                              </p>
                            )}
                          </div>
                          {/* Show payment info only to comedians */}
                          {isComedian && spot.is_paid && (
                            <Badge variant="outline" className="flex items-center gap-1 ml-3">
                              <DollarSign className="w-3 h-3" />
                              ${spot.payment_amount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Networking Opportunities - Only for Comedians */}
            {isComedian && event.networking_opportunities && event.networking_opportunities.length > 0 && (
              <Card className={cn(getCardStyles(), "text-white")}>
                <CardHeader>
                  <CardTitle>Networking Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {event.networking_opportunities.map((opportunity: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="text-purple-400 mt-1">→</span>
                        <span>{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className={cn(getCardStyles(), "text-white sticky top-4")}>
              <CardHeader>
                <CardTitle>
                  {isComedian ? "Apply to Perform" : isCustomer ? "Get Tickets" : "Event Actions"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Event Status for Closed Events */}
                {event.status === 'closed' && (
                  <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 text-center">
                    <p className="text-orange-200 font-medium">This event is sold out</p>
                    <p className="text-sm text-orange-200/80 mt-1">Join the waitlist to be notified if spots open up</p>
                  </div>
                )}

                {/* Apply Button for Comedians */}
                {isComedian && !isPastEvent && event.status === 'open' && (
                  <Button 
                    onClick={handleApply}
                    className="w-full"
                    size="lg"
                  >
                    Apply to Perform
                  </Button>
                )}

                {/* Buy Tickets Button for Customers */}
                {isCustomer && event.ticketing_type !== 'none' && !isPastEvent && (
                  <>
                    {event.status === 'open' ? (
                      <Button 
                        onClick={handleBuyTickets}
                        className="w-full"
                        size="lg"
                        disabled={isPurchasing}
                      >
                        {isPurchasing ? 'Processing...' : event.ticketing_type === 'external' ? 'Get Tickets' : 'Buy Tickets'}
                      </Button>
                    ) : event.status === 'closed' ? (
                      <Button 
                        onClick={() => setShowWaitlistDialog(true)}
                        className="w-full"
                        size="lg"
                        variant="secondary"
                      >
                        Join Waitlist
                      </Button>
                    ) : null}
                  </>
                )}

                {/* Industry Users (promoters, etc.) can see both options */}
                {isIndustryUser && !isComedian && (
                  <>
                    {!isPastEvent && (
                      <Button 
                        onClick={handleApply}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        View as Comedian
                      </Button>
                    )}
                    {event.ticketing_type !== 'none' && !isPastEvent && (
                      <>
                        {event.status === 'open' ? (
                          <Button 
                            onClick={handleBuyTickets}
                            variant="outline"
                            className="w-full"
                            size="lg"
                            disabled={isPurchasing}
                          >
                            {isPurchasing ? 'Processing...' : event.ticketing_type === 'external' ? 'Get Tickets' : 'Buy Tickets'}
                          </Button>
                        ) : event.status === 'closed' ? (
                          <Button 
                            onClick={() => setShowWaitlistDialog(true)}
                            variant="outline"
                            className="w-full"
                            size="lg"
                          >
                            Join Waitlist
                          </Button>
                        ) : null}
                      </>
                    )}
                  </>
                )}

                {/* Stats */}
                <div className="pt-4 border-t border-white/20 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Applications</span>
                    <span>{applications?.total || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Spots Available</span>
                    <span>{(event.spots || 0) - (applications?.accepted || 0)}</span>
                  </div>
                  {event.capacity > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Venue Capacity</span>
                      <span>{event.capacity}</span>
                    </div>
                  )}
                </div>

                {/* Promoter Info */}
                {event.profiles && (
                  <div className="pt-4 border-t border-white/20 space-y-3">
                    <p className="text-sm text-gray-400">Organized by</p>
                    <div className="flex items-start gap-3">
                      {event.profiles.avatar_url && (
                        <img 
                          src={event.profiles.avatar_url}
                          alt={event.profiles.name}
                          className="w-12 h-12 rounded-full flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{event.profiles.name}</h4>
                        {event.profiles.bio && (
                          <p className="text-sm text-gray-400 mt-1">{event.profiles.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Waitlist Dialog */}
      <Dialog open={showWaitlistDialog} onOpenChange={setShowWaitlistDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join the Waitlist</DialogTitle>
          </DialogHeader>
          <WaitlistForm 
            eventId={event.id} 
            eventTitle={event.title}
            onSuccess={() => setShowWaitlistDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Application Form Dialog */}
      <ApplicationForm
        open={showApplicationForm}
        onOpenChange={setShowApplicationForm}
        eventId={event.id}
        eventTitle={event.title}
        onSubmit={handleSubmitApplication}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default EventDetailPublic;