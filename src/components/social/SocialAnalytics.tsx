/**
 * SocialAnalytics Component
 * Displays social media performance metrics and analytics
 */

import { Eye, Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSocialAnalytics } from '@/hooks/useSocialMedia';

export function SocialAnalytics() {
  const { analytics, isLoading } = useSocialAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading analytics...
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>No analytics data available yet.</p>
          <p className="text-sm mt-2">Analytics will appear once you start posting.</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: 'Total Posts',
      value: analytics.total_posts?.toString() || '0',
      icon: TrendingUp,
      color: 'text-blue-500',
    },
    {
      label: 'Total Views',
      value: analytics.total_views?.toLocaleString() || '0',
      icon: Eye,
      color: 'text-purple-500',
    },
    {
      label: 'Total Likes',
      value: analytics.total_likes?.toLocaleString() || '0',
      icon: Heart,
      color: 'text-red-500',
    },
    {
      label: 'Total Comments',
      value: analytics.total_comments?.toLocaleString() || '0',
      icon: MessageCircle,
      color: 'text-green-500',
    },
    {
      label: 'Total Shares',
      value: analytics.total_shares?.toLocaleString() || '0',
      icon: Share2,
      color: 'text-orange-500',
    },
    {
      label: 'Avg Engagement',
      value: analytics.avg_engagement?.toString() || '0',
      icon: TrendingUp,
      color: 'text-indigo-500',
      description: 'Per post',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            Your social media performance across all platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-xs font-medium">
                        {stat.label}
                      </CardDescription>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    {stat.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Engagement Breakdown</CardTitle>
          <CardDescription>
            Detailed metrics for your social media presence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Engagement Rate</p>
                <p className="text-2xl font-bold">
                  {analytics.total_posts && Number(analytics.total_posts) > 0
                    ? (
                        ((Number(analytics.total_likes) +
                          Number(analytics.total_comments) +
                          Number(analytics.total_shares)) /
                          Number(analytics.total_views)) *
                        100
                      ).toFixed(2)
                    : '0'}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Likes per post</span>
                <span className="font-medium">
                  {analytics.total_posts && Number(analytics.total_posts) > 0
                    ? (Number(analytics.total_likes) / Number(analytics.total_posts)).toFixed(1)
                    : '0'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comments per post</span>
                <span className="font-medium">
                  {analytics.total_posts && Number(analytics.total_posts) > 0
                    ? (Number(analytics.total_comments) / Number(analytics.total_posts)).toFixed(1)
                    : '0'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shares per post</span>
                <span className="font-medium">
                  {analytics.total_posts && Number(analytics.total_posts) > 0
                    ? (Number(analytics.total_shares) / Number(analytics.total_posts)).toFixed(1)
                    : '0'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
