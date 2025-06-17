
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, DollarSign, Star, Plus, Settings, Bell, MessageCircle, User, Zap, TrendingUp } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { mockApplications, mockEvents, mockUpcomingGigs } from '@/data/mockData';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useUser();
  const [userRole, setUserRole] = useState<'comedian' | 'promoter' | 'both'>('both');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h1>
          <Button className="bg-gradient-to-r from-pink-500 to-purple-500">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const ComedianDashboard = () => (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription className="text-purple-200">
            Get started with your comedy career
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/browse">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Calendar className="w-4 h-4 mr-2" />
                Browse Shows
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                <User className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                <MessageCircle className="w-4 h-4 mr-2" />
                Messages
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                <Zap className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications Sent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockApplications.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Gigs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUpcomingGigs.length}</div>
            <p className="text-xs text-muted-foreground">Next: Tonight at 8pm</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${user.stats.totalEarnings}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">Applications accepted</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Your latest gig applications</CardDescription>
              </div>
              <Link to="/browse">
                <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                  Apply More
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockApplications.slice(0, 3).map((application) => (
              <div key={application.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{application.showTitle}</p>
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Shows</CardTitle>
                <CardDescription>Your confirmed performances</CardDescription>
              </div>
              <Link to="/messages">
                <Button size="sm" variant="outline">
                  Contact Promoters
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockUpcomingGigs.map((gig) => (
              <div key={gig.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{gig.title}</p>
                  <p className="text-sm text-muted-foreground">{gig.time} • {gig.duration}</p>
                </div>
                <Badge className="bg-purple-500">{gig.pay}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const PromoterDashboard = () => (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription className="text-purple-200">
            Manage your comedy events and talent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/create-event">
              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </Link>
            <Link to="/applications">
              <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                <Users className="w-4 h-4 mr-2" />
                Manage Applications
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Comedians
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">2 this week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">+8 this week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${user.stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comedian Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.stats.activeGroups}</div>
            <p className="text-xs text-muted-foreground">127 total members</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Your latest comedy events</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link to="/applications">
                <Button size="sm" variant="outline">
                  View Applications
                </Button>
              </Link>
              <Link to="/create-event">
                <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                  Create New
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.date} • {event.spots} spots • {event.applications} applications
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{event.type}</Badge>
                  <Badge className={
                    event.status === 'active' ? 'bg-green-500' : 
                    event.status === 'draft' ? 'bg-purple-500' : 
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            {user.isVerified && <Star className="w-6 h-6 text-yellow-400 fill-current" />}
          </div>
          <p className="text-purple-100">
            Welcome back, {user.name}! Here's what's happening with your comedy career.
          </p>
        </div>

        {/* Role Selector */}
        <div className="mb-6">
          <Tabs value={userRole} onValueChange={(value) => setUserRole(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="comedian" className="data-[state=active]:bg-purple-500">
                Comedian View
              </TabsTrigger>
              <TabsTrigger value="promoter" className="data-[state=active]:bg-purple-500">
                Promoter View
              </TabsTrigger>
              <TabsTrigger value="both" className="data-[state=active]:bg-purple-500">
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
                  <h2 className="text-2xl font-bold text-white mb-4">Comedian Dashboard</h2>
                  <ComedianDashboard />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Promoter Dashboard</h2>
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
