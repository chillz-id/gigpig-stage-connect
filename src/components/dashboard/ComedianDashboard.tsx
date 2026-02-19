import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users, Calendar, Eye, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpcomingGigs } from '@/hooks/useUpcomingGigs';
import { EarningsCard } from '@/components/dashboard/EarningsCard';
import { ApplicationsListSection } from '@/components/comedian/ApplicationsListSection';
import { PendingConfirmationsSection } from '@/components/comedian/PendingConfirmationsSection';
import BookingRequestsSection from '@/components/comedian/BookingRequestsSection';
import { useEventApplications } from '@/hooks/useEventApplications';
import { useMobileLayout } from '@/hooks/useMobileLayout';

/**
 * ComedianDashboard Component
 *
 * Profile-specific dashboard for comedian profiles showing:
 * - Upcoming gigs and calendar
 * - Performance applications and their statuses
 * - Earnings and invoices
 * - Quick actions for comedy career management
 */
export function ComedianDashboard() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { isMobile } = useMobileLayout();
  const { confirmedGigCount, nextGig, totalConfirmedGigs, thisMonthGigCount, totalMinutesPerformed, thisMonthMinutes, isLoading: gigsLoading } = useUpcomingGigs();
  const { userApplications, isLoadingUserApplications } = useEventApplications();

  // Count upcoming applications only (not past events)
  const today = new Date().toISOString().split('T')[0];

  // Count pending confirmations (upcoming events only)
  const pendingConfirmations = userApplications?.filter(app => {
    const eventDate = app.event?.event_date;
    return app.status === 'accepted' && !app.availability_confirmed && eventDate && eventDate >= today;
  }) || [];
  const upcomingApplications = userApplications?.filter(app => {
    const eventDate = app.event?.event_date;
    return eventDate && eventDate >= today;
  }) || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getBackgroundStyles = () => {
    return 'bg-[#131b2b]';
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
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            <div className="flex-1">
              <h1 className={cn(
                "font-bold text-white mb-1 md:mb-2",
                isMobile ? "text-xl" : "text-2xl md:text-3xl"
              )}>
                {getGreeting()}, {profile?.name || user?.email?.split('@')[0]}!
              </h1>
              <p className={cn(
                "text-sm md:text-base",
                theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
              )}>
                {isMobile ? 'Manage your performances' : 'Your comedian dashboard - manage your performances and bookings'}
              </p>
            </div>
            <Badge className="bg-red-500 hover:bg-red-600 text-white w-fit">
              Comedian Profile
            </Badge>
          </div>
        </div>

        {/* Stats Grid - Single column on mobile */}
        <div className={cn(
          "grid gap-4 mb-6 md:gap-6 md:mb-8",
          isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          <EarningsCard />

          <Card className={cn(getStatCardStyles(true))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                Upcoming Gigs
              </CardTitle>
              <CalendarDays className={cn(isMobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className={cn("font-bold", isMobile ? "text-3xl" : "text-2xl")}>
                {gigsLoading ? '...' : confirmedGigCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {nextGig
                  ? `Next: ${new Date(nextGig.event_date).toLocaleDateString()}`
                  : 'No upcoming gigs'
                }
              </p>
            </CardContent>
          </Card>

          <Card className={cn(getStatCardStyles(pendingConfirmations.length > 0))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn("font-medium flex items-center gap-2", isMobile ? "text-sm" : "text-sm")}>
                Applications
                {pendingConfirmations.length > 0 && (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">
                    {pendingConfirmations.length}
                  </Badge>
                )}
              </CardTitle>
              <Users className={cn(isMobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className={cn("font-bold", isMobile ? "text-3xl" : "text-2xl")}>
                {isLoadingUserApplications ? '...' : upcomingApplications.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoadingUserApplications
                  ? 'Loading...'
                  : pendingConfirmations.length > 0
                    ? `${pendingConfirmations.length} need confirmation`
                    : `${upcomingApplications.filter(app => app.status === 'pending').length} pending responses`
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Single column on mobile */}
        <div className={cn(
          "grid gap-4 mb-6 md:gap-6 md:mb-8",
          isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}>
          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Calendar className={cn(isMobile ? "w-5 h-5" : "w-5 h-5")} />
                Quick Actions
              </CardTitle>
              <CardDescription className={cn(
                theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300',
                "text-sm"
              )}>
                Manage your comedy performances
              </CardDescription>
            </CardHeader>
            <CardContent className={cn(isMobile ? "space-y-2" : "space-y-4")}>
              <div className={cn(
                "grid gap-3",
                isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
              )}>
                <Button
                  onClick={() => navigate('/gigs')}
                  className="professional-button w-full justify-start touch-target-44"
                  size={isMobile ? "mobile" : "default"}
                >
                  <Eye className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
                  Browse Gigs
                </Button>

                <Button
                  onClick={() => {
                    const slug = profile?.profile_slug || profile?.id;
                    navigate(slug ? `/comedian/${slug}/edit?tab=calendar` : '/profile?tab=calendar');
                  }}
                  className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-white border-0 touch-target-44"
                  size={isMobile ? "mobile" : "default"}
                >
                  <div className="flex items-center">
                    <Calendar className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
                    My Calendar
                  </div>
                  {!gigsLoading && confirmedGigCount > 0 && (
                    <Badge className="bg-white/20 text-white hover:bg-white/30">
                      {confirmedGigCount}
                    </Badge>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    const slug = profile?.profile_slug || profile?.id;
                    navigate(slug ? `/comedian/${slug}/edit` : '/profile');
                  }}
                  className="professional-button w-full justify-start touch-target-44"
                  size={isMobile ? "mobile" : "default"}
                >
                  <Users className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
                  My Profile
                </Button>

                <Button
                  onClick={() => {
                    const slug = profile?.profile_slug || profile?.id;
                    navigate(slug ? `/comedian/${slug}/edit?tab=invoices` : '/profile?tab=invoices');
                  }}
                  className="professional-button w-full justify-start touch-target-44"
                  size={isMobile ? "mobile" : "default"}
                >
                  <FileText className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
                  Invoices
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Performance Metrics</CardTitle>
              <CardDescription className={cn(
                theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300',
                "text-sm"
              )}>
                Your comedy career at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn(isMobile ? "space-y-3" : "space-y-4")}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Confirmed Gigs</span>
                  <span className={cn("font-bold", isMobile ? "text-xl" : "text-lg")}>{gigsLoading ? '...' : totalConfirmedGigs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Minutes Performed</span>
                  <span className={cn("font-bold", isMobile ? "text-xl" : "text-lg")}>
                    {gigsLoading ? '...' : `${totalMinutesPerformed}mins`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <span className={cn("font-bold", isMobile ? "text-xl" : "text-lg")}>
                    {gigsLoading ? '...' : `${thisMonthGigCount} | ${thisMonthMinutes}mins`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comedian-Specific Sections */}
        <div className="space-y-6">
          <BookingRequestsSection />
          <PendingConfirmationsSection />
          <ApplicationsListSection />
        </div>
      </div>
    </div>
  );
}
