
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

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { confirmedGigCount, nextGig, isLoading: gigsLoading } = useUpcomingGigs();

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
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className={cn(
            theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
          )}>
            Here's what's happening with your comedy career
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className={cn(getStatCardStyles())}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">$2,450</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

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

          <Card className={cn(getStatCardStyles())}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">
                3 pending responses
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
                    onClick={() => navigate('/invoices')} 
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

        {/* Upcoming Shows */}
        <Card className={cn(getCardStyles())}>
          <CardHeader>
            <CardTitle>Upcoming Shows</CardTitle>
            <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
              Your confirmed comedy shows for this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">Friday Night Comedy</h4>
                  <p className="text-sm text-muted-foreground">The Comedy Store, Sydney</p>
                  <p className="text-xs text-muted-foreground">Dec 15, 2024 • 8:00 PM</p>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">Weekend Laughs</h4>
                  <p className="text-sm text-muted-foreground">Laugh Track Comedy Club</p>
                  <p className="text-xs text-muted-foreground">Dec 22, 2024 • 7:30 PM</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pending</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">New Year's Eve Special</h4>
                  <p className="text-sm text-muted-foreground">Sydney Opera House</p>
                  <p className="text-xs text-muted-foreground">Dec 31, 2024 • 9:00 PM</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Applied</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
