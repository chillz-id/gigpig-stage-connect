import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarDays, FileText, DollarSign, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '@/hooks/useMobileLayout';

/**
 * ManagerDashboard Component
 *
 * Profile-specific dashboard for manager/agency profiles showing:
 * - Client roster and comedian management
 * - Booking negotiations and contracts
 * - Commission tracking and financials
 * - Agency performance metrics
 */
export function ManagerDashboard() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { isMobile } = useMobileLayout();

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
                {isMobile ? 'Oversee clients & bookings' : 'Your manager dashboard - oversee your client roster and bookings'}
              </p>
            </div>
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white w-fit">
              Manager Profile
            </Badge>
          </div>
        </div>

        {/* Stats Grid - Single column on mobile */}
        <div className={cn(
          "grid gap-4 mb-6 md:gap-6 md:mb-8",
          isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        )}>
          <Card className={cn(getStatCardStyles(true))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                Active Clients
              </CardTitle>
              <Users className={cn(isMobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className={cn("font-bold", isMobile ? "text-3xl" : "text-2xl")}>12</div>
              <p className="text-xs text-muted-foreground mt-1">
                +2 this month
              </p>
            </CardContent>
          </Card>

          <Card className={cn(getStatCardStyles())}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                Active Bookings
              </CardTitle>
              <CalendarDays className={cn(isMobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className={cn("font-bold", isMobile ? "text-3xl" : "text-2xl")}>34</div>
              <p className="text-xs text-muted-foreground mt-1">
                8 pending confirmation
              </p>
            </CardContent>
          </Card>

          <Card className={cn(getStatCardStyles())}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                Commission (MTD)
              </CardTitle>
              <DollarSign className={cn(isMobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className={cn("font-bold", isMobile ? "text-3xl" : "text-2xl")}>$4,850</div>
              <p className="text-xs text-muted-foreground mt-1">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className={cn(getStatCardStyles())}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                Contracts
              </CardTitle>
              <FileText className={cn(isMobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className={cn("font-bold", isMobile ? "text-3xl" : "text-2xl")}>18</div>
              <p className="text-xs text-muted-foreground mt-1">
                3 awaiting signature
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
                <Briefcase className={cn(isMobile ? "w-5 h-5" : "w-5 h-5")} />
                Quick Actions
              </CardTitle>
              <CardDescription className={cn(
                theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300',
                "text-sm"
              )}>
                Manage your agency and clients
              </CardDescription>
            </CardHeader>
            <CardContent className={cn(isMobile ? "space-y-2" : "space-y-4")}>
              <div className={cn(
                "grid gap-3",
                isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
              )}>
                <Button
                  onClick={() => navigate('/crm')}
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white border-0 touch-target-44"
                  size={isMobile ? "mobile" : "default"}
                >
                  <Users className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
                  Client Roster
                </Button>

                <Button
                  onClick={() => navigate('/shows')}
                  className="professional-button w-full justify-start touch-target-44"
                  size={isMobile ? "mobile" : "default"}
                >
                  <CalendarDays className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
                  Bookings
                </Button>

                <Button
                  onClick={() => {
                    const slug = profile?.profile_slug || profile?.id;
                    navigate(slug ? `/manager/${slug}/edit?tab=invoices` : '/profile?tab=invoices');
                  }}
                  className="professional-button w-full justify-start touch-target-44"
                  size={isMobile ? "mobile" : "default"}
                >
                  <FileText className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
                  Contracts
                </Button>

                <Button
                  onClick={() => {
                    const slug = profile?.profile_slug || profile?.id;
                    navigate(slug ? `/manager/${slug}/edit?tab=invoices` : '/profile?tab=invoices');
                  }}
                  className="professional-button w-full justify-start touch-target-44"
                  size={isMobile ? "mobile" : "default"}
                >
                  <DollarSign className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
                  Financials
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Agency Performance</CardTitle>
              <CardDescription className={cn(
                theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300',
                "text-sm"
              )}>
                Your management business metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn(isMobile ? "space-y-3" : "space-y-4")}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Revenue (MTD)</span>
                  <span className={cn("font-bold", isMobile ? "text-xl" : "text-lg")}>$32,400</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Commission Rate</span>
                  <span className={cn("font-bold", isMobile ? "text-xl" : "text-lg")}>15%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Client Satisfaction</span>
                  <span className={cn("font-bold", isMobile ? "text-xl" : "text-lg")}>4.8/5.0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Roster Overview - Single column on mobile */}
        <div className={cn(
          "grid gap-4 mb-6 md:gap-6 md:mb-8",
          isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}>
          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle>Top Performing Clients</CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
                Your most active comedians this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">John Smith</h4>
                    <p className="text-sm text-muted-foreground">8 bookings this month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">$2,400</p>
                    <p className="text-xs text-muted-foreground">Commission</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Sarah Johnson</h4>
                    <p className="text-sm text-muted-foreground">6 bookings this month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">$1,800</p>
                    <p className="text-xs text-muted-foreground">Commission</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Mike Williams</h4>
                    <p className="text-sm text-muted-foreground">5 bookings this month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">$1,500</p>
                    <p className="text-xs text-muted-foreground">Commission</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle>Upcoming Negotiations</CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
                Booking requests requiring your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Comedy Night at The Laugh Factory</h4>
                    <p className="text-sm text-muted-foreground">Client: John Smith</p>
                    <p className="text-xs text-muted-foreground">Fri, Feb 15 • 8:00 PM</p>
                  </div>
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                    Pending
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Stand-up Showcase</h4>
                    <p className="text-sm text-muted-foreground">Client: Sarah Johnson</p>
                    <p className="text-xs text-muted-foreground">Sat, Feb 16 • 9:30 PM</p>
                  </div>
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                    Pending
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Corporate Event</h4>
                    <p className="text-sm text-muted-foreground">Client: Mike Williams</p>
                    <p className="text-xs text-muted-foreground">Sun, Feb 17 • 7:00 PM</p>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-600 text-white">
                    Confirmed
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for Future Manager Features */}
        <Card className={cn(getCardStyles())}>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Manager Features</CardTitle>
            <CardDescription className={cn(
              theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300',
              "text-sm"
            )}>
              Additional management tools coming soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contract management, automated booking workflows, and advanced client analytics will be available in the next update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
