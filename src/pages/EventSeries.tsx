/**
 * EventSeries Page
 *
 * Displays all events in a recurring series.
 * Groups events by series_id and shows them in chronological order.
 *
 * Route: /events/series/:seriesId
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Users,
  ArrowLeft,
  Repeat,
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isPast } from 'date-fns';

interface SeriesEvent {
  id: string;
  title: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  type: string | null;
  spots: number | null;
  applied_spots: number | null;
  status: string | null;
  age_restriction: string | null;
  is_paid: boolean | null;
  allow_recording: boolean | null;
  dress_code: string | null;
  banner_url: string | null;
  recurrence_pattern: string | null;
}

export default function EventSeries() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();

  // Fetch all events in this series
  const {
    data: events,
    isLoading,
    error,
  } = useQuery<SeriesEvent[]>({
    queryKey: ['event-series', seriesId],
    queryFn: async () => {
      if (!seriesId) throw new Error('Series ID is required');

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          start_time,
          end_time,
          venue,
          address,
          city,
          state,
          description,
          type,
          spots,
          applied_spots,
          status,
          age_restriction,
          is_paid,
          allow_recording,
          dress_code,
          banner_url,
          recurrence_pattern
        `)
        .eq('series_id', seriesId)
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!seriesId,
  });

  // Get series info from the first event
  const firstEvent = events?.[0];
  const seriesTitle = firstEvent?.title || 'Event Series';
  const seriesVenue = firstEvent?.venue || 'TBA';
  const seriesCity = firstEvent?.city || '';
  const seriesState = firstEvent?.state || '';
  const seriesDescription = firstEvent?.description || '';
  const seriesType = firstEvent?.type || 'Event';
  const seriesPattern = firstEvent?.recurrence_pattern || 'Recurring';
  const seriesBanner = firstEvent?.banner_url;

  const handleApply = (event: SeriesEvent) => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to apply for shows.',
        variant: 'destructive',
      });
      return;
    }

    // Navigate to event detail page to apply
    navigate(`/events/${event.id}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load event series'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // No events found
  if (!events || events.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Series Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The event series you're looking for doesn't exist or has no events.
            </p>
            <Button onClick={() => navigate('/browse')}>Browse Events</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Series Banner */}
          <Card className="overflow-hidden">
            <div className="aspect-[3/1] relative bg-muted">
              {seriesBanner ? (
                <img
                  src={seriesBanner}
                  alt={seriesTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="w-5 h-5" />
                  <Badge variant="secondary">{seriesPattern}</Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{seriesTitle}</h1>
                <p className="text-lg text-gray-200 mb-2">
                  {seriesVenue}
                  {seriesCity && ` • ${seriesCity}`}
                  {seriesState && `, ${seriesState}`}
                </p>
                {seriesDescription && (
                  <p className="text-gray-300 max-w-2xl line-clamp-2">
                    {seriesDescription}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Events List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              Upcoming Shows ({events.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const eventDate = event.event_date ? parseISO(event.event_date) : null;
                const availableSpots = (event.spots || 0) - (event.applied_spots || 0);
                const isPastEvent = eventDate ? isPast(eventDate) : false;
                const isFull = availableSpots <= 0;

                return (
                  <Card key={event.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">
                            {eventDate
                              ? format(eventDate, 'EEEE, MMMM d, yyyy')
                              : 'Date TBA'}
                          </CardTitle>
                          <CardDescription>{event.venue || seriesVenue}</CardDescription>
                        </div>
                        <div className="flex flex-col gap-2">
                          {isFull ? (
                            <Badge variant="destructive">Full</Badge>
                          ) : isPastEvent ? (
                            <Badge variant="secondary">Past</Badge>
                          ) : event.status === 'cancelled' ? (
                            <Badge variant="destructive">Cancelled</Badge>
                          ) : (
                            <Badge className="bg-green-600 text-white">Open</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {(event.start_time || event.end_time) && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {event.start_time || 'TBA'}
                              {event.end_time && ` - ${event.end_time}`}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{Math.max(0, availableSpots)} spots left</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{event.is_paid ? 'Paid' : 'Free'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {event.type && (
                          <Badge variant="secondary">{event.type}</Badge>
                        )}
                        {event.age_restriction && (
                          <Badge variant="secondary">{event.age_restriction}</Badge>
                        )}
                        {event.dress_code && (
                          <Badge variant="secondary">{event.dress_code}</Badge>
                        )}
                        {event.allow_recording && (
                          <Badge variant="secondary" className="text-green-600">
                            Recording OK
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 mt-auto pt-4">
                        <Button
                          className="flex-1"
                          onClick={() => handleApply(event)}
                          disabled={isFull || isPastEvent || event.status === 'cancelled'}
                        >
                          {isFull
                            ? 'Full'
                            : isPastEvent
                            ? 'Past'
                            : event.status === 'cancelled'
                            ? 'Cancelled'
                            : 'Apply Now'}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Series Information */}
          <Card>
            <CardHeader>
              <CardTitle>About This Series</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {firstEvent?.address && (
                  <div>
                    <h4 className="font-semibold mb-1">Location</h4>
                    <p className="text-muted-foreground">{firstEvent.address}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold mb-1">Show Type</h4>
                  <p className="text-muted-foreground">{seriesType}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Schedule</h4>
                  <p className="text-muted-foreground">{seriesPattern}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Total Shows</h4>
                  <p className="text-muted-foreground">{events.length} scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
