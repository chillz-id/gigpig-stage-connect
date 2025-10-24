import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Users, CalendarDays, Clock, Download } from 'lucide-react';
import { useUpcomingEvents, type UpcomingEvent } from '@/hooks/useUpcomingEvents';
import { useAvailabilityByEvent } from '@/hooks/useEventAvailabilityList';

export function EventAvailabilityView() {
  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: events, isLoading: eventsLoading } = useUpcomingEvents({ limit: 150 });
  const { data: availabilityMap, isLoading: availabilityLoading } = useAvailabilityByEvent();

  const getEventKey = (event: UpcomingEvent) =>
    `${event.canonical_source}:${event.canonical_session_source_id}`;

  const getAvailableCount = (event: UpcomingEvent) => {
    const key = getEventKey(event);
    return availabilityMap?.[key]?.length || 0;
  };

  const handleEventClick = (event: UpcomingEvent) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const exportToCSV = () => {
    if (!selectedEvent || !availabilityMap) return;

    const key = getEventKey(selectedEvent);
    const submissions = availabilityMap[key] || [];

    const csvHeaders = ['First Name', 'Last Name', 'Email', 'Submitted At'];
    const csvRows = submissions.map(sub => [
      sub.first_name,
      sub.last_name,
      sub.email,
      format(new Date(sub.submitted_at), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `availability-${selectedEvent.session_name || 'event'}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedEventSubmissions = selectedEvent
    ? availabilityMap?.[getEventKey(selectedEvent)] || []
    : [];

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Event Availability</CardTitle>
          <CardDescription>
            View which comedians are available for each event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading || availabilityLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !events || events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No upcoming events found
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {events.map(event => {
                  const availableCount = getAvailableCount(event);
                  const date = event.session_start_local || event.session_start;

                  return (
                    <button
                      key={getEventKey(event)}
                      onClick={() => handleEventClick(event)}
                      className="w-full text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold leading-none">
                            {event.session_name || event.event_name || 'Unnamed Event'}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {date && (
                              <>
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {format(new Date(date), 'EEE, MMM d, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(date), 'h:mm a')}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={availableCount > 0 ? 'default' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          <Users className="h-3 w-3" />
                          {availableCount} available
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Submissions Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.session_name || selectedEvent?.event_name || 'Event'} - Available Comedians
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.session_start_local &&
                format(new Date(selectedEvent.session_start_local), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedEventSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No availability submissions yet for this event
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {selectedEventSubmissions.length} comedian{selectedEventSubmissions.length !== 1 ? 's' : ''} available
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>

                <ScrollArea className="h-[400px] border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEventSubmissions.map(submission => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">
                            {submission.first_name} {submission.last_name}
                          </TableCell>
                          <TableCell>{submission.email}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {format(new Date(submission.submitted_at), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
