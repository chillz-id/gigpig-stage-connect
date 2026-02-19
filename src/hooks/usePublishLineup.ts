/**
 * usePublishLineup Hook
 *
 * Manages lineup publishing and notification state.
 * - Publishes lineup to notify assigned comedians/staff
 * - Tracks unpublished changes
 * - Only notifies new or changed assignments on republish
 * - Auto-confirms spots for comedians with auto_confirm_spots enabled
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calendarIntegrationService } from '@/services/calendar/calendar-integration-service';
import { googleCalendarService } from '@/services/calendar/googleCalendarService';

interface PublishResult {
  notifications_sent: number;
  event_title: string;
}

interface LineupPublishStatus {
  lineupPublishedAt: string | null;
  hasUnpublishedChanges: boolean;
  pendingNotifications: number;
}

/**
 * Get the publish status for an event's lineup
 */
export function useLineupPublishStatus(eventId: string) {
  return useQuery({
    queryKey: ['lineup-publish-status', eventId],
    queryFn: async (): Promise<LineupPublishStatus> => {
      // Get event's lineup_published_at
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('lineup_published_at')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Check for unpublished changes
      const { data: hasChanges, error: changesError } = await supabase
        .rpc('has_unpublished_lineup_changes', { p_event_id: eventId });

      if (changesError) throw changesError;

      // Get count of pending notifications
      const { data: pendingCount, error: pendingError } = await supabase
        .rpc('get_pending_lineup_notifications', { p_event_id: eventId });

      if (pendingError) throw pendingError;

      return {
        lineupPublishedAt: event?.lineup_published_at || null,
        hasUnpublishedChanges: hasChanges ?? false,
        pendingNotifications: pendingCount ?? 0,
      };
    },
    enabled: !!eventId,
    // Refetch when spots change
    staleTime: 10 * 1000, // 10 seconds
  });
}

interface ExtendedPublishResult extends PublishResult {
  auto_confirmed_count: number;
}

/**
 * Publish the lineup and send notifications
 * Also auto-confirms spots for comedians with auto_confirm_spots enabled
 */
export function usePublishLineup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string): Promise<ExtendedPublishResult> => {
      // First, publish the lineup (sends notifications)
      const { data, error } = await supabase
        .rpc('publish_lineup', { p_event_id: eventId });

      if (error) throw error;

      // RPC returns an array with one row
      const result = Array.isArray(data) ? data[0] : data;
      const publishResult = result as PublishResult;

      // Now handle auto-confirm for comedians who have it enabled
      let autoConfirmedCount = 0;

      try {
        // Get all pending spots for this event with comedian info
        const { data: pendingSpots, error: spotsError } = await supabase
          .from('event_spots')
          .select(`
            id,
            comedian_id,
            event_id,
            confirmation_status
          `)
          .eq('event_id', eventId)
          .not('comedian_id', 'is', null)
          .or('confirmation_status.is.null,confirmation_status.eq.pending');

        if (spotsError) {
          console.error('[usePublishLineup] Error fetching pending spots:', spotsError);
        } else if (pendingSpots && pendingSpots.length > 0) {
          // Get comedian IDs to check their settings
          const comedianIds = [...new Set(pendingSpots.map(s => s.comedian_id).filter(Boolean))];

          // Fetch comedian metadata for auto_confirm_spots setting
          const { data: comedianData, error: comedianError } = await supabase
            .from('comedians')
            .select('id, metadata')
            .in('id', comedianIds);

          if (comedianError) {
            console.error('[usePublishLineup] Error fetching comedian settings:', comedianError);
          } else if (comedianData) {
            // Build a map of comedian IDs with auto_confirm enabled
            const autoConfirmComedians = new Set(
              comedianData
                .filter(c => {
                  const metadata = c.metadata as Record<string, unknown> | null;
                  return metadata?.auto_confirm_spots === true;
                })
                .map(c => c.id)
            );

            // Get event details for calendar sync
            const { data: eventData } = await supabase
              .from('events')
              .select('title, event_date, start_time, end_time, venue, address')
              .eq('id', eventId)
              .single();

            // Auto-confirm spots for comedians with the setting enabled
            for (const spot of pendingSpots) {
              if (spot.comedian_id && autoConfirmComedians.has(spot.comedian_id)) {
                const now = new Date().toISOString();

                // Update spot to confirmed
                const { error: confirmError } = await supabase
                  .from('event_spots')
                  .update({
                    confirmation_status: 'confirmed',
                    confirmed_at: now,
                    updated_at: now,
                  })
                  .eq('id', spot.id);

                if (confirmError) {
                  console.error(`[usePublishLineup] Error auto-confirming spot ${spot.id}:`, confirmError);
                } else {
                  autoConfirmedCount++;

                  // Add to Google Calendar if connected
                  try {
                    const googleIntegration = await calendarIntegrationService.getByUserAndProvider(
                      spot.comedian_id,
                      'google'
                    );

                    if (googleIntegration?.is_active && eventData) {
                      const eventDateTime = new Date(eventData.event_date);
                      if (eventData.start_time) {
                        const [hours, minutes] = eventData.start_time.split(':').map(Number);
                        eventDateTime.setHours(hours || 0, minutes || 0, 0, 0);
                      }

                      let endDateTime: string | undefined;
                      if (eventData.end_time) {
                        const endDate = new Date(eventData.event_date);
                        const [endHours, endMinutes] = eventData.end_time.split(':').map(Number);
                        endDate.setHours(endHours || 0, endMinutes || 0, 0, 0);
                        endDateTime = endDate.toISOString();
                      }

                      await googleCalendarService.createEvent(spot.comedian_id, {
                        summary: `🎤 ${eventData.title}`,
                        description: `Auto-confirmed gig via GigPigs`,
                        location: [eventData.venue, eventData.address].filter(Boolean).join(', '),
                        start: eventDateTime.toISOString(),
                        end: endDateTime,
                      });

                      console.log(`[usePublishLineup] Added auto-confirmed gig to calendar for comedian ${spot.comedian_id}`);
                    }
                  } catch (calendarError) {
                    console.error(`[usePublishLineup] Calendar sync failed for comedian ${spot.comedian_id}:`, calendarError);
                  }
                }
              }
            }
          }
        }
      } catch (autoConfirmError) {
        console.error('[usePublishLineup] Auto-confirm process failed:', autoConfirmError);
        // Don't throw - the publish succeeded, auto-confirm is a bonus
      }

      return {
        ...publishResult,
        auto_confirmed_count: autoConfirmedCount,
      };
    },
    onSuccess: (result, eventId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['lineup-publish-status', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });

      // Show success toast with auto-confirm info
      const notificationMsg = result.notifications_sent > 0
        ? `${result.notifications_sent} notification${result.notifications_sent === 1 ? '' : 's'} sent`
        : 'No new notifications needed';

      const autoConfirmMsg = result.auto_confirmed_count > 0
        ? `, ${result.auto_confirmed_count} auto-confirmed`
        : '';

      toast({
        title: 'Lineup Published',
        description: `${notificationMsg}${autoConfirmMsg}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Publish Failed',
        description: error.message || 'Failed to publish lineup',
      });
    },
  });
}

export default usePublishLineup;
