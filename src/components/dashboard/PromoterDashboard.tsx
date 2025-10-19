import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users, FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EarningsCard } from '@/components/dashboard/EarningsCard';
import { useEvents } from '@/hooks/data/useEvents';
import { format } from 'date-fns';
import BookingManagementDashboard from '@/components/promoter/BookingManagementDashboard';

/**
 * PromoterDashboard Component
 *
 * Profile-specific dashboard for promoter profiles showing:
 * - Event management and creation
 * - Application management
 * - Booking requests from comedians
 * - Revenue and business metrics
 */
export function PromoterDashboard() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Fetch promoter's events
  const { items: promoterEvents, isLoading: eventsLoading } = useEvents({
    my_events: true
  });

  const publishedEvents = promoterEvents?.filter(event =>
    event.status === 'open' || event.status === 'closed'
  ) || [];

  const draftEvents = promoterEvents?.filter(event =>
    event.status === 'draft'
  ) || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/[0.08] backdrop-blur-md border-white/[0.15] text-white';
    }
    return 'bg-gray-800/90 border-gray-600 text-gray-100';
  };

  const getStatCardStyles = (isHighlight = false) => {
    if (theme === 'pleasure') {
      return isHighlight
        ? 'bg-white/[0.12] dynamic-blur border-white/[0.20] text-white'
        : 'bg-white/[0.06] dynamic-blur border-white/[0.10] text-white';
    }
    return isHighlight
      ? 'bg-gray-700/80 dynamic-blur border-gray-500 text-gray-100'
      : 'bg-gray-800/60 dynamic-blur border-gray-600 text-gray-100';
  };

  const totalApplications = publishedEvents.reduce((sum, event) =>
    sum + (event.applications_count || 0), 0
  );

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {getGreeting()}, {profile?.name || user?.email?.split('@')[0]}!
              </h1>
              <p className={cn(
                "text-sm md:text-base",
                theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
              )}>
                Your promoter dashboard - manage events and bookings
              </p>
            </div>
            <Badge className="bg-purple-500 hover:bg-purple-600 text-white w-fit">
              Promoter Profile
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <EarningsCard />

          <Card className={cn(getStatCardStyles(true))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Events
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {eventsLoading ? '...' : publishedEvents.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {draftEvents.length} in draft
              </p>
            </CardContent>
          </Card>

          <Card className={cn(getStatCardStyles(totalApplications > 0))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Applications
                {totalApplications > 0 && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
                    {totalApplications}
                  </Badge>
                )}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {eventsLoading ? '...' : totalApplications}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {publishedEvents.length} events
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
                Manage your comedy events and talent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={() => navigate('/create-event')}
                  className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white border-0"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Create Event
                </Button>

                <Button
                  onClick={() => navigate('/shows')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  All Events
                </Button>

                <Button
                  onClick={() => navigate('/applications')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Applications
                </Button>

                <Button
                  onClick={() => navigate('/profile?tab=invoices')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Invoices
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle>Business Metrics</CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
                Your event promotion performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Events</span>
                  <span className="text-lg font-bold">{eventsLoading ? '...' : (promoterEvents?.length || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Published</span>
                  <span className="text-lg font-bold">{eventsLoading ? '...' : publishedEvents.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Drafts</span>
                  <span className="text-lg font-bold">{eventsLoading ? '...' : draftEvents.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Published Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle>Published Events</CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
                Your live events that comedians can apply to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading events...</p>
                ) : (
                  publishedEvents
                    .slice(0, 3)
                    .map(event => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-white/5"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.venue}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.event_date ? format(new Date(event.event_date), 'MMM d, yyyy • h:mm a') : 'Date TBD'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={event.status === 'open' ? "bg-green-100 text-green-800 border-green-200" : "bg-orange-100 text-orange-800 border-orange-200"}>
                            {event.status === 'open' ? 'Open' : 'Sold Out'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {event.applications_count || 0} applications
                          </span>
                        </div>
                      </div>
                    ))
                )}
                {!eventsLoading && publishedEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No published events</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Draft Events */}
          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle>Draft Events</CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
                Events you're working on
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading drafts...</p>
                ) : (
                  draftEvents
                    .slice(0, 3)
                    .map(event => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-white/5"
                        onClick={() => navigate(`/events/${event.id}/edit`)}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.venue}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.event_date ? format(new Date(event.event_date), 'MMM d, yyyy • h:mm a') : 'Date TBD'}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${event.id}/edit`);
                        }}>
                          Continue Editing
                        </Button>
                      </div>
                    ))
                )}
                {!eventsLoading && draftEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No draft events</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Management */}
        <div className="mt-6">
          <BookingManagementDashboard />
        </div>
      </div>
    </div>
  );
}
