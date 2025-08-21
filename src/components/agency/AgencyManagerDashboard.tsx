import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  MessageSquare,
  AlertCircle,
  BarChart3,
  PlusCircle,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAgencyDashboard, useAgencyPermissions, useCurrentUserManagerProfile } from '../../hooks/useAgency';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { DealStatus, AgencyDashboardData } from '../../types/agency';
import LoadingSpinner from '../LoadingSpinner';

interface AgencyManagerDashboardProps {
  agencyId: string;
}

const AgencyManagerDashboard: React.FC<AgencyManagerDashboardProps> = ({ agencyId }) => {
  const { data: managerProfile } = useCurrentUserManagerProfile();
  const { data: dashboardData, isLoading, error } = useAgencyDashboard(agencyId, managerProfile?.id);
  const { hasPermission } = useAgencyPermissions(agencyId);
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Failed to load dashboard data. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            <p>No dashboard data available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: DealStatus) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'negotiating': return 'bg-blue-100 text-blue-800';
      case 'counter_offered': return 'bg-yellow-100 text-yellow-800';
      case 'proposed': return 'bg-purple-100 text-purple-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: DealStatus) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'declined': return <XCircle className="h-4 w-4" />;
      case 'negotiating': return <MessageSquare className="h-4 w-4" />;
      case 'counter_offered': return <MessageSquare className="h-4 w-4" />;
      case 'proposed': return <Clock className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agency Dashboard</h1>
          <p className="text-gray-600">Welcome back, {managerProfile?.first_name}</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('senior_manager') && (
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Artists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.artist_summary.total_artists}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.artist_summary.active_artists} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.financial_summary.total_revenue_30d)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.financial_summary.deals_closed_30d} deals closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.financial_summary.commission_earned_30d)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(dashboardData.financial_summary.average_deal_value)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.pending_actions.pending_deals}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.pending_actions.expiring_soon} expiring soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deals">Recent Deals</TabsTrigger>
          <TabsTrigger value="artists">Top Artists</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Deals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recent_deals.slice(0, 5).map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{deal.title}</h4>
                        <p className="text-sm text-gray-600">{deal.artist_name}</p>
                        <p className="text-xs text-gray-500">{formatDate(deal.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(deal.proposed_fee || 0)}</p>
                        <Badge className={`${getStatusColor(deal.status)} border-0`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(deal.status)}
                            {deal.status}
                          </div>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Pending Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-8 w-8 text-blue-600 bg-blue-100 p-2 rounded" />
                      <div>
                        <h4 className="font-medium">New Messages</h4>
                        <p className="text-sm text-gray-600">Unread deal messages</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{dashboardData.pending_actions.new_messages}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-yellow-600 bg-yellow-100 p-2 rounded" />
                      <div>
                        <h4 className="font-medium">Expiring Soon</h4>
                        <p className="text-sm text-gray-600">Deals expiring in 48h</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{dashboardData.pending_actions.expiring_soon}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-green-600 bg-green-100 p-2 rounded" />
                      <div>
                        <h4 className="font-medium">Active Deals</h4>
                        <p className="text-sm text-gray-600">Currently negotiating</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{dashboardData.pending_actions.pending_deals}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deals" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Recent Deals</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recent_deals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium">{deal.title}</h4>
                      <p className="text-sm text-gray-600">{deal.artist_name}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Created: {formatDate(deal.created_at)}</span>
                        {deal.deadline && (
                          <span>Deadline: {formatDate(deal.deadline)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-lg">{formatCurrency(deal.proposed_fee || 0)}</p>
                      <Badge className={`${getStatusColor(deal.status)} border-0 mt-1`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(deal.status)}
                          {deal.status}
                        </div>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artists" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Artists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.artist_summary.top_performers.map((artist, index) => (
                  <div key={artist.artist_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-medium">
                        #{index + 1}
                      </div>
                      <Avatar>
                        <AvatarFallback>
                          {artist.artist_name?.substring(0, 2).toUpperCase() || 'AR'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{artist.artist_name}</h4>
                        <p className="text-sm text-gray-600">{artist.bookings_count} bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-lg">{formatCurrency(artist.total_revenue)}</p>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Revenue Target</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Commission Goal</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Deal Closure Rate</span>
                      <span>68%</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Artist Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Artist Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Artists</span>
                    <span className="text-2xl font-bold">{dashboardData.artist_summary.total_artists}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Artists</span>
                    <span className="text-2xl font-bold">{dashboardData.artist_summary.active_artists}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg Revenue per Artist</span>
                    <span className="text-2xl font-bold">
                      {formatCurrency(
                        dashboardData.artist_summary.total_artists > 0
                          ? dashboardData.financial_summary.total_revenue_30d / dashboardData.artist_summary.total_artists
                          : 0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgencyManagerDashboard;