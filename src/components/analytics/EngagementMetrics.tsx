import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Calendar, Clock, MousePointer, Share2 } from 'lucide-react';
import type { ProfileAnalyticsDaily } from '@/types/analytics';

interface EngagementMetricsProps {
  analyticsData: ProfileAnalyticsDaily[];
}

export const EngagementMetrics: React.FC<EngagementMetricsProps> = ({ analyticsData }) => {
  // Calculate engagement metrics
  const totalViews = analyticsData.reduce((sum, day) => sum + day.total_views, 0);
  const totalBookingRequests = analyticsData.reduce((sum, day) => sum + day.booking_requests, 0);
  const totalMediaInteractions = analyticsData.reduce((sum, day) => sum + day.media_interactions, 0);
  const totalLinkClicks = analyticsData.reduce((sum, day) => sum + day.link_clicks, 0);
  
  const avgTimeSpent = analyticsData.length > 0
    ? analyticsData.reduce((sum, day) => sum + day.avg_time_spent_seconds, 0) / analyticsData.length
    : 0;

  const conversionRate = totalViews > 0 ? (totalBookingRequests / totalViews) * 100 : 0;
  const engagementRate = totalViews > 0 
    ? ((totalMediaInteractions + totalLinkClicks) / totalViews) * 100 
    : 0;

  const engagementData = analyticsData.slice(-14).map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bookings: day.booking_requests,
    media: day.media_interactions,
    links: day.link_clicks,
  }));

  const metrics = [
    {
      title: 'Booking Conversion Rate',
      value: `${conversionRate.toFixed(2)}%`,
      description: `${totalBookingRequests} booking requests from ${totalViews} views`,
      icon: Calendar,
      color: 'text-green-500',
    },
    {
      title: 'Engagement Rate',
      value: `${engagementRate.toFixed(2)}%`,
      description: 'Percentage of visitors who interact with content',
      icon: MousePointer,
      color: 'text-blue-500',
    },
    {
      title: 'Average Time on Profile',
      value: `${Math.floor(avgTimeSpent / 60)}m ${Math.floor(avgTimeSpent % 60)}s`,
      description: 'How long visitors spend viewing your profile',
      icon: Clock,
      color: 'text-purple-500',
    },
    {
      title: 'Total Interactions',
      value: (totalMediaInteractions + totalLinkClicks).toLocaleString(),
      description: `${totalMediaInteractions} media views, ${totalLinkClicks} link clicks`,
      icon: Share2,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Engagement Timeline</CardTitle>
          <CardDescription>Daily breakdown of user interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="bookings" fill="#10b981" name="Booking Requests" />
                <Bar dataKey="media" fill="#3b82f6" name="Media Views" />
                <Bar dataKey="links" fill="#f59e0b" name="Link Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};