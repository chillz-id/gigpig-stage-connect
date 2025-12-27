
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Calendar, DollarSign, TrendingUp, Eye, UserPlus, Ticket, Building, Download, Facebook } from 'lucide-react';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { TicketsByProviderChart } from './analytics/TicketsByProviderChart';
import { TicketsBySuburbChart } from './analytics/TicketsBySuburbChart';
import { FacebookAdsChart } from './analytics/FacebookAdsChart';

const AnalyticsDashboard = () => {
  const { 
    analyticsData, 
    isLoading, 
    error, 
    isAdmin,
    exportProviderData,
    exportSuburbData,
    exportRevenueData 
  } = useAdminAnalytics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-AU').format(value);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-white mb-2">Access Denied</h3>
          <p className="text-gray-400">You need admin privileges to view analytics.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-white mb-2">Error Loading Analytics</h3>
          <p className="text-gray-400">Please try again later.</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Tickets Sold',
      value: formatNumber(analyticsData.totalTicketsSold),
      change: '+23%',
      icon: Ticket,
      color: 'text-purple-400'
    },
    {
      title: 'Events This Month',
      value: analyticsData.eventsThisMonth.toString(),
      change: '+12%',
      icon: Calendar,
      color: 'text-green-400'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(analyticsData.totalRevenue),
      change: '+28%',
      icon: DollarSign,
      color: 'text-yellow-400'
    },
    {
      title: 'Active Providers',
      value: analyticsData.ticketProviders.length.toString(),
      change: '+1',
      icon: Building,
      color: 'text-blue-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">{stat.title}</p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                    <span className="text-green-400 text-sm">{stat.change}</span>
                  </div>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Business Analytics Charts */}
      <div className="space-y-6">
        {/* Revenue Growth Chart */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Revenue Growth
            </CardTitle>
            <Button
              className="professional-button text-white border-white/20 hover:bg-white/10"
              size="sm"
              onClick={exportRevenueData}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.revenueGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.9)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                    name === 'revenue' ? 'Revenue' : 'Tickets Sold'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tickets" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ticket Provider Analytics */}
        <TicketsByProviderChart 
          data={analyticsData.ticketProviders} 
          onExport={exportProviderData}
        />
        
        {/* Suburb Distribution */}
        <TicketsBySuburbChart 
          data={analyticsData.suburbData} 
          onExport={exportSuburbData}
        />
        
        {/* Facebook Ads Performance */}
        <FacebookAdsChart data={analyticsData.facebookAds} />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
