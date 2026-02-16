/**
 * EventManagement Page
 *
 * Main event management interface with tab navigation:
 * - Overview: Event details, stats, and activity feed
 * - Applications: Review and manage comedian applications
 * - Lineup: Build and configure the event lineup
 * - Deals: Create and manage revenue sharing agreements
 *
 * Route: /events/:eventId/manage
 * Access: Promoter/Admin only (event owners)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeEventManagement } from '@/hooks/useRealtimeSync';
import { RealtimeIndicator } from '@/components/event-management/RealtimeIndicator';
import EventOverviewTab from './event-management/EventOverviewTab';
import ApplicationsTab from './event-management/ApplicationsTab';
import LineupTab from './event-management/LineupTab';
import TicketsTab from './event-management/TicketsTab';
import DealsTab from './event-management/DealsTab';
import PartnersTab from './event-management/PartnersTab';
import { formatDate } from '@/lib/utils';
import type { EventData } from '@/types/event';

type TabValue = 'overview' | 'applications' | 'lineup' | 'tickets' | 'deals' | 'partners';

export default function EventManagement() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get tab from URL or default to 'overview'
  const currentTab = (searchParams.get('tab') as TabValue) || 'overview';

  const [hiddenComedianIds, setHiddenComedianIds] = useState<string[]>([]);

  // Fetch event details with organization ownership info
  const {
    data: event,
    isLoading: eventLoading,
    error: eventError,
  } = useQuery<EventData & { organization_owner_id?: string | null; organization_slug?: string | null }>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organization_profiles!events_organization_id_fkey (
            owner_id,
            url_slug
          )
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;

      // Flatten organization data into event data
      const orgProfiles = (data as any)?.organization_profiles;
      return {
        ...data,
        organization_owner_id: orgProfiles?.owner_id ?? null,
        organization_slug: orgProfiles?.url_slug ?? null,
      };
    },
    enabled: !!eventId,
  });

  // Check if user is event owner (direct promoter OR organization owner) or admin
  const isAdmin = hasRole('admin');
  const isOwner =
    isAdmin ||
    event?.promoter_id === user?.id ||
    event?.organization_owner_id === user?.id;

  // Enable real-time subscriptions
  const { isFullyConnected, connections } = useRealtimeEventManagement(
    eventId || '',
    user?.id || ''
  );

  // Access control: redirect if not owner/admin
  useEffect(() => {
    if (event && !isOwner) {
      navigate(`/events/${eventId}`);
    }
  }, [event, isOwner, eventId, navigate]);

  // Handle tab change - update URL
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Handle hide comedians
  const handleHideComedians = (comedianIds: string[], scope: 'event' | 'global') => {
    // TODO: Implement hide comedian logic
    console.log('Hide comedians:', comedianIds, scope);
    setHiddenComedianIds([...hiddenComedianIds, ...comedianIds]);
  };

  // Auth guards
  if (!eventId) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Event ID is required.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>You must be logged in to manage events.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (eventLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state
  if (eventError || !event) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {eventError instanceof Error
              ? eventError.message
              : 'Failed to load event. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Access denied state
  if (!isOwner) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            You do not have permission to manage this event.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Navigate to org events page if we have a slug, otherwise go to dashboard
                if (event?.organization_slug) {
                  navigate(`/org/${event.organization_slug}/events`);
                } else {
                  navigate('/dashboard');
                }
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {(event.event_date || event.date) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(event.event_date || event.date)}
                  </span>
                )}
                {(event.venue_name || event.venue) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.venue_name || event.venue}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Manage Event
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <RealtimeIndicator
                isConnected={isFullyConnected}
                connections={connections}
              />
              <Button
                className="professional-button"
                onClick={() => navigate(`/events/${eventId}`)}
              >
                View Public Page
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="lineup">Lineup</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <div className="mt-6">
            <TabsContent value="overview" className="space-y-6">
              <EventOverviewTab eventId={eventId} userId={user.id} />
            </TabsContent>

            <TabsContent value="applications" className="space-y-6">
              <ApplicationsTab
                eventId={eventId}
                userId={user.id}
                hiddenComedianIds={hiddenComedianIds}
                onHideComedians={handleHideComedians}
              />
            </TabsContent>

            <TabsContent value="lineup" className="space-y-6">
              <LineupTab eventId={eventId} userId={user.id} />
            </TabsContent>

            <TabsContent value="tickets" className="space-y-6">
              <TicketsTab eventId={eventId} />
            </TabsContent>

            <TabsContent value="deals" className="space-y-6">
              <DealsTab
                eventId={eventId}
                userId={user.id}
                isOwner={isOwner}
              />
            </TabsContent>

            <TabsContent value="partners" className="space-y-6">
              <PartnersTab
                eventId={eventId}
                userId={user.id}
                isOwner={isOwner}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
