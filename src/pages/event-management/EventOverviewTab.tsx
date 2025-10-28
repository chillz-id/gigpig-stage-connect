import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { EventData } from '@/types/event';

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

  // Fetch event stats
  const { data: stats, isLoading: statsLoading } = useQuery<EventStats>({
    queryKey: ['event-stats', eventId],
    queryFn: async () => {
      const [applications, spots, deals] = await Promise.all([
        supabase
          .from('event_applications')
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
        (a) => a.status === 'approved'
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
  });

  // Fetch recent activity
  const { data: activity, isLoading: activityLoading } = useQuery<ActivityItem[]>({
    queryKey: ['event-activity', eventId],
    queryFn: async () => {
      // Fetch recent applications
      const { data: recentApplications, error: appsError } = await supabase
        .from('event_applications')
        .select(`
          id,
          status,
          created_at,
          comedian:profiles!event_applications_comedian_id_fkey(stage_name)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (appsError) throw appsError;

      const activities: ActivityItem[] = (recentApplications || []).map((app) => ({
        id: app.id,
        type: 'application' as const,
        title: 'New Application',
        description: `${app.comedian?.stage_name || 'Comedian'} applied for this event`,
        timestamp: app.created_at,
        user_name: app.comedian?.stage_name,
      }));

      return activities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
  });

  const isLoading = eventLoading || statsLoading || activityLoading;

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

  return (
    <div className="space-y-6">
      {/* Event Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              <CardDescription className="mt-2 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(event.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {event.start_time}
                </span>
                {event.venue_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.venue_name}
                  </span>
                )}
              </CardDescription>
            </div>
            <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
              {event.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              View Applications
            </Button>
            <Button variant="outline" size="sm">
              Manage Lineup
            </Button>
            <Button variant="outline" size="sm">
              Create Deal
            </Button>
            <Button variant="outline" size="sm">
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
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
    </div>
  );
}
