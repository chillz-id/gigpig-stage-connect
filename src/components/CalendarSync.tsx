
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  venue: string;
  status: 'confirmed' | 'pending' | 'conflict';
  calendar_sync_status?: string;
}
interface CalendarIntegration {
  id: string;
  provider: string;
  is_active: boolean;
  settings?: any;
}
export const CalendarSync: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoSync, setAutoSync] = useState(true);
  const [conflictAlerts, setConflictAlerts] = useState(true);
  // Fetch calendar integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ['calendar-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      if (error) throw error;
      return data as CalendarIntegration[];
    }
  });
  // Fetch calendar events
  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('comedian_id', (await supabase.auth.getUser()).data.user?.id)
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data as CalendarEvent[];
    }
  });
  const connectCalendarMutation = useMutation({
    mutationFn: async ({ provider }: { provider: string }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('calendar_integrations')
        .insert({
          user_id: user.data.user.id,
          provider,
          is_active: true
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations'] });
      toast({
        title: `${data.provider === 'google' ? 'Google' : 'Apple'} Calendar Connected`,
        description: "Your calendar has been successfully connected.",
      });
    }
  });
  const syncEventsMutation = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would sync with external calendar APIs
      // For now, we'll just update the sync status
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('calendar_events')
        .update({ calendar_sync_status: 'synced' })
        .eq('comedian_id', user.data.user.id)
        .eq('status', 'confirmed');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({
        title: "Sync Complete",
        description: "All confirmed events have been added to your calendar.",
      });
    }
  });
  const resolveConflictMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .update({ status: 'confirmed' })
        .eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({
        title: "Conflict Resolved",
        description: "The event has been confirmed and added to your calendar.",
      });
    }
  });
  const isGoogleCalendarConnected = integrations.some(i => i.provider === 'google' && i.is_active);
  const isAppleCalendarConnected = integrations.some(i => i.provider === 'apple' && i.is_active);
  const handleConnectGoogleCalendar = () => {
    connectCalendarMutation.mutate({ provider: 'google' });
  };
  const handleConnectAppleCalendar = () => {
    connectCalendarMutation.mutate({ provider: 'apple' });
  };
  const handleSyncNow = () => {
    toast({
      title: "Calendar Sync",
      description: "Syncing your confirmed events with your calendar...",
    });
    setTimeout(() => {
      syncEventsMutation.mutate();
    }, 2000);
  };
  const handleResolveConflict = (eventId: string) => {
    resolveConflictMutation.mutate(eventId);
  };
  return (
    <div className="space-y-6">
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendar Sync
          </CardTitle>
          <CardDescription>
            Automatically sync your confirmed comedy events with your personal calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calendar Connections */}
          <div className="space-y-4">
            <h3 className="font-semibold">Connect Your Calendar</h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-sm text-muted-foreground">
                      {isGoogleCalendarConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <Button
                  variant={isGoogleCalendarConnected ? "secondary" : "default"}
                  onClick={handleConnectGoogleCalendar}
                  disabled={isGoogleCalendarConnected || connectCalendarMutation.isPending}
                >
                  {isGoogleCalendarConnected ? 'Connected' : 'Connect'}
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Apple Calendar</p>
                    <p className="text-sm text-muted-foreground">
                      {isAppleCalendarConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <Button
                  variant={isAppleCalendarConnected ? "secondary" : "default"}
                  onClick={handleConnectAppleCalendar}
                  disabled={isAppleCalendarConnected || connectCalendarMutation.isPending}
                >
                  {isAppleCalendarConnected ? 'Connected' : 'Connect'}
                </Button>
              </div>
            </div>
          </div>
          {/* Sync Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Sync Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-sync confirmed events</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically add confirmed comedy events to your calendar
                  </p>
                </div>
                <Switch
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Conflict alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when confirmed events conflict with existing calendar entries
                  </p>
                </div>
                <Switch
                  checked={conflictAlerts}
                  onCheckedChange={setConflictAlerts}
                />
              </div>
            </div>
          </div>
          {/* Manual Sync */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Manual Sync</p>
              <p className="text-sm text-muted-foreground">
                Sync your events manually if needed
              </p>
            </div>
            <Button 
              onClick={handleSyncNow}
              disabled={(!isGoogleCalendarConnected && !isAppleCalendarConnected) || syncEventsMutation.isPending}
            >
              {syncEventsMutation.isPending ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Upcoming Events */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Upcoming Events
          </CardTitle>
          <CardDescription>
            Your confirmed comedy events and any conflicts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
              <p className="text-muted-foreground">
                Your confirmed events will appear here when you have them
              </p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.venue}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      <span>{new Date(event.event_date).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.status === 'confirmed' && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Confirmed
                      </Badge>
                    )}
                    {event.status === 'conflict' && (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Conflict
                      </Badge>
                    )}
                  </div>
                </div>
                {event.status === 'conflict' && (
                  <Alert className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This event has a scheduling conflict
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleResolveConflict(event.id)}
                          disabled={resolveConflictMutation.isPending}
                        >
                          Resolve Conflict
                        </Button>
                        <Button size="sm" variant="outline">
                          View Calendar
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};