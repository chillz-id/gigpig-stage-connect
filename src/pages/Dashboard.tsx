
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, DollarSign, Star, Plus, Settings, Bell, MessageCircle, User, TrendingUp, ArrowUp, Trophy, BarChart3, Clock, MapPin, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockApplications, mockEvents, mockUpcomingGigs } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, profile, hasRole } = useAuth();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<'comedian' | 'promoter'>('comedian');

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Please sign in to access your dashboard</h1>
          <Button className="professional-button">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Map profile data to user stats format for compatibility with existing components
  const userStats = {
    totalGigs: 47,
    totalEarnings: 3420,
    showsPerformed: 50,
    averageRating: 4.7,
    totalEvents: 12,
    totalRevenue: 8960,
    activeGroups: 5,
    monthlyRevenue: 2840,
    activeVenues: 8,
    averageAttendance: 85,
    conversionRate: 68,
  };

  const handleQuickAction = (action: string) => {
    toast({
      title: "Action Executed",
      description: `${action} action has been triggered.`,
    });
  };

  const ComedianDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Actions */}
      <Card className="professional-card bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription className="text-muted-foreground">
            Get started with your comedy career
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/browse">
              <Button className="w-full professional-button bg-primary hover:bg-primary/90 text-primary-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Browse Shows
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline" className="w-full professional-button border-border hover:bg-accent">
                <User className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="outline" className="w-full professional-button border-border hover:bg-accent">
                <MessageCircle className="w-4 h-4 mr-2" />
                Messages
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" className="w-full professional-button border-border hover:bg-accent">
                <Zap className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Applications Sent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{mockApplications.length}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUp className="w-3 h-3 mr-1" />
              +2 from last week
            </div>
          </CardContent>
        </Card>
        
        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Upcoming Gigs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{mockUpcomingGigs.length}</div>
            <p className="text-xs text-muted-foreground">Next: Tonight at 8pm</p>
          </CardContent>
        </Card>
        
        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${userStats.totalEarnings}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUp className="w-3 h-3 mr-1" />
              +12% this month
            </div>
          </CardContent>
        </Card>
        
        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Shows Performed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{userStats.showsPerformed}</div>
            <p className="text-xs text-muted-foreground">Total performances</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="professional-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Recent Applications</CardTitle>
                <CardDescription>Your latest gig applications</CardDescription>
              </div>
              <Link to="/browse">
                <Button size="sm" className="professional-button bg-primary hover:bg-primary/90">
                  Apply More
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockApplications.slice(0, 3).map((application) => (
              <div key={application.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/50">
                <div>
                  <p className="font-medium text-foreground">{application.showTitle}</p>
                  <p className="text-sm text-muted-foreground">Applied {application.appliedDate}</p>
                </div>
                <Badge 
                  variant={
                    application.status === 'accepted' ? 'default' : 
                    application.status === 'declined' ? 'destructive' : 
                    'outline'
                  }
                  className={application.status === 'accepted' ? 'bg-green-500' : ''}
                >
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Upcoming Shows</CardTitle>
                <CardDescription>Your confirmed performances</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="professional-button" onClick={() => handleQuickAction('Contact Promoters')}>
                Contact Promoters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockUpcomingGigs.map((gig) => (
              <div key={gig.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/50">
                <div>
                  <p className="font-medium text-foreground">{gig.title}</p>
                  <p className="text-sm text-muted-foreground">{gig.time} • {gig.duration}</p>
                </div>
                <Badge className="bg-primary">{gig.pay}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const AdvancedPromoterDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Advanced Promoter Quick Actions */}
      <Card className="professional-card bg-gradient-to-r from-purple-500/10 to-pink-500/5 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-500" />
            Promoter Command Center
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your comedy empire with advanced tools and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Link to="/create-event">
              <Button className="w-full professional-button bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </Link>
            <Link to="/applications">
              <Button variant="outline" className="w-full professional-button border-border hover:bg-accent">
                <Users className="w-4 h-4 mr-2" />
                Applications
              </Button>
            </Link>
            <Link to="/invoices">
              <Button variant="outline" className="w-full professional-button border-border hover:bg-accent">
                <DollarSign className="w-4 h-4 mr-2" />
                Invoices
              </Button>
            </Link>
            <Button variant="outline" className="w-full professional-button border-border hover:bg-accent" onClick={() => handleQuickAction('Analytics')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Link to="/promoter-settings">
              <Button variant="outline" className="w-full professional-button border-border hover:bg-accent">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="professional-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">${userStats.monthlyRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUp className="w-3 h-3 mr-1" />
              +23% from last month
            </div>
            <p className="text-xs text-green-600 mt-1">Target: $3,200</p>
          </CardContent>
        </Card>
        
        <Card className="professional-card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{userStats.totalEvents}</div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <Clock className="w-3 h-3 mr-1" />
              3 this week
            </div>
            <p className="text-xs text-blue-600 mt-1">Next: Tomorrow 8pm</p>
          </CardContent>
        </Card>
        
        <Card className="professional-card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Active Venues</CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{userStats.activeVenues}</div>
            <div className="flex items-center text-xs text-purple-600 mt-1">
              <ArrowUp className="w-3 h-3 mr-1" />
              2 new partnerships
            </div>
            <p className="text-xs text-purple-600 mt-1">Expanding network</p>
          </CardContent>
        </Card>
        
        <Card className="professional-card bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Avg Attendance</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{userStats.averageAttendance}%</div>
            <div className="flex items-center text-xs text-orange-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +5% this quarter
            </div>
            <p className="text-xs text-orange-600 mt-1">Industry avg: 72%</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics and Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Performance */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Event Performance
            </CardTitle>
            <CardDescription>Detailed insights into your events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="p-4 border border-border rounded-lg bg-card/50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-foreground">{event.title}</h4>
                  <Badge className={
                    event.status === 'active' ? 'bg-green-500' : 
                    event.status === 'draft' ? 'bg-blue-500' : 
                    'bg-gray-500'
                  }>
                    {event.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Applications</p>
                    <p className="font-medium">{event.applications}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversion</p>
                    <p className="font-medium text-green-600">{Math.round(event.applications * 0.3)}/{event.applications}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Comedian Network */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="w-5 h-5" />
              Comedian Network
            </CardTitle>
            <CardDescription>Manage your talent pool</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium">Frequent Collaborators</p>
                <p className="text-sm text-muted-foreground">12 active comedians</p>
              </div>
              <Button size="sm" variant="outline">View All</Button>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium">New Applicants</p>
                <p className="text-sm text-muted-foreground">8 pending reviews</p>
              </div>
              <Badge className="bg-orange-500">Review</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium">Rising Stars</p>
                <p className="text-sm text-muted-foreground">5 high-rated newcomers</p>
              </div>
              <Badge className="bg-purple-500">Priority</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Insights */}
        <Card className="professional-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Revenue Insights
            </CardTitle>
            <CardDescription>Financial performance breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ticket Sales</span>
                <span className="font-medium">$2,240</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sponsorships</span>
                <span className="font-medium">$600</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Merchandise</span>
                <span className="font-medium">$180</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center font-medium">
                <span>Total Revenue</span>
                <span className="text-green-600">${userStats.monthlyRevenue}</span>
              </div>
            </div>
            <Button className="w-full" variant="outline" onClick={() => handleQuickAction('Detailed Analytics')}>
              View Detailed Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            {profile?.is_verified && <Star className="w-6 h-6 text-yellow-400 fill-current" />}
          </div>
          <p className="text-muted-foreground">
            Welcome back, {profile?.name || 'User'}! Here's what's happening with your comedy career.
          </p>
        </div>

        {/* Role Selector */}
        <div className="mb-6">
          <Tabs value={userRole} onValueChange={(value) => setUserRole(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="comedian" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Comedian View
              </TabsTrigger>
              <TabsTrigger value="promoter" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Advanced Promoter View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="comedian" className="mt-6">
              <ComedianDashboard />
            </TabsContent>
            
            <TabsContent value="promoter" className="mt-6">
              <AdvancedPromoterDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
