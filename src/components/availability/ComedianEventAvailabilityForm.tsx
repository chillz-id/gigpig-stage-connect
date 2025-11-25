import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarDays, Clock } from 'lucide-react';
import { useUpcomingEvents, type UpcomingEvent } from '@/hooks/useUpcomingEvents';
import { useEventAvailabilitySubmission } from '@/hooks/useEventAvailabilitySubmission';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
});

type FormData = z.infer<typeof formSchema>;

export function ComedianEventAvailabilityForm() {
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  const { data: events, isLoading: eventsLoading } = useUpcomingEvents({ limit: 150 });
  const { submitBulk, isSubmitting } = useEventAvailabilitySubmission();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const getEventKey = (event: UpcomingEvent) =>
    `${event.canonical_source}:${event.canonical_session_source_id}`;

  const toggleEvent = (event: UpcomingEvent) => {
    const key = getEventKey(event);
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (!events) return;
    setSelectedEvents(new Set(events.map(getEventKey)));
  };

  const selectByDay = (dayOfWeek: number) => {
    if (!events) return;
    const filtered = events.filter(event => {
      if (!event.session_start) return false;
      // Extract date portion to avoid timezone parsing issues
      const datePart = event.session_start.split('T')[0];
      return getDay(new Date(`${datePart}T12:00:00`)) === dayOfWeek;
    });
    setSelectedEvents(new Set(filtered.map(getEventKey)));
  };

  const clearSelection = () => {
    setSelectedEvents(new Set());
  };

  const onSubmit = (formData: FormData) => {
    if (!events || selectedEvents.size === 0) {
      return;
    }

    const submissions = events
      .filter(event => selectedEvents.has(getEventKey(event)))
      .map(event => ({
        canonical_source: event.canonical_source,
        canonical_session_source_id: event.canonical_session_source_id,
        is_available: true,
      }));

    submitBulk({
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      submissions,
    }, {
      onSuccess: () => {
        resetForm();
        clearSelection();
      },
    });
  };

  // Group events by week
  const groupedEvents = events?.reduce((acc, event) => {
    if (!event.session_start) return acc;
    const date = new Date(event.session_start);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(event);
    return acc;
  }, {} as Record<string, UpcomingEvent[]>);

  const weeks = groupedEvents ? Object.keys(groupedEvents).sort() : [];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Comedian Availability Submission</CardTitle>
        <CardDescription>
          Select the events you're available for and submit your information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="John"
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Doe"
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Bulk Selection Buttons */}
          <div>
            <Label className="mb-2 block">Quick Selection</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="professional-button"
                size="sm"
                onClick={selectAll}
                disabled={eventsLoading || isSubmitting}
              >
                All Shows
              </Button>
              <Button
                type="button"
                className="professional-button"
                size="sm"
                onClick={() => selectByDay(1)}
                disabled={eventsLoading || isSubmitting}
              >
                All Mondays
              </Button>
              <Button
                type="button"
                className="professional-button"
                size="sm"
                onClick={() => selectByDay(3)}
                disabled={eventsLoading || isSubmitting}
              >
                All Wednesdays
              </Button>
              <Button
                type="button"
                className="professional-button"
                size="sm"
                onClick={() => selectByDay(5)}
                disabled={eventsLoading || isSubmitting}
              >
                All Fridays
              </Button>
              <Button
                type="button"
                className="professional-button"
                size="sm"
                onClick={() => selectByDay(6)}
                disabled={eventsLoading || isSubmitting}
              >
                All Saturdays
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={eventsLoading || isSubmitting || selectedEvents.size === 0}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Events List */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Upcoming Events</Label>
              <Badge variant="secondary">
                {selectedEvents.size} selected
              </Badge>
            </div>

            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !events || events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming events found
              </div>
            ) : (
              <ScrollArea className="h-[400px] border rounded-md p-4">
                <div className="space-y-6">
                  {weeks.map(weekKey => {
                    const weekEvents = groupedEvents![weekKey];
                    const weekStart = new Date(weekKey);
                    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

                    return (
                      <div key={weekKey} className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground sticky top-0 bg-background py-2">
                          Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                        </h3>
                        <div className="space-y-2">
                          {weekEvents.map(event => {
                            const key = getEventKey(event);
                            const isSelected = selectedEvents.has(key);
                            const date = event.session_start_local || event.session_start;

                            return (
                              <div
                                key={key}
                                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-primary/10 border-primary'
                                    : 'hover:bg-muted/50'
                                }`}
                                onClick={() => toggleEvent(event)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleEvent(event)}
                                  disabled={isSubmitting}
                                  className="mt-1"
                                />
                                <div className="flex-1 space-y-1">
                                  <p className="font-medium leading-none">
                                    {event.session_name || event.event_name || 'Unnamed Event'}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    {date && (
                                      <>
                                        <div className="flex items-center gap-1">
                                          <CalendarDays className="h-3 w-3" />
                                          {format(new Date(date), 'EEE, MMM d')}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {format(new Date(date), 'h:mm a')}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || selectedEvents.size === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              `Submit Availability (${selectedEvents.size} events)`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
