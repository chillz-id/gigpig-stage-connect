/**
 * usePublishLineup Hook
 *
 * Manages lineup publishing and notification state.
 * - Publishes lineup to notify assigned comedians/staff
 * - Tracks unpublished changes
 * - Only notifies new or changed assignments on republish
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

/**
 * Publish the lineup and send notifications
 */
export function usePublishLineup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string): Promise<PublishResult> => {
      const { data, error } = await supabase
        .rpc('publish_lineup', { p_event_id: eventId });

      if (error) throw error;

      // RPC returns an array with one row
      const result = Array.isArray(data) ? data[0] : data;
      return result as PublishResult;
    },
    onSuccess: (result, eventId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['lineup-publish-status', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });

      // Show success toast
      if (result.notifications_sent > 0) {
        toast({
          title: 'Lineup Published',
          description: `${result.notifications_sent} notification${result.notifications_sent === 1 ? '' : 's'} sent to assigned performers.`,
        });
      } else {
        toast({
          title: 'Lineup Published',
          description: 'Lineup is now published. No new notifications needed.',
        });
      }
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
