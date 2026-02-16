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

      // Get current user ID for promoter_id (required by RLS policy)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to access this event');
      }

      const source = sourceType as SourceType;
      const sourceColumn = source === 'humanitix' ? 'humanitix_event_id' : 'eventbrite_event_id';

      // Step 1: Try session_complete view first (has aggregated financial data)
      const { data: session, error: sessionError } = await supabase
        .from('session_complete')
        .select('*')
        .eq('canonical_session_source_id', sourceId)
        .maybeSingle(); // Won't error on zero rows

      if (sessionError) throw sessionError;

      // Step 2: If not found in session_complete, fall back to sessions_htx + events_htx
      let sessionData = session;
      if (!sessionData && source === 'humanitix') {
        // Query sessions_htx joined with events_htx to get full session and event data
        const { data: htxSession, error: htxError } = await supabase
          .from('sessions_htx')
          .select(`
            *,
            events_htx!sessions_htx_event_source_fk (
              name,
              description,
              banner_image_url,
              hero_image_url,
              url,
              published,
              venue_name,
              venue_address,
              status
            )
          `)
          .eq('source_id', sourceId)
          .maybeSingle();

        if (htxError) throw htxError;

        if (htxSession) {
          // Map sessions_htx + events_htx fields to expected session_complete format
          const event = htxSession.events_htx;
          sessionData = {
            session_name: htxSession.name,
            event_name: event?.name || htxSession.name,
            session_start: htxSession.start_date_local,
            venue_name: htxSession.venue_name || event?.venue_name,
            description: event?.description,
            banner_image_url: event?.banner_image_url,
            url: event?.url,
            url_tickets_popup: null, // Not available in raw htx data
            published: event?.published ?? event?.status === 'published',
          };
        }
      }

      // Step 3: If still not found, provide clear error message
      if (!sessionData) {
        throw new Error(
          `Humanitix session "${sourceId}" not found. ` +
          `The event may not have synced yet. Try refreshing your Humanitix data or create the event manually.`
        );
      }

      // Check for existing linked event
      const { data: existingEvent, error: findError } = await supabase
        .from('events')
        .select('id')
        .eq(sourceColumn, sourceId)
        .maybeSingle();

      if (findError) throw findError;

      // If existing linked event found, update it with latest session data
      if (existingEvent) {
        const eventName = sessionData.session_name || sessionData.event_name;
        await supabase
          .from('events')
          .update({
            title: eventName,
            name: eventName,
            event_date: sessionData.session_start,
            venue: sessionData.venue_name || null,
            address: sessionData.venue_name || null,
            description: sessionData.description || null,
            banner_url: sessionData.banner_image_url || null,
            hero_image_url: sessionData.banner_image_url || null,
            ticket_url: sessionData.url || null,
            ticket_popup_url: sessionData.url_tickets_popup || null,
            status: sessionData.published ? 'open' : 'draft',
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
      const eventName = sessionData.session_name || sessionData.event_name;
      const eventData = {
        title: eventName,
        name: eventName,
        event_date: sessionData.session_start,
        venue: sessionData.venue_name || null,
        address: sessionData.venue_name || null,
        description: sessionData.description || null,
        banner_url: sessionData.banner_image_url || null,
        hero_image_url: sessionData.banner_image_url || null,
        ticket_url: sessionData.url || null,
        ticket_popup_url: sessionData.url_tickets_popup || null,
        source: source,
        source_id: sourceId,
        status: sessionData.published ? 'open' : 'draft',
        promoter_id: user.id, // Required by RLS policy
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

      if (createError) {
        // Provide clearer error message for RLS permission errors
        if (createError.code === '42501' || createError.message?.includes('row-level security')) {
          throw new Error(
            'Permission denied: You do not have permission to create events for this organization. ' +
            'Please contact an organization admin to add you as a member or admin.'
          );
        }
        throw createError;
      }

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
    // Extract error message from various error formats (Error, Supabase error, etc.)
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null
        ? (error as { message?: string; error_description?: string; details?: string }).message
          || (error as { message?: string; error_description?: string; details?: string }).error_description
          || (error as { message?: string; error_description?: string; details?: string }).details
          || JSON.stringify(error)
        : String(error);

    // Log full error for debugging
    console.error('EventNavigator error:', error);

    return (
      <div className="container mx-auto py-16">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load event: {errorMessage}
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
