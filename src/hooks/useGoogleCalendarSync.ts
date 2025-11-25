import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { googleCalendarService, GoogleCalendarEvent } from '@/services/calendar/googleCalendarService';
import { calendarIntegrationService, CalendarIntegration } from '@/services/calendar/calendar-integration-service';
import { usePersonalGigs, CreatePersonalGigData } from './usePersonalGigs';

export interface SyncStatus {
  isConnected: boolean;
  lastSync?: Date;
  isSyncing: boolean;
  error?: string;
}

/**
 * useGoogleCalendarSync Hook
 *
 * Provides two-way sync with Google Calendar:
 * - Check connection status
 * - Initiate OAuth flow
 * - Import events from Google Calendar to personal_gigs
 * - Export personal_gigs to Google Calendar
 * - Automatic sync on connection
 * - Disconnect and revoke access
 *
 * Usage:
 * const {
 *   syncStatus,
 *   connectGoogleCalendar,
 *   importFromGoogle,
 *   exportToGoogle,
 *   disconnect
 * } = useGoogleCalendarSync();
 */
export const useGoogleCalendarSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createPersonalGig } = usePersonalGigs();
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch Google Calendar integration status
  const {
    data: integration,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useQuery({
    queryKey: ['google-calendar-integration', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await calendarIntegrationService.getByUserAndProvider(user.id, 'google');
    },
    enabled: !!user?.id,
  });

  // Sync status
  const syncStatus: SyncStatus = {
    isConnected: !!integration?.is_active,
    lastSync: integration?.updated_at ? new Date(integration.updated_at) : undefined,
    isSyncing,
    error: statusError?.message,
  };

  /**
   * Initiate OAuth flow to connect Google Calendar
   */
  const connectGoogleCalendar = () => {
    try {
      googleCalendarService.initiateOAuthFlow();
    } catch (error) {
      console.error('Error initiating Google Calendar OAuth:', error);
      toast({
        title: 'Connection failed',
        description: 'Failed to start Google Calendar connection',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle OAuth callback - exchange code for tokens
   */
  const handleOAuthCallback = useMutation({
    mutationFn: async (code: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Exchange code for tokens
      const tokens = await googleCalendarService.exchangeCodeForTokens(code);

      // Save integration
      await calendarIntegrationService.upsertIntegration({
        user_id: user.id,
        provider: 'google',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        is_active: true,
        settings: {
          expires_at: Date.now() + tokens.expiresIn * 1000,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-integration'] });
      toast({
        title: 'Connected!',
        description: 'Google Calendar has been connected successfully',
      });
    },
    onError: (error: Error) => {
      console.error('OAuth callback error:', error);
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to connect Google Calendar',
        variant: 'destructive',
      });
    },
  });

  /**
   * Import events from Google Calendar
   */
  const importFromGoogle = async (options?: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }): Promise<number> => {
    if (!user?.id) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to import events',
        variant: 'destructive',
      });
      return 0;
    }

    if (!integration?.is_active) {
      toast({
        title: 'Not connected',
        description: 'Please connect Google Calendar first',
        variant: 'destructive',
      });
      return 0;
    }

    setIsSyncing(true);
    let importedCount = 0;

    try {
      // Fetch events from Google Calendar
      const response = await googleCalendarService.listEvents(user.id, options);

      // Import each event as a personal gig
      for (const event of response.items) {
        if (!event.start.dateTime && !event.start.date) continue;

        const startDate = event.start.dateTime
          ? new Date(event.start.dateTime)
          : new Date(event.start.date!);

        const endTime = event.end?.dateTime || undefined;

        await createPersonalGig({
          title: event.summary,
          venue: event.location,
          date: startDate,
          endTime,
          notes: event.description,
          source: 'google_import',
          googleEventId: event.id,
        });

        importedCount++;
      }

      // Update last sync time
      if (integration.id) {
        await calendarIntegrationService.updateById(integration.id, {
          settings: {
            ...integration.settings,
            last_import: new Date().toISOString(),
          },
        });
      }

      queryClient.invalidateQueries({ queryKey: ['google-calendar-integration'] });
      queryClient.invalidateQueries({ queryKey: ['personal-gigs'] });

      toast({
        title: 'Import complete',
        description: `Imported ${importedCount} event${importedCount !== 1 ? 's' : ''} from Google Calendar`,
      });

      return importedCount;
    } catch (error) {
      console.error('Error importing from Google Calendar:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import events',
        variant: 'destructive',
      });
      return 0;
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Export personal gig to Google Calendar
   */
  const exportToGoogle = async (gig: {
    title: string;
    venue?: string;
    date: Date;
    endTime?: string;
    notes?: string;
  }): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to export events',
        variant: 'destructive',
      });
      return false;
    }

    if (!integration?.is_active) {
      toast({
        title: 'Not connected',
        description: 'Please connect Google Calendar first',
        variant: 'destructive',
      });
      return false;
    }

    setIsSyncing(true);

    try {
      await googleCalendarService.createEvent(user.id, {
        summary: gig.title,
        description: gig.notes,
        location: gig.venue,
        start: gig.date.toISOString(),
        end: gig.endTime || gig.date.toISOString(),
      });

      // Update last sync time
      if (integration.id) {
        await calendarIntegrationService.updateById(integration.id, {
          settings: {
            ...integration.settings,
            last_export: new Date().toISOString(),
          },
        });
      }

      queryClient.invalidateQueries({ queryKey: ['google-calendar-integration'] });

      toast({
        title: 'Export complete',
        description: 'Event has been added to Google Calendar',
      });

      return true;
    } catch (error) {
      console.error('Error exporting to Google Calendar:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export event',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Disconnect Google Calendar
   */
  const disconnect = useMutation({
    mutationFn: async () => {
      if (!integration?.id) throw new Error('No integration found');
      await calendarIntegrationService.deleteById(integration.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-integration'] });
      toast({
        title: 'Disconnected',
        description: 'Google Calendar has been disconnected',
      });
    },
    onError: (error: Error) => {
      console.error('Error disconnecting Google Calendar:', error);
      toast({
        title: 'Disconnect failed',
        description: error.message || 'Failed to disconnect Google Calendar',
        variant: 'destructive',
      });
    },
  });

  return {
    syncStatus,
    isLoadingStatus,
    connectGoogleCalendar,
    handleOAuthCallback: handleOAuthCallback.mutate,
    importFromGoogle,
    exportToGoogle,
    disconnect: disconnect.mutate,
    isDisconnecting: disconnect.isPending,
  };
};
