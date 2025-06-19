
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  status: 'confirmed' | 'pending' | 'conflict';
  conflictsWith?: string;
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Comedy Night at The Laugh Track',
    date: '2024-12-20',
    time: '8:00 PM',
    venue: 'The Laugh Track',
    status: 'confirmed'
  },
  {
    id: '2',
    title: 'Open Mic Night',
    date: '2024-12-22',
    time: '7:30 PM',
    venue: 'Comedy Central',
    status: 'conflict',
    conflictsWith: 'Dinner with friends'
  }
];

export const CalendarSync: React.FC = () => {
  const { toast } = useToast();
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [isAppleCalendarConnected, setIsAppleCalendarConnected] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [conflictAlerts, setConflictAlerts] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);

  const handleConnectGoogleCalendar = () => {
    // This would typically open OAuth flow
    setIsGoogleCalendarConnected(true);
    toast({
      title: "Google Calendar Connected",
      description: "Your Google Calendar has been successfully connected.",
    });
  };

  const handleConnectAppleCalendar = () => {
    // This would typically handle Apple Calendar integration
    setIsAppleCalendarConnected(true);
    toast({
      title: "Apple Calendar Connected",
      description: "Your Apple Calendar has been successfully connected.",
    });
  };

  const handleSyncNow = () => {
    toast({
      title: "Calendar Sync",
      description: "Syncing your confirmed events with your calendar...",
    });
    // Simulate sync process
    setTimeout(() => {
      toast({
        title: "Sync Complete",
        description: "All confirmed events have been added to your calendar.",
      });
    }, 2000);
  };

  const handleResolveConflict = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, status: 'confirmed', conflictsWith: undefined }
        : event
    ));
    toast({
      title: "Conflict Resolved",
      description: "The event has been confirmed and added to your calendar.",
    });
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
                  disabled={isGoogleCalendarConnected}
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
                  disabled={isAppleCalendarConnected}
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
              disabled={!isGoogleCalendarConnected && !isAppleCalendarConnected}
            >
              Sync Now
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
          {events.map((event) => (
            <div key={event.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">{event.venue}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span>{event.date}</span>
                    <span>{event.time}</span>
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
              
              {event.status === 'conflict' && event.conflictsWith && (
                <Alert className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This event conflicts with: <strong>{event.conflictsWith}</strong>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleResolveConflict(event.id)}
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
