/**
 * ScheduledPosts Component
 * Displays list of scheduled and past social media posts
 */

import { Calendar, Clock, Edit, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSocialPosts } from '@/hooks/useSocialMedia';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  scheduled: 'default',
  posting: 'secondary',
  posted: 'secondary',
  failed: 'destructive',
  cancelled: 'secondary',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: Edit,
  scheduled: Clock,
  posting: Clock,
  posted: Check,
  failed: AlertCircle,
  cancelled: X,
};

export function ScheduledPosts() {
  const { posts, upcomingPosts, isLoading, cancelPost, isCancelling } = useSocialPosts();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading posts...
        </CardContent>
      </Card>
    );
  }

  const upcoming = posts.filter(p => ['draft', 'scheduled'].includes(p.status));
  const past = posts.filter(p => ['posted', 'failed', 'cancelled'].includes(p.status));

  return (
    <div className="space-y-6">
      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
          <CardDescription>
            Posts scheduled for future publication
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                No upcoming posts scheduled. Create one to get started!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {upcoming.map(post => {
                const StatusIcon = STATUS_ICONS[post.status] || Clock;
                return (
                  <Card key={post.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={STATUS_VARIANTS[post.status] || 'default'}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {post.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(post.scheduledAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button className="professional-button" size="sm" disabled>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            className="professional-button"
                            size="sm"
                            onClick={() => cancelPost(post.id)}
                            disabled={isCancelling}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap line-clamp-3">
                        {post.content}
                      </p>
                      {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div className="mt-2">
                          <Badge className="professional-button">
                            {post.mediaUrls.length} {post.mediaUrls.length === 1 ? 'attachment' : 'attachments'}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Posts */}
      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Post History</CardTitle>
            <CardDescription>
              Previously posted and cancelled posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {past.slice(0, 10).map(post => {
                const StatusIcon = STATUS_ICONS[post.status] || Check;
                return (
                  <Card key={post.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={STATUS_VARIANTS[post.status] || 'secondary'}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {post.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {post.postedAt
                                ? new Date(post.postedAt).toLocaleString()
                                : new Date(post.scheduledAt).toLocaleString()}
                            </span>
                          </div>
                          {post.errorMessage && (
                            <p className="text-sm text-destructive">{post.errorMessage}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap line-clamp-2 text-muted-foreground">
                        {post.content}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
