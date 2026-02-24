/**
 * SocialAnalytics Component
 * Performance dashboard with engagement trends, platform comparison,
 * and optimization insights.
 */

import {
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Lightbulb,
  Hash,
  Clock,
  Image,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSocialInsights } from '@/hooks/social/useSocialAnalytics';

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'text-pink-500',
  facebook: 'text-blue-600',
  tiktok: 'text-zinc-800',
  twitter: 'text-sky-500',
  youtube: 'text-red-600',
  linkedin: 'text-blue-700',
  threads: 'text-zinc-700',
  bluesky: 'text-blue-400',
};

interface SocialAnalyticsProps {
  organizationId: string | undefined;
}

export function SocialAnalytics({ organizationId }: SocialAnalyticsProps) {
  const { data: insights, isLoading, error } = useSocialInsights(organizationId);

  if (!organizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Select an organization to view performance analytics.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load analytics. {error instanceof Error ? error.message : ''}
        </AlertDescription>
      </Alert>
    );
  }

  if (!insights) return null;

  const hasData = insights.platformInsights.length > 0;

  return (
    <div className="space-y-6">
      {/* Optimization Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Optimization Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.promptSuggestions.map((suggestion, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {hasData && (
        <>
          {/* Platform Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Platform Performance
              </CardTitle>
              <CardDescription>Engagement rates across platforms (last 90 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.platformInsights.map((platform) => {
                  const color = PLATFORM_COLORS[platform.platform] ?? 'text-gray-500';
                  const barWidth = Math.max(
                    5,
                    Math.min(100, (platform.avgEngagementRate / (insights.platformInsights[0]?.avgEngagementRate || 1)) * 100),
                  );

                  return (
                    <div key={platform.platform} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium capitalize ${color}`}>
                          {platform.platform}
                        </span>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>{platform.totalPosts} posts</span>
                          <span className="font-medium text-foreground">
                            {platform.avgEngagementRate.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {Math.round(platform.avgImpressions).toLocaleString()} avg impressions
                        </span>
                        {platform.bestPostType && (
                          <span>Best: {platform.bestPostType}</span>
                        )}
                        {platform.bestTimeSlot && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {platform.bestTimeSlot}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Hashtags */}
            {insights.topHashtags.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Top Hashtags
                  </CardTitle>
                  <CardDescription>By average engagement rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {insights.topHashtags.slice(0, 10).map((tag) => (
                      <div key={tag.hashtag} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            #{tag.hashtag}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            used {tag.usageCount}x
                          </span>
                        </div>
                        <span className="font-medium">
                          {tag.avgEngagementRate.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Best Posting Times */}
            {insights.bestPostingHours.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Best Posting Times
                  </CardTitle>
                  <CardDescription>By average engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {insights.bestPostingHours.slice(0, 8).map((slot) => {
                      const period = slot.hour >= 12 ? 'PM' : 'AM';
                      const displayHour = slot.hour > 12 ? slot.hour - 12 : slot.hour === 0 ? 12 : slot.hour;

                      return (
                        <div key={slot.hour} className="flex items-center justify-between text-sm">
                          <span>
                            {displayHour}:00 {period}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-xs">
                              {slot.count} posts
                            </span>
                            <span className="font-medium">
                              {Math.round(slot.avgEngagement)} avg engagement
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Media Type Performance */}
          {insights.bestMediaTypes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Media Type Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {insights.bestMediaTypes.map((media) => (
                    <div key={media.type} className="flex items-center gap-2 rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm capitalize">{media.type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">{media.count} posts</p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {media.avgEngagement.toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Posts */}
          {insights.topPosts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Top Performing Posts
                </CardTitle>
                <CardDescription>Highest engagement rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.topPosts.map((post, i) => (
                    <div key={post.draft_id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{post.caption}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <Badge variant="secondary" className="capitalize text-xs">
                            {post.platform}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            {post.shares}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.impressions.toLocaleString()}
                          </span>
                          <span className="font-medium text-foreground">
                            {post.engagement_rate.toFixed(2)}% engagement
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
