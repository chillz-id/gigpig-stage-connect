
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, DollarSign, Star, Plus, Settings, Bell } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { mockApplications, mockEvents, mockUpcomingGigs } from '@/data/mockData';

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
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest gig applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockApplications.map((application) => (
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
            <CardTitle>Upcoming Shows</CardTitle>
            <CardDescription>Your confirmed performances</CardDescription>
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

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button className="bg-gradient-to-r from-pink-500 to-purple-500">
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
        <Button variant="outline">
          <Users className="w-4 h-4 mr-2" />
          Manage Groups
        </Button>
        <Button variant="outline">
          <Bell className="w-4 h-4 mr-2" />
          Send Notification
        </Button>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Your latest comedy events</CardDescription>
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
