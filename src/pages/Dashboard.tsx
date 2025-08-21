
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, DollarSign, Users, FileText, Calendar, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpcomingGigs } from '@/hooks/useUpcomingGigs';
import { EarningsCard } from '@/components/dashboard/EarningsCard';
import { useEvents } from '@/hooks/data/useEvents';
import { format } from 'date-fns';
import { ApplicationsListSection } from '@/components/comedian/ApplicationsListSection';
import { PendingConfirmationsSection } from '@/components/comedian/PendingConfirmationsSection';
import BookingRequestsSection from '@/components/comedian/BookingRequestsSection';
import BookingManagementDashboard from '@/components/promoter/BookingManagementDashboard';
import { useEventApplications } from '@/hooks/useEventApplications';

const Dashboard = () => {
  const { user, profile, hasRole } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { confirmedGigCount, nextGig, isLoading: gigsLoading } = useUpcomingGigs();
  const { userApplications, isLoadingUserApplications } = useEventApplications();
  
  // Count pending confirmations
  const pendingConfirmations = userApplications?.filter(app => 
    app.status === 'accepted' && !app.availability_confirmed
  ) || [];
  
  // Fetch promoter's events
  const { items: promoterEvents, isLoading: eventsLoading } = useEvents({ 
    my_events: true 
  });

  if (!user) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", 
        theme === 'pleasure' 
          ? 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900'
          : 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900'
      )}>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-muted-foreground mb-6">You need to be logged in to access your dashboard.</p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = hasRole('admin');
  const isPromoter = hasRole('promoter') || isAdmin;
  const isComedian = hasRole('comedian') || isAdmin;

  // Dynamic greeting based on time of day
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

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {getGreeting()}, {profile?.name || user.email?.split('@')[0]}!
              </h1>
              <p className={cn(
                "text-sm md:text-base",
                theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
              )}>
                Here's what's happening with your comedy career
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="hidden md:inline">Last login:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <EarningsCard />

          <Card className={cn(getStatCardStyles(isComedian))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isComedian ? 'Upcoming Gigs' : 'Shows This Month'}
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isComedian ? (gigsLoading ? '...' : confirmedGigCount) : '8'}
              </div>
              <p className="text-xs text-muted-foreground">
                {isComedian 
                  ? (nextGig ? `Next: ${new Date(nextGig.event_date).toLocaleDateString()}` : 'No upcoming gigs')
                  : '4 upcoming shows'
                }
              </p>
            </CardContent>
          </Card>

          <Card className={cn(getStatCardStyles(pendingConfirmations.length > 0))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Applications
                {pendingConfirmations.length > 0 && (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">
                    {pendingConfirmations.length}
                  </Badge>
                )}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingUserApplications ? '...' : (userApplications?.length || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoadingUserApplications 
                  ? 'Loading...' 
                  : pendingConfirmations.length > 0
                    ? `${pendingConfirmations.length} need confirmation`
                    : `${userApplications?.filter(app => app.status === 'pending').length || 0} pending responses`
                }
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
                Manage your comedy career efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={() => navigate('/shows')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Shows
                </Button>
                
                {/* Calendar Button for Comedians */}
                {isComedian && (
                  <Button 
                    onClick={() => navigate('/profile?tab=calendar')} 
                    className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-white border-0"
                  >
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Calendar
                    </div>
                    {!gigsLoading && confirmedGigCount > 0 && (
                      <Badge className="bg-white/20 text-white hover:bg-white/30">
                        {confirmedGigCount}
                      </Badge>
                    )}
                  </Button>
                )}
                
                {isPromoter && (
                  <Button 
                    onClick={() => navigate('/create-event')} 
                    className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white border-0"
                  >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                )}
                
                <Button 
                  onClick={() => navigate('/profile')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                
                {(isPromoter || isComedian) && (
                  <Button 
                    onClick={() => navigate('/profile?tab=invoices')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Invoices
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
                Your latest comedy show activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Accepted for Comedy Night</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Applied to Open Mic</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payment received</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Profile updated</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Promoter Events */}
        {isPromoter && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Published Events */}
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
                    promoterEvents
                      ?.filter(event => event.status === 'open' || event.status === 'closed')
                      .slice(0, 3)
                      .map(event => (
                        <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-white/5" onClick={() => navigate(`/events/${event.id}`)}>
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
                  {!eventsLoading && promoterEvents?.filter(event => event.status === 'open' || event.status === 'closed').length === 0 && (
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
                    promoterEvents
                      ?.filter(event => event.status === 'draft')
                      .slice(0, 3)
                      .map(event => (
                        <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-white/5" onClick={() => navigate(`/events/${event.id}/edit`)}>
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
                  {!eventsLoading && promoterEvents?.filter(event => event.status === 'draft').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No draft events</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Promoter's Booking Management */}
        {isPromoter && (
          <div className="mt-6">
            <BookingManagementDashboard />
          </div>
        )}

        {/* Comedian's Pending Confirmations */}
        {isComedian && (
          <div className="space-y-6">
            <BookingRequestsSection />
            <PendingConfirmationsSection />
            <ApplicationsListSection />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
