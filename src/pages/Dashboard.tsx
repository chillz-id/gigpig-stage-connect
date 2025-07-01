
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, MessageSquare, TrendingUp, Star, Clock, DollarSign, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'comedian' | 'promoter'>('comedian');

  const isComedian = hasRole('comedian');
  const isPromoter = hasRole('promoter') || hasRole('admin');

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

  const mockStats = {
    comedian: {
      applicationsThisWeek: 3,
      upcomingGigs: 2,
      totalEarnings: 3420,
      totalShows: 50,
      recentApplications: [
        { event: 'Comedy Night at The Laugh Track', status: 'pending', date: '2024-12-18' },
        { event: 'Open Mic Wednesday', status: 'accepted', date: '2024-12-15' }
      ],
      upcomingShows: [
        { event: 'Comedy Club Central - Tonight', time: '8:00 PM', fee: 75 },
        { event: 'Saturday Showcase', time: 'Dec 23 • 10 min set', fee: 100 }
      ]
    },
    promoter: {
      activeEvents: 8,
      totalApplications: 45,
      revenue: 12500,
      avgRating: 4.8
    }
  };

  const ComedianView = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={getCardStyles()}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", 
              theme === 'pleasure' ? 'bg-purple-500/20' : 'bg-blue-500/20'
            )}>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockStats.comedian.applicationsThisWeek}</p>
              <p className={cn("text-sm", theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400')}>
                Applications Sent
              </p>
              <p className="text-xs text-green-400">+2 from last week</p>
            </div>
          </CardContent>
        </Card>

        <Card className={getCardStyles()}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", 
              theme === 'pleasure' ? 'bg-purple-500/20' : 'bg-green-500/20'
            )}>
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockStats.comedian.upcomingGigs}</p>
              <p className={cn("text-sm", theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400')}>
                Upcoming Gigs
              </p>
              <p className="text-xs text-green-400">Next: Tonight at 8pm</p>
            </div>
          </CardContent>
        </Card>

        <Card className={getCardStyles()}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", 
              theme === 'pleasure' ? 'bg-purple-500/20' : 'bg-yellow-500/20'
            )}>
              <DollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">${mockStats.comedian.totalEarnings}</p>
              <p className={cn("text-sm", theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400')}>
                Total Earnings
              </p>
              <p className="text-xs text-green-400">+12% this month</p>
            </div>
          </CardContent>
        </Card>

        <Card className={getCardStyles()}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", 
              theme === 'pleasure' ? 'bg-purple-500/20' : 'bg-purple-500/20'
            )}>
              <Star className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockStats.comedian.totalShows}</p>
              <p className={cn("text-sm", theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400')}>
                Shows Performed
              </p>
              <p className="text-xs text-green-400">Total performances</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className={getCardStyles()}>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription className={theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400'}>
            Get started with your comedy career
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={() => navigate('/browse')}
              className="flex items-center gap-2 justify-start h-auto p-4"
              variant="outline"
            >
              <Calendar className="w-4 h-4" />
              <span>Browse Shows</span>
            </Button>
            <Button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 justify-start h-auto p-4"
              variant="outline"
            >
              <User className="w-4 h-4" />
              <span>Update Profile</span>
            </Button>
            <Button
              onClick={() => navigate('/profile?tab=calendar')}
              className="flex items-center gap-2 justify-start h-auto p-4"
              variant="outline"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </Button>
            <Button
              onClick={() => navigate('/profile?tab=settings')}
              className="flex items-center gap-2 justify-start h-auto p-4"
              variant="outline"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Upgrade</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications and Upcoming Shows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={getCardStyles()}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400'}>
                Your latest gig applications
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/browse')}
            >
              Apply More
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockStats.comedian.recentApplications.map((app, index) => (
              <div key={index} className={cn("flex items-center justify-between p-3 rounded-lg", 
                theme === 'pleasure' ? 'bg-white/[0.05]' : 'bg-gray-700/50'
              )}>
                <div>
                  <p className="font-medium">{app.event}</p>
                  <p className={cn("text-sm", theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400')}>
                    Applied {app.date}
                  </p>
                </div>
                <Badge variant={app.status === 'accepted' ? 'default' : 'secondary'}>
                  {app.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={getCardStyles()}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Shows</CardTitle>
              <CardDescription className={theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400'}>
                Your confirmed performances
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/profile?tab=calendar')}
            >
              Contact Promoters
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockStats.comedian.upcomingShows.map((show, index) => (
              <div key={index} className={cn("flex items-center justify-between p-3 rounded-lg", 
                theme === 'pleasure' ? 'bg-white/[0.05]' : 'bg-gray-700/50'
              )}>
                <div>
                  <p className="font-medium">{show.event}</p>
                  <p className={cn("text-sm flex items-center gap-1", 
                    theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400'
                  )}>
                    <Clock className="w-3 h-3" />
                    {show.time}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    theme === 'pleasure' 
                      ? 'text-pink-300 border-pink-300/30' 
                      : 'text-red-400 border-red-400/30'
                  )}
                >
                  ${show.fee}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const PromoterView = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white mb-2">Advanced Promoter View</h2>
        <p className={cn("text-sm", theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400')}>
          Manage your events and applications
        </p>
      </div>
      
      {/* Promoter stats would go here */}
      <Card className={getCardStyles()}>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Promoter Dashboard</h3>
          <p className={cn("text-sm mb-4", theme === 'pleasure' ? 'text-purple-200' : 'text-gray-400')}>
            Advanced event management and analytics
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/create-event')}>Create Event</Button>
            <Button variant="outline" onClick={() => navigate('/applications')}>View Applications</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!user) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", getBackgroundStyles())}>
        <Card className={cn("max-w-md w-full", getCardStyles())}>
          <CardContent className="p-6 sm:p-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4">Please sign in to view your dashboard</h1>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                Dashboard <Star className="w-6 h-6 text-yellow-400" />
              </h1>
              <p className={cn("text-sm sm:text-base", 
                theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
              )}>
                Welcome back, Stand Up Sydney {hasRole('admin') ? 'Admin' : 'User'}! Here's what's happening with your comedy career.
              </p>
            </div>
            
            {/* View Toggle for users with multiple roles */}
            {isComedian && isPromoter && (
              <div className={cn("flex rounded-lg p-1", 
                theme === 'pleasure' ? 'bg-white/[0.08] border border-white/[0.15]' : 'bg-gray-700 border border-gray-600'
              )}>
                <Button
                  variant={viewMode === 'comedian' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('comedian')}
                  className={cn(
                    viewMode === 'comedian' 
                      ? theme === 'pleasure' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-red-600 text-white'
                      : 'text-current'
                  )}
                >
                  Comedian View
                </Button>
                <Button
                  variant={viewMode === 'promoter' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('promoter')}
                  className={cn(
                    viewMode === 'promoter' 
                      ? theme === 'pleasure' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-red-600 text-white'
                      : 'text-current'
                  )}
                >
                  Advanced Promoter View
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Content */}
        {viewMode === 'comedian' ? <ComedianView /> : <PromoterView />}
      </div>
    </div>
  );
};

export default Dashboard;
