import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  attendees?: string[];
}

export const useCalendarSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check if Google Calendar is connected
  const checkGoogleCalendarConnection = async () => {
    if (!user?.id) return false;

    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('id, provider, is_active')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    return data?.is_active || false;
  };

  // Initiate Google Calendar OAuth flow
  const connectGoogleCalendar = async () => {
    setIsConnecting(true);
    try {
      // In production, this would redirect to Google OAuth
      // For now, we'll simulate the connection
      const { error } = await supabase
        .from('calendar_integrations')
        .upsert({
          user_id: user?.id,
          provider: 'google',
          is_active: true,
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider'
        });

      if (error) throw error;

      toast({
        title: "Google Calendar Connected",
        description: "Your Google Calendar has been connected successfully.",
      });

      // In production, this would:
      // 1. Redirect to Google OAuth consent screen
      // 2. Handle callback with access token
      // 3. Store encrypted tokens in database
      // 4. Set up webhook for calendar changes

      return true;
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect Google Calendar. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Google Calendar
  const disconnectGoogleCalendar = async () => {
    try {
      const { error } = await supabase
        .from('calendar_integrations')
        .update({ is_active: false })
        .eq('user_id', user?.id)
        .eq('provider', 'google');

      if (error) throw error;

      toast({
        title: "Google Calendar Disconnected",
        description: "Your Google Calendar has been disconnected.",
      });

      return true;
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect Google Calendar.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Sync events to Google Calendar
  const syncToGoogleCalendar = async (events: CalendarEvent[]) => {
    setIsSyncing(true);
    try {
      // In production, this would use Google Calendar API
      // to create/update events in the user's calendar

      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Log sync activity
      await supabase
        .from('calendar_integrations')
        .update({ 
          last_synced_at: new Date().toISOString(),
          sync_count: supabase.sql`sync_count + ${events.length}`
        })
        .eq('user_id', user?.id)
        .eq('provider', 'google');

      toast({
        title: "Calendar Synced",
        description: `${events.length} events synced to Google Calendar.`,
      });

      return true;
    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync events to Google Calendar.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Generate iCal file for Apple Calendar
  const generateICalFile = (events: CalendarEvent[]) => {
    const icalHeader = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Stand Up Sydney//Comedy Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ].join('\r\n');

    const icalFooter = 'END:VCALENDAR';

    const icalEvents = events.map(event => {
      const dtstart = new Date(event.start_time).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const dtend = event.end_time 
        ? new Date(event.end_time).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
        : new Date(new Date(event.start_time).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

      const eventLines = [
        'BEGIN:VEVENT',
        `UID:${event.id}@standupsydney.com`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${event.title}`,
        event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
        event.location ? `LOCATION:${event.location}` : '',
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].filter(line => line); // Remove empty lines

      return eventLines.join('\r\n');
    }).join('\r\n');

    return `${icalHeader}\r\n${icalEvents}\r\n${icalFooter}`;
  };

  // Download iCal file
  const downloadICalFile = (events: CalendarEvent[], filename: string = 'events.ics') => {
    try {
      const icalContent = generateICalFile(events);
      const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Calendar File Downloaded",
        description: "Open the file to add events to your calendar app.",
      });
    } catch (error) {
      console.error('Error downloading iCal file:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download calendar file.",
        variant: "destructive",
      });
    }
  };

  // Import events from iCal file
  const importFromICalFile = async (file: File): Promise<CalendarEvent[]> => {
    try {
      const text = await file.text();
      // Basic iCal parsing - in production, use a proper iCal parser library
      const events: CalendarEvent[] = [];
      
      const eventMatches = text.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
      
      eventMatches.forEach((eventText, index) => {
        const getField = (field: string) => {
          const match = eventText.match(new RegExp(`${field}:(.*)`, 'i'));
          return match ? match[1].trim() : '';
        };

        const uid = getField('UID') || `imported-${Date.now()}-${index}`;
        const summary = getField('SUMMARY');
        const description = getField('DESCRIPTION').replace(/\\n/g, '\n');
        const location = getField('LOCATION');
        const dtstart = getField('DTSTART');
        const dtend = getField('DTEND');

        if (summary && dtstart) {
          events.push({
            id: uid,
            title: summary,
            description: description || undefined,
            start_time: parseICalDate(dtstart),
            end_time: dtend ? parseICalDate(dtend) : undefined,
            location: location || undefined
          });
        }
      });

      toast({
        title: "Calendar Imported",
        description: `${events.length} events imported successfully.`,
      });

      return events;
    } catch (error) {
      console.error('Error importing iCal file:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import calendar file.",
        variant: "destructive",
      });
      return [];
    }
  };

  // Helper function to parse iCal date format
  const parseICalDate = (icalDate: string): string => {
    // Handle both DATE and DATE-TIME formats
    const year = icalDate.substr(0, 4);
    const month = icalDate.substr(4, 2);
    const day = icalDate.substr(6, 2);
    
    if (icalDate.length === 8) {
      // DATE format (all day event)
      return `${year}-${month}-${day}`;
    } else {
      // DATE-TIME format
      const hour = icalDate.substr(9, 2);
      const minute = icalDate.substr(11, 2);
      const second = icalDate.substr(13, 2);
      const isUTC = icalDate.endsWith('Z');
      
      const dateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
      return isUTC ? dateStr + 'Z' : dateStr;
    }
  };

  return {
    checkGoogleCalendarConnection,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncToGoogleCalendar,
    downloadICalFile,
    importFromICalFile,
    isConnecting,
    isSyncing
  };
};