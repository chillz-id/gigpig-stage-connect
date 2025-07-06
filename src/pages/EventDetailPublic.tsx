import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Calendar, MapPin, Clock, Users, DollarSign, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const EventDetailPublic = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event-public', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('No event ID provided');

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles!promoter_id (
            id,
            name,
            avatar_url
          ),
          event_spots (
            id,
            spot_name,
            is_paid,
            payment_amount,
            duration_minutes
          )
        `)
        .eq('id', eventId)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: applications } = useQuery({
    queryKey: ['event-applications-count', eventId],
    queryFn: async () => {
      if (!eventId) return { total: 0, accepted: 0 };

      const { count: total } = await supabase
        .from('event_applications')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      const { count: accepted } = await supabase
        .from('event_applications')
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

    // Navigate to application form or open modal
    navigate(`/events/${eventId}/apply`);
  };

  const handleBuyTickets = () => {
    if (event?.external_ticket_url) {
      window.open(event.external_ticket_url, '_blank');
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
        {event.banner_url && (
          <div className="mb-8 rounded-lg overflow-hidden h-64 md:h-96">
            <img 
              src={event.banner_url} 
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
                  <p className="whitespace-pre-wrap text-gray-300">{event.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Event Spots */}
            {event.event_spots && event.event_spots.length > 0 && (
              <Card className={cn(getCardStyles(), "text-white")}>
                <CardHeader>
                  <CardTitle>Available Spots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {event.event_spots.map((spot: any) => (
                      <div key={spot.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                        <div>
                          <h4 className="font-medium">{spot.spot_name}</h4>
                          {spot.duration_minutes && (
                            <p className="text-sm text-gray-400">{spot.duration_minutes} minutes</p>
                          )}
                        </div>
                        {spot.is_paid && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {spot.payment_amount}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className={cn(getCardStyles(), "text-white sticky top-4")}>
              <CardHeader>
                <CardTitle>Get Involved</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Apply Button for Comedians */}
                {user && !isPastEvent && (
                  <Button 
                    onClick={handleApply}
                    className="w-full"
                    size="lg"
                  >
                    Apply to Perform
                  </Button>
                )}

                {/* Buy Tickets Button */}
                {event.ticketing_type !== 'none' && !isPastEvent && (
                  <Button 
                    onClick={handleBuyTickets}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    {event.ticketing_type === 'external' ? 'Get Tickets' : 'Buy Tickets'}
                  </Button>
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
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-sm text-gray-400 mb-2">Organized by</p>
                    <div className="flex items-center gap-3">
                      {event.profiles.avatar_url && (
                        <img 
                          src={event.profiles.avatar_url}
                          alt={event.profiles.name}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <span className="font-medium">{event.profiles.name}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPublic;