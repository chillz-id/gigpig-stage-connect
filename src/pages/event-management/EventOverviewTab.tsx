import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Users, DollarSign, TrendingUp, Ticket, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { EventData } from '@/types/event';

interface SessionData {
  canonical_session_source_id: string;
  session_name: string;
  event_name: string;
  session_start: string;
  venue_name: string | null;
  description: string | null;
  banner_image_url: string | null;
  url: string | null;
  url_tickets_popup: string | null;
  published: boolean;
  total_ticket_count: number | null;
  total_order_count: number | null;
  total_gross_dollars: string | null;
  total_net_dollars: string | null;
  humanitix_ticket_count: number | null;
  humanitix_order_count: number | null;
  humanitix_gross_dollars: string | null;
  humanitix_net_dollars: string | null;
  eventbrite_ticket_count: number | null;
  eventbrite_order_count: number | null;
  eventbrite_gross_dollars: string | null;
  eventbrite_net_dollars: string | null;
}

interface EventOverviewTabProps {
  eventId: string;
  userId: string;
}

interface EventStats {
  totalApplications: number;
  confirmedApplications: number;
  pendingApplications: number;
  totalSpots: number;
  filledSpots: number;
  totalDeals: number;
  settledDeals: number;
  totalRevenue: number;
  projectedRevenue: number;
}

interface ActivityItem {
  id: string;
  type: 'application' | 'spot' | 'deal' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  user_name?: string;
}

