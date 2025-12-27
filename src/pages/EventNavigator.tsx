/**
 * EventNavigator
 *
 * Intermediate page that handles navigation to event management.
 * For synced events (Humanitix/Eventbrite), finds or creates a linked
 * native event record before redirecting to EventManagement.
 *
 * Route: /events/navigate/:sourceType/:sourceId?orgId=xxx
 * Redirects to: /events/:eventId/manage
 */

import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type SourceType = 'native' | 'humanitix' | 'eventbrite';

export default function EventNavigator() {
  const { sourceType, sourceId } = useParams<{ sourceType: string; sourceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get orgId from URL query parameter (passed from OrganizationEvents)
  const orgIdFromUrl = searchParams.get('orgId');

  // For native events, redirect immediately
  useEffect(() => {
    if (sourceType === 'native' && sourceId) {
      navigate(`/events/${sourceId}/manage`, { replace: true });
    }
  }, [sourceType, sourceId, navigate]);

  // For synced events, find or create linked event
  const { data, isLoading, error } = useQuery({
    queryKey: ['navigate-linked-event', sourceType, sourceId],
    queryFn: async () => {
      if (!sourceId || !sourceType || sourceType === 'native') {
        throw new Error('Invalid navigation parameters');
      }

      const source = sourceType as SourceType;
      const sourceColumn = source === 'humanitix' ? 'humanitix_event_id' : 'eventbrite_event_id';

      // Fetch session details first (needed for both create and update)
      const { data: session, error: sessionError } = await supabase
        .from('session_complete')
        .select('*')
        .eq('canonical_session_source_id', sourceId)
        .single();

      if (sessionError) throw sessionError;

      // Check for existing linked event
      const { data: existingEvent, error: findError } = await supabase
        .from('events')
        .select('id')
        .eq(sourceColumn, sourceId)
        .maybeSingle();

      if (findError) throw findError;

      // If existing linked event found, update it with latest session data
      if (existingEvent) {
        const eventName = session.session_name || session.event_name;
        await supabase
          .from('events')
          .update({
            title: eventName,
            name: eventName,
            event_date: session.session_start,
            venue: session.venue_name || null,
            address: session.venue_name || null,
            description: session.description || null,
            banner_url: session.banner_image_url || null,
            hero_image_url: session.banner_image_url || null,
            ticket_url: session.url || null,
            ticket_popup_url: session.url_tickets_popup || null,
            status: session.published ? 'open' : 'draft',
          })
          .eq('id', existingEvent.id);

        return { eventId: existingEvent.id };
      }

      // Try to get orgId from URL param first, then from session_partners
      let orgId = orgIdFromUrl;

      if (!orgId) {
        // Look up organization from session_partners
        const { data: partner, error: partnerError } = await supabase
          .from('session_partners')
          .select('organization_id')
          .eq('canonical_session_source_id', sourceId)
          .limit(1)
          .maybeSingle();

        if (!partnerError && partner?.organization_id) {
          orgId = partner.organization_id;
        }
      }

      // Create linked event record with full session data
      const eventName = session.session_name || session.event_name;
      const eventData = {
        title: eventName,
        name: eventName,
        event_date: session.session_start,
        venue: session.venue_name || null,
        address: session.venue_name || null,
        description: session.description || null,
        banner_url: session.banner_image_url || null,
        hero_image_url: session.banner_image_url || null,
        ticket_url: session.url || null,
        ticket_popup_url: session.url_tickets_popup || null,
        source: source,
        source_id: sourceId,
        status: session.published ? 'open' : 'draft',
        organization_id: orgId || null,
        created_by_organization_id: orgId || null,
        humanitix_event_id: source === 'humanitix' ? sourceId : null,
        eventbrite_event_id: source === 'eventbrite' ? sourceId : null,
      };

      const { data: newEvent, error: createError } = await supabase
        .from('events')
        .insert(eventData)
        .select('id')
        .single();

      if (createError) throw createError;

      return { eventId: newEvent.id };
    },
    enabled: !!sourceId && !!sourceType && sourceType !== 'native',
  });

  // Redirect once we have the linked event ID
  useEffect(() => {
    if (data?.eventId) {
      navigate(`/events/${data.eventId}/manage`, { replace: true });
    }
  }, [data, navigate]);

  // Native events redirect immediately, so we only show loading for synced events
  if (sourceType === 'native') {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-16">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load event: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">
        Loading {sourceType === 'humanitix' ? 'Humanitix' : 'Eventbrite'} event...
      </p>
    </div>
  );
}
