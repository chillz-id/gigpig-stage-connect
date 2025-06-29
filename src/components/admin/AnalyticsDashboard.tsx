
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Calendar, DollarSign, TrendingUp, Eye, UserPlus, Ticket, Building } from 'lucide-react';

const AnalyticsDashboard = () => {
  // Mock data for charts
  const userGrowthData = [
    { month: 'Jan', users: 120, comedians: 25, promoters: 8 },
    { month: 'Feb', users: 145, comedians: 32, promoters: 10 },
    { month: 'Mar', users: 180, comedians: 38, promoters: 12 },
    { month: 'Apr', users: 210, comedians: 45, promoters: 15 },
    { month: 'May', users: 235, comedians: 52, promoters: 18 },
    { month: 'Jun', users: 270, comedians: 60, promoters: 22 },
  ];

  const eventData = [
    { month: 'Jan', events: 15, revenue: 3200 },
    { month: 'Feb', events: 18, revenue: 4100 },
    { month: 'Mar', events: 22, revenue: 5300 },
    { month: 'Apr', events: 25, revenue: 6200 },
    { month: 'May', events: 28, revenue: 7100 },
    { month: 'Jun', events: 32, revenue: 8500 },
  ];

  const userTypeData = [
    { name: 'Members', value: 180, color: '#8b5cf6' },
    { name: 'Comedians', value: 60, color: '#06b6d4' },
    { name: 'Promoters', value: 22, color: '#10b981' },
    { name: 'Admins', value: 3, color: '#f59e0b' },
  ];

  const stats = [
    {
      title: 'Total Users',
      value: '265',
      change: '+12%',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      title: 'Active Events',
      value: '32',
      change: '+8%',
      icon: Calendar,
      color: 'text-green-400'
    },
    {
      title: 'Monthly Revenue',
      value: '$8,500',
      change: '+20%',
      icon: DollarSign,
      color: 'text-yellow-400'
    },
    {
      title: 'Page Views',
      value: '45.2K',
      change: '+15%',
      icon: Eye,
      color: 'text-purple-400'
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="comedians" stroke="#06b6d4" strokeWidth={2} />
                <Line type="monotone" dataKey="promoters" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Events & Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="events" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center space-y-4">
              {userTypeData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-white flex-1">{item.name}</span>
                  <span className="text-gray-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