export default function EventOverviewTab({ eventId, userId }: EventOverviewTabProps) {
  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery<EventData>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Check if this is a synced event (has source_id from Humanitix/Eventbrite)
  const isSyncedEvent = event?.source === 'humanitix' || event?.source === 'eventbrite';
  const sourceId = event?.source_id || event?.humanitix_event_id || event?.eventbrite_event_id;

  // Fetch session data for synced events (this has the REAL ticket/revenue data)
  const { data: sessionData, isLoading: sessionLoading } = useQuery<SessionData>({
    queryKey: ['session-data', sourceId],
    queryFn: async () => {
      if (!sourceId) return null;

      const { data, error } = await supabase
        .from('session_complete')
        .select('*')
        .eq('canonical_session_source_id', sourceId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
      return data;
    },
    enabled: isSyncedEvent && !!sourceId,
  });

  // Fetch event stats (only for native events - synced events use session_complete data)
  const { data: stats, isLoading: statsLoading } = useQuery<EventStats>({
    queryKey: ['event-stats', eventId],
    queryFn: async () => {
      const [applications, spots, deals] = await Promise.all([
        supabase
          .from('applications')
          .select('status')
          .eq('event_id', eventId),
        supabase
          .from('event_spots')
          .select('status')
          .eq('event_id', eventId),
        supabase
          .from('event_deals')
          .select('status, total_amount')
          .eq('event_id', eventId),
      ]);

      if (applications.error) throw applications.error;
      if (spots.error) throw spots.error;
      if (deals.error) throw deals.error;

      const totalApplications = applications.data?.length || 0;
      const confirmedApplications = applications.data?.filter(
        (a) => a.status === 'accepted'
      ).length || 0;
      const pendingApplications = applications.data?.filter(
        (a) => a.status === 'pending'
      ).length || 0;

      const totalSpots = spots.data?.length || 0;
      const filledSpots = spots.data?.filter(
        (s) => s.status === 'filled' || s.status === 'confirmed'
      ).length || 0;

      const totalDeals = deals.data?.length || 0;
      const settledDeals = deals.data?.filter(
        (d) => d.status === 'settled'
      ).length || 0;

      const totalRevenue = deals.data
        ?.filter((d) => d.status === 'settled')
        .reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0;

      const projectedRevenue = deals.data
        ?.reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0;

      return {
        totalApplications,
        confirmedApplications,
        pendingApplications,
        totalSpots,
        filledSpots,
        totalDeals,
        settledDeals,
        totalRevenue,
        projectedRevenue,
      };
    },
    enabled: !isSyncedEvent, // Skip for synced events
  });

  // Fetch recent activity (only for native events)
  const { data: activity, isLoading: activityLoading } = useQuery<ActivityItem[]>({
    queryKey: ['event-activity', eventId],
    queryFn: async () => {
      // Fetch recent applications
      const { data: recentApplications, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          applied_at,
          comedian:profiles!applications_comedian_id_fkey(stage_name)
        `)
        .eq('event_id', eventId)
        .order('applied_at', { ascending: false })
        .limit(10);

      if (appsError) throw appsError;

      const activities: ActivityItem[] = (recentApplications || []).map((app) => ({
        id: app.id,
        type: 'application' as const,
        title: 'New Application',
        description: `${app.comedian?.stage_name || 'Comedian'} applied for this event`,
        timestamp: app.applied_at,
        user_name: app.comedian?.stage_name,
      }));

      return activities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    enabled: !isSyncedEvent, // Skip for synced events
  });

  // Loading state - different for synced vs native events
  const isLoading = isSyncedEvent
    ? eventLoading || sessionLoading
    : eventLoading || statsLoading || activityLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Event not found</AlertDescription>
      </Alert>
    );
  }

  const progressPercentage = stats
    ? (stats.filledSpots / Math.max(stats.totalSpots, 1)) * 100
    : 0;

  // Get banner image - prefer session data for synced events
  const bannerUrl = isSyncedEvent
    ? sessionData?.banner_image_url || event.banner_url || event.hero_image_url
    : event.banner_url || event.hero_image_url;

  // Get venue - prefer session data for synced events
  const venueName = isSyncedEvent
    ? sessionData?.venue_name || event.venue_name || event.venue
    : event.venue_name || event.venue;

  // Get description - prefer session data for synced events
  const description = isSyncedEvent
    ? sessionData?.description || event.description
    : event.description;

  // Get event date - prefer session data for synced events
  const eventDate = isSyncedEvent
    ? sessionData?.session_start || event.event_date || event.date
    : event.event_date || event.date;

  return (
    <div className="space-y-6">
      {/* Event Banner */}
      {bannerUrl && (
        <div className="relative h-48 w-full overflow-hidden rounded-lg md:h-64">
          <img
            src={bannerUrl}
            alt={event.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">{event.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/90">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(eventDate)}
              </span>
              {venueName && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {venueName}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Details Card (shown if no banner or for additional info) */}
      {!bannerUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{event.title}</CardTitle>
                <CardDescription className="mt-2 flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(eventDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {event.start_time}
                  </span>
                  {venueName && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {venueName}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Badge variant={event.status === 'open' ? 'default' : 'secondary'}>
                {event.status}
              </Badge>
            </div>
          </CardHeader>
          {description && (
            <CardContent>
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Stats Grid - different content for synced vs native events */}
      {isSyncedEvent ? (
        /* Synced Event Stats - Ticket Sales from Humanitix/Eventbrite */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessionData?.total_ticket_count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                via {event.source === 'humanitix' ? 'Humanitix' : 'Eventbrite'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessionData?.total_order_count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                total orders placed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(sessionData?.total_gross_dollars || '0').toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                before fees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(sessionData?.total_net_dollars || '0').toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                after fees
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Native Event Stats - Applications/Lineup/Deals */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.confirmedApplications || 0} confirmed, {stats?.pendingApplications || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lineup Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.filledSpots || 0}/{stats?.totalSpots || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {progressPercentage.toFixed(0)}% complete
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deals</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalDeals || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.settledDeals || 0} settled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats?.projectedRevenue || 0)} projected
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Description Card (shown with banner) */}
      {bannerUrl && description && (
        <Card>
          <CardHeader>
            <CardTitle>About this Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {isSyncedEvent ? (
              <>
                {sessionData?.url && (
                  <Button
                    className="professional-button"
                    size="sm"
                    onClick={() => window.open(sessionData.url!, '_blank')}
                  >
                    View on {event.source === 'humanitix' ? 'Humanitix' : 'Eventbrite'}
                  </Button>
                )}
                {sessionData?.url_tickets_popup && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(sessionData.url_tickets_popup!, '_blank')}
                  >
                    Ticket Widget URL
                  </Button>
                )}
                <Button variant="secondary" size="sm">
                  Manage Lineup
                </Button>
                <Button variant="secondary" size="sm">
                  Create Deal
                </Button>
              </>
            ) : (
              <>
                <Button className="professional-button" size="sm">
                  View Applications
                </Button>
                <Button className="professional-button" size="sm">
                  Manage Lineup
                </Button>
                <Button className="professional-button" size="sm">
                  Create Deal
                </Button>
                <Button className="professional-button" size="sm">
                  Export Data
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity - only for native events */}
      {!isSyncedEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates for this event</CardDescription>
          </CardHeader>
          <CardContent>
            {activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Source Info for synced events */}
      {isSyncedEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Event Source</CardTitle>
            <CardDescription>
              This event is synced from {event.source === 'humanitix' ? 'Humanitix' : 'Eventbrite'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Source ID:</span>{' '}
                <code className="rounded bg-muted px-1 py-0.5">{sourceId}</code>
              </p>
              <p className="text-muted-foreground">
                Ticket sales and order data are automatically synced from the ticketing platform.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
