import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfileAnalytics } from '@/hooks/useProfileAnalytics';
import { AnalyticsOverview } from './AnalyticsOverview';
import { AnalyticsChart } from './AnalyticsChart';
import { TrafficSources } from './TrafficSources';
import { DeviceBreakdown } from './DeviceBreakdown';
import { EngagementMetrics } from './EngagementMetrics';
import { RealtimeViewers } from './RealtimeViewers';
import { AnalyticsPrivacyNotice } from './AnalyticsPrivacyNotice';
import { Download, Calendar, Info } from 'lucide-react';
import type { AnalyticsTimeRange } from '@/types/analytics';

interface AnalyticsDashboardProps {
  profileId: string;
  showRealtimeViewers?: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  profileId,
  showRealtimeViewers = true 
}) => {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    interval: 'day',
  });

  const {
    analyticsData,
    summary,
    realtimeViewers,
    isLoading,
    exportAnalytics,
    isExporting,
  } = useProfileAnalytics({
    profileId,
    timeRange,
    realtimePolling: showRealtimeViewers,
  });

  const handleTimeRangeChange = (range: string) => {
    const now = new Date();
    let startDate: Date;
    let interval: 'day' | 'week' | 'month' = 'day';

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        interval = 'week';
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        interval = 'month';
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setTimeRange({
      start_date: startDate.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
      interval,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Profile Analytics</h2>
          <p className="text-muted-foreground">
            Track your profile performance and audience engagement
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {showRealtimeViewers && (
            <RealtimeViewers count={realtimeViewers} />
          )}
          
          <Select defaultValue="30d" onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportAnalytics('csv')}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <AnalyticsOverview summary={summary} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="privacy">
            <Info className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AnalyticsChart 
              data={analyticsData} 
              metric="views" 
              title="Profile Views"
              description="Total profile views over time"
            />
            <AnalyticsChart 
              data={analyticsData} 
              metric="unique_visitors" 
              title="Unique Visitors"
              description="Individual visitors to your profile"
            />
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <TrafficSources 
            topSources={summary.top_traffic_sources}
            analyticsData={analyticsData}
          />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <EngagementMetrics analyticsData={analyticsData} />
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <DeviceBreakdown analyticsData={analyticsData} />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <AnalyticsPrivacyNotice />
        </TabsContent>
      </Tabs>
    </div>
  );
};