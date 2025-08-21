import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface CalendarIntegration {
  id: string;
  user_id: string;
  provider: 'google' | 'apple' | 'outlook';
  access_token?: string;
  refresh_token?: string;
  calendar_id?: string;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
}

export const useCalendarIntegration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's calendar integrations
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['calendar-integrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CalendarIntegration[];
    },
    enabled: !!user?.id
  });

  // Google Calendar OAuth setup
  const initiateGoogleCalendarAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast({
        title: "Configuration Error",
        description: "Google Calendar integration is not configured.",
        variant: "destructive"
      });
      return;
    }

    const scope = 'https://www.googleapis.com/auth/calendar';
    const redirectUri = `${window.location.origin}/auth/google-calendar-callback`;
    const state = btoa(JSON.stringify({ user_id: user?.id, provider: 'google' }));
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;

    window.location.href = authUrl;
  };

  // Handle OAuth callback
  const handleGoogleCalendarCallback = useMutation({
    mutationFn: async ({ code, state }: { code: string; state: string }) => {
      const stateData = JSON.parse(atob(state));
      if (stateData.user_id !== user?.id) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for tokens (this would typically be done in a secure backend)
      const response = await fetch('/api/google-calendar/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, user_id: user?.id })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange token');
      }

      const { access_token, refresh_token, calendar_id } = await response.json();

      // Store integration in database
      const { data, error } = await supabase
        .from('calendar_integrations')
        .upsert({
          user_id: user?.id,
          provider: 'google',
          access_token,
          refresh_token,
          calendar_id,
          is_active: true,
          settings: {},
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations', user?.id] });
      toast({
        title: "Google Calendar Connected",
        description: "Your Google Calendar has been successfully connected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect Google Calendar",
        variant: "destructive"
      });
    }
  });

  // Disconnect calendar integration
  const disconnectCalendar = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('calendar_integrations')
        .delete()
        .eq('id', integrationId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations', user?.id] });
      toast({
        title: "Calendar Disconnected",
        description: "Calendar integration has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect calendar",
        variant: "destructive"
      });
    }
  });

  // Sync specific event to calendar
  const syncEventToCalendar = useMutation({
    mutationFn: async ({ 
      eventData, 
      integrationId 
    }: { 
      eventData: CalendarEvent; 
      integrationId: string;
    }) => {
      const integration = integrations?.find(i => i.id === integrationId);
      if (!integration) {
        throw new Error('Calendar integration not found');
      }

      if (integration.provider === 'google') {
        // Sync to Google Calendar
        const response = await fetch('/api/google-calendar/create-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: integration.access_token,
            calendar_id: integration.calendar_id,
            event: eventData
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create calendar event');
        }

        return await response.json();
      }

      throw new Error('Unsupported calendar provider');
    },
    onSuccess: () => {
      toast({
        title: "Event Synced",
        description: "Event has been added to your calendar.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync event to calendar",
        variant: "destructive"
      });
    }
  });

  // Generate .ics file for Apple Calendar/Outlook
  const generateICSFile = (events: CalendarEvent[]): string => {
    const icsEvents = events.map(event => {
      const startDate = new Date(event.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(event.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const uid = `${event.id}@standupSydney.com`;
      
      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${event.title}`,
        event.description ? `DESCRIPTION:${event.description}` : '',
        event.location ? `LOCATION:${event.location}` : '',
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].filter(Boolean).join('\r\n');
    }).join('\r\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Stand Up Sydney//Comedy Booking Platform//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      icsEvents,
      'END:VCALENDAR'
    ].join('\r\n');
  };

  // Download .ics file
  const downloadICSFile = (events: CalendarEvent[], filename = 'comedy-gigs.ics') => {
    const icsContent = generateICSFile(events);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Calendar File Downloaded",
      description: "Import the downloaded file into Apple Calendar or Outlook.",
    });
  };

  // Get active integrations by provider
  const getActiveIntegration = (provider: 'google' | 'apple' | 'outlook') => {
    return integrations?.find(i => i.provider === provider && i.is_active);
  };

  const isGoogleConnected = !!getActiveIntegration('google');
  const hasAnyIntegration = integrations && integrations.length > 0;

  return {
    integrations: integrations || [],
    isLoading,
    isGoogleConnected,
    hasAnyIntegration,
    initiateGoogleCalendarAuth,
    handleGoogleCalendarCallback: handleGoogleCalendarCallback.mutate,
    disconnectCalendar: disconnectCalendar.mutate,
    syncEventToCalendar: syncEventToCalendar.mutate,
    downloadICSFile,
    generateICSFile,
    getActiveIntegration,
    isConnecting: handleGoogleCalendarCallback.isPending,
    isDisconnecting: disconnectCalendar.isPending,
    isSyncing: syncEventToCalendar.isPending
  };
};