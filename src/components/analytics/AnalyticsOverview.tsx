import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  Users, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { AnalyticsSummary } from '@/types/analytics';

interface AnalyticsOverviewProps {
  summary: AnalyticsSummary;
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ summary }) => {
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const cards = [
    {
      title: 'Total Views',
      value: formatNumber(summary.total_views),
      icon: Eye,
      description: 'Profile page views',
      trend: null,
    },
    {
      title: 'Unique Visitors',
      value: formatNumber(summary.unique_visitors),
      icon: Users,
      description: 'Individual visitors',
      trend: null,
    },
    {
      title: 'Booking Conversion',
      value: `${summary.booking_conversion_rate.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Views to booking requests',
      trend: null,
    },
    {
      title: 'Avg. Session Duration',
      value: formatDuration(summary.avg_session_duration),
      icon: Clock,
      description: 'Time spent on profile',
      trend: null,
    },
  ];

  return (
    <div className="space-y-4">
      {summary.growth_percentage !== 0 && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">Profile Growth</p>
              <p className="text-2xl font-bold">
                {summary.growth_percentage > 0 ? '+' : ''}{summary.growth_percentage.toFixed(1)}%
              </p>
            </div>
            {summary.growth_percentage > 0 ? (
              <ArrowUpRight className="h-8 w-8 text-green-500" />
            ) : (
              <ArrowDownRight className="h-8 w-8 text-red-500" />
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};