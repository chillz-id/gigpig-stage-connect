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
  const { confirmedGigCount, nextGig, isLoading: gigsLoading } = useUpcomingGigs();
  const { userApplications, isLoadingUserApplications } = useEventApplications();

  // Count pending confirmations
  const pendingConfirmations = userApplications?.filter(app =>
    app.status === 'accepted' && !app.availability_confirmed
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
                Your comedian dashboard - manage your performances and bookings
              </p>
            </div>
            <Badge className="bg-red-500 hover:bg-red-600 text-white w-fit">
              Comedian Profile
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <EarningsCard />

          <Card className={cn(getStatCardStyles(true))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Gigs
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gigsLoading ? '...' : confirmedGigCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {nextGig
                  ? `Next: ${new Date(nextGig.event_date).toLocaleDateString()}`
                  : 'No upcoming gigs'
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
                Manage your comedy performances
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
                  Browse Shows
                </Button>

                <Button
                  onClick={() => navigate('/profile?tab=calendar')}
                  className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    My Calendar
                  </div>
                  {!gigsLoading && confirmedGigCount > 0 && (
                    <Badge className="bg-white/20 text-white hover:bg-white/30">
                      {confirmedGigCount}
                    </Badge>
                  )}
                </Button>

                <Button
                  onClick={() => navigate('/profile')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  My Profile
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
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
                Your comedy career at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Performances</span>
                  <span className="text-lg font-bold">{gigsLoading ? '...' : confirmedGigCount + 12}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                  <span className="text-lg font-bold">
                    {isLoadingUserApplicationations ? '...' :
                      userApplications && userApplications.length > 0
                        ? `${Math.round((userApplications.filter(a => a.status === 'accepted').length / userApplications.length) * 100)}%`
                        : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <span className="text-lg font-bold">{gigsLoading ? '...' : Math.min(confirmedGigCount, 4)}</span>
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
