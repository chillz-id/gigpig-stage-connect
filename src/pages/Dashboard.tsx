
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, DollarSign, Star, Plus, Settings, Bell, MessageCircle, User, Zap, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockApplications, mockEvents, mockUpcomingGigs } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, profile, hasRole } = useAuth();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<'comedian' | 'promoter' | 'both'>('both');

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
    successRate: 68,
    averageRating: 4.7,
    totalEvents: 12,
    totalRevenue: 8960,
    activeGroups: 5,
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
            <CardTitle className="text-sm font-medium text-foreground">Success Rate</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{userStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">Applications accepted</p>
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

  const PromoterDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Actions */}
      <Card className="professional-card bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your comedy events and talent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/create-event">
              <Button className="w-full professional-button bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </Link>
            <Link to="/applications">
              <Button variant="outline" className="w-full professional-button border-border hover:bg-accent">
                <Users className="w-4 h-4 mr-2" />
                Manage Applications
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="outline" className="w-full professional-button border-border hover:bg-accent">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Comedians
              </Button>
            </Link>
            <Button variant="outline" className="w-full professional-button border-border hover:bg-accent" onClick={() => handleQuickAction('View Analytics')}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{userStats.totalEvents}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUp className="w-3 h-3 mr-1" />
              2 this week
            </div>
          </CardContent>
        </Card>
        
        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">47</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUp className="w-3 h-3 mr-1" />
              +8 this week
            </div>
          </CardContent>
        </Card>
        
        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Revenue This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${userStats.totalRevenue}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUp className="w-3 h-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>
        
        <Card className="professional-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Comedian Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{userStats.activeGroups}</div>
            <p className="text-xs text-muted-foreground">127 total members</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card className="professional-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Recent Events</CardTitle>
              <CardDescription>Your latest comedy events</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link to="/applications">
                <Button size="sm" variant="outline" className="professional-button">
                  View Applications
                </Button>
              </Link>
              <Link to="/create-event">
                <Button size="sm" className="professional-button bg-primary hover:bg-primary/90">
                  Create New
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
                <div>
                  <p className="font-medium text-foreground">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.date} • {event.spots} spots • {event.applications} applications
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{event.type}</Badge>
                  <Badge className={
                    event.status === 'active' ? 'bg-green-500' : 
                    event.status === 'draft' ? 'bg-primary' : 
                    'bg-gray-500'
                  }>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="comedian" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Comedian View
              </TabsTrigger>
              <TabsTrigger value="promoter" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Promoter View
              </TabsTrigger>
              <TabsTrigger value="both" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Both Roles
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="comedian" className="mt-6">
              <ComedianDashboard />
            </TabsContent>
            
            <TabsContent value="promoter" className="mt-6">
              <PromoterDashboard />
            </TabsContent>
            
            <TabsContent value="both" className="mt-6">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Comedian Dashboard</h2>
                  <ComedianDashboard />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Promoter Dashboard</h2>
                  <PromoterDashboard />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
