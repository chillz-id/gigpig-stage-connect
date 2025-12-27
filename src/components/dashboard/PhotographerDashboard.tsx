import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Camera, CalendarDays, FileText, DollarSign, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '@/hooks/useMobileLayout';

/**
 * PhotographerDashboard Component
 *
 * Profile-specific dashboard for photographer profiles showing:
 * - Event photography bookings
 * - Portfolio management
 * - Equipment tracking
 * - Photography business metrics
 */
export function PhotographerDashboard() {
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
                {isMobile ? 'Manage bookings & portfolio' : 'Your photographer dashboard - manage bookings and portfolio'}
              </p>
            </div>
            <Badge className="bg-orange-500 hover:bg-orange-600 text-white w-fit">
              Photographer Profile
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
                Upcoming Bookings
              </CardTitle>
              <CalendarDays className={cn(isMobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className={cn("font-bold", isMobile ? "text-3xl" : "text-2xl")}>7</div>
              <p className="text-xs text-muted-foreground mt-1">
                Next: Feb 10, 2025
              </p>
            </CardContent>
          </Card>

          <Card className={cn(getStatCardStyles())}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                Events Shot
              </CardTitle>
              <Camera className={cn(isMobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className={cn("font-bold", isMobile ? "text-3xl" : "text-2xl")}>42</div>
              <p className="text-xs text-muted-foreground mt-1">
                +8 this month
              </p>
            </CardContent>
          </Card>

          <Card className={cn(getStatCardStyles())}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                Revenue (MTD)
              </CardTitle>
              <DollarSign className={cn(isMobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className={cn("font-bold", isMobile ? "text-3xl" : "text-2xl")}>$2,800</div>
              <p className="text-xs text-muted-foreground mt-1">
                +18% from last month
              </p>
            </CardContent>
          </Card>

          <Card className={cn(getStatCardStyles())}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
                Portfolio Photos
              </CardTitle>
              <Image className={cn(isMobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className={cn("font-bold", isMobile ? "text-3xl" : "text-2xl")}>156</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across 12 events
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
                <Camera className={cn(isMobile ? "w-5 h-5" : "w-5 h-5")} />
                Quick Actions
              </CardTitle>
              <CardDescription className={cn(
                theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300',
                "text-sm"
              )}>
                Manage your photography business
              </CardDescription>
            </CardHeader>
            <CardContent className={cn(isMobile ? "space-y-2" : "space-y-4")}>
              <div className={cn(
                "grid gap-3",
                isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
              )}>
                <Button
                  onClick={() => navigate('/shows')}
                  className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-white border-0 touch-target-44"
                  size={isMobile ? "mobile" : "default"}
                >
                  <CalendarDays className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
                  Browse Events
                </Button>

                <Button
                  onClick={() => navigate('/profile')}
                  className="professional-button w-full justify-start touch-target-44"
                  size={isMobile ? "mobile" : "default"}
                >
                  <Image className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
                  Portfolio
                </Button>

                <Button
                  onClick={() => navigate('/profile?tab=calendar')}
                  className="professional-button w-full justify-start touch-target-44"
                  size={isMobile ? "mobile" : "default"}
                >
                  <CalendarDays className={cn(isMobile ? "w-5 h-5" : "w-4 h-4", "mr-2")} />
                  My Bookings
                </Button>

                <Button
                  onClick={() => navigate('/profile?tab=invoices')}
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
              <CardTitle className="text-base md:text-lg">Photography Metrics</CardTitle>
              <CardDescription className={cn(
                theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300',
                "text-sm"
              )}>
                Your business performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn(isMobile ? "space-y-3" : "space-y-4")}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Rate/Event</span>
                  <span className={cn("font-bold", isMobile ? "text-xl" : "text-lg")}>$400</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Client Satisfaction</span>
                  <span className={cn("font-bold", isMobile ? "text-xl" : "text-lg")}>4.9/5.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Repeat Bookings</span>
                  <span className={cn("font-bold", isMobile ? "text-xl" : "text-lg")}>68%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Bookings - Single column on mobile */}
        <div className={cn(
          "grid gap-4 mb-6 md:gap-6 md:mb-8",
          isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}>
          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle>Upcoming Shoots</CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
                Your scheduled photography sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Comedy Night Live</h4>
                    <p className="text-sm text-muted-foreground">The Comedy Store</p>
                    <p className="text-xs text-muted-foreground">Fri, Feb 10 • 8:00 PM</p>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-600 text-white">
                    Confirmed
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Stand-up Showcase</h4>
                    <p className="text-sm text-muted-foreground">Laugh Factory</p>
                    <p className="text-xs text-muted-foreground">Sat, Feb 11 • 9:00 PM</p>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-600 text-white">
                    Confirmed
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Open Mic Night</h4>
                    <p className="text-sm text-muted-foreground">Comedy Underground</p>
                    <p className="text-xs text-muted-foreground">Sun, Feb 12 • 7:30 PM</p>
                  </div>
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                    Pending
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(getCardStyles())}>
            <CardHeader>
              <CardTitle>Recent Work</CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
                Your latest photography sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Improv Night</h4>
                    <p className="text-sm text-muted-foreground">68 photos delivered</p>
                    <p className="text-xs text-muted-foreground">Feb 3, 2025</p>
                  </div>
                  <Button size="sm" className="professional-button">
                    View
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Comedy Festival</h4>
                    <p className="text-sm text-muted-foreground">142 photos delivered</p>
                    <p className="text-xs text-muted-foreground">Jan 28, 2025</p>
                  </div>
                  <Button size="sm" className="professional-button">
                    View
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Headshot Session</h4>
                    <p className="text-sm text-muted-foreground">24 photos delivered</p>
                    <p className="text-xs text-muted-foreground">Jan 25, 2025</p>
                  </div>
                  <Button size="sm" className="professional-button">
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Equipment & Portfolio */}
        <Card className={cn(getCardStyles())}>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Equipment & Portfolio</CardTitle>
            <CardDescription className={cn(
              theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300',
              "text-sm"
            )}>
              Manage your gear and showcase your work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "grid gap-4",
              isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
            )}>
              <div>
                <h4 className="font-medium mb-2 text-sm md:text-base">Primary Equipment</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Canon EOS R5 (2 bodies)</li>
                  <li>• RF 24-70mm f/2.8L IS USM</li>
                  <li>• RF 70-200mm f/2.8L IS USM</li>
                  <li>• Speedlite EL-1 (3 units)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-sm md:text-base">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="professional-button text-xs">Live Performance</Badge>
                  <Badge className="professional-button text-xs">Event Coverage</Badge>
                  <Badge className="professional-button text-xs">Headshots</Badge>
                  <Badge className="professional-button text-xs">Low Light</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
