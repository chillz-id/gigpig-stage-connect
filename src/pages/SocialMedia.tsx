/**
 * SocialMedia Page
 * Social media scheduling interface powered by Metricool
 */

import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Share2,
  Calendar,
  Clock,
  Send,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScheduledPosts, useCreatePost, useDeletePost } from '@/hooks/social/useScheduledPosts';
import { useDraftCounts } from '@/hooks/social/useReviewQueue';
import { ReviewQueue } from '@/components/social/ReviewQueue';
import { ContentCalendar } from '@/components/social/ContentCalendar';
import { AutomationSettings } from '@/components/social/AutomationSettings';
import { SocialAnalytics } from '@/components/social/SocialAnalytics';
import { useOrganizationProfiles } from '@/hooks/useOrganizationProfiles';
import { useToast } from '@/hooks/use-toast';
import type { ScheduledPost, ProviderStatus } from '@/types/social';
import { METRICOOL_NETWORKS } from '@/types/social';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', network: METRICOOL_NETWORKS.instagram },
  { id: 'facebook', label: 'Facebook', network: METRICOOL_NETWORKS.facebook },
  { id: 'tiktok', label: 'TikTok', network: METRICOOL_NETWORKS.tiktok },
  { id: 'twitter', label: 'Twitter/X', network: METRICOOL_NETWORKS.twitter },
  { id: 'youtube', label: 'YouTube', network: METRICOOL_NETWORKS.youtube },
  { id: 'linkedin', label: 'LinkedIn', network: METRICOOL_NETWORKS.linkedin },
  { id: 'threads', label: 'Threads', network: METRICOOL_NETWORKS.threads },
  { id: 'bluesky', label: 'Bluesky', network: METRICOOL_NETWORKS.bluesky },
] as const;

function getStatusBadge(status?: string) {
  switch (status) {
    case 'PUBLISHED':
      return <Badge variant="secondary"><Check className="mr-1 h-3 w-3" />Published</Badge>;
    case 'PENDING':
      return <Badge><Clock className="mr-1 h-3 w-3" />Scheduled</Badge>;
    case 'DRAFT':
      return <Badge variant="secondary">Draft</Badge>;
    case 'ERROR':
      return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Error</Badge>;
    default:
      return <Badge variant="secondary">{status ?? 'Unknown'}</Badge>;
  }
}

interface SocialMediaProps {
  organizationId?: string;
}

export default function SocialMedia({ organizationId }: SocialMediaProps) {
  const { toast } = useToast();
  const { data: orgMap } = useOrganizationProfiles();

  // Organization selection for review queue
  const orgList = useMemo(() => Object.values(orgMap ?? {}), [orgMap]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(undefined);

  // Use prop if provided (org context), otherwise fall back to selector
  const activeOrgId = organizationId ?? selectedOrgId ?? (orgList.length === 1 ? orgList[0]?.id : undefined);

  const { data: draftCounts } = useDraftCounts(activeOrgId);
  const pendingCount = draftCounts?.draft ?? 0;

  // Date range for fetching posts: current month ±1 month
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 19);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().slice(0, 19);

  const { data: postsResponse, isLoading, error } = useScheduledPosts(start, end);
  const createPostMutation = useCreatePost();
  const deletePostMutation = useDeletePost();

  // Schedule form state
  const [caption, setCaption] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isDraft, setIsDraft] = useState(false);

  const posts = useMemo(() => {
    if (!postsResponse?.data) return [];
    return Array.isArray(postsResponse.data) ? postsResponse.data : [];
  }, [postsResponse]);

  const upcomingPosts = useMemo(
    () => posts.filter((p) => {
      const status = p.providers?.[0]?.status;
      return status === 'PENDING' || status === 'DRAFT';
    }),
    [posts],
  );

  const pastPosts = useMemo(
    () => posts.filter((p) => {
      const status = p.providers?.[0]?.status;
      return status === 'PUBLISHED' || status === 'ERROR';
    }),
    [posts],
  );

  const handlePlatformToggle = (network: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(network)
        ? prev.filter((n) => n !== network)
        : [...prev, network],
    );
  };

  const handleSchedule = () => {
    if (!caption.trim()) {
      toast({ title: 'Caption required', variant: 'destructive' });
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast({ title: 'Select at least one platform', variant: 'destructive' });
      return;
    }
    if (!isDraft && (!scheduledDate || !scheduledTime)) {
      toast({ title: 'Date and time required for scheduled posts', variant: 'destructive' });
      return;
    }

    const providers: ProviderStatus[] = selectedPlatforms.map((network) => ({
      network,
    }));

    const post: ScheduledPost = {
      text: caption,
      providers,
      publicationDate: {
        dateTime: isDraft
          ? new Date().toISOString().slice(0, 19)
          : `${scheduledDate}T${scheduledTime}:00`,
        timezone: 'Australia/Sydney',
      },
      draft: isDraft,
      autoPublish: !isDraft,
    };

    createPostMutation.mutate(post, {
      onSuccess: () => {
        toast({
          title: isDraft ? 'Draft saved' : 'Post scheduled',
          description: isDraft
            ? 'Your draft has been saved to Metricool.'
            : `Scheduled for ${new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}`,
        });
        setCaption('');
        setScheduledDate('');
        setScheduledTime('');
        setSelectedPlatforms([]);
        setIsDraft(false);
      },
      onError: (err) => {
        toast({
          title: 'Failed to schedule post',
          description: err instanceof Error ? err.message : 'Please try again',
          variant: 'destructive',
        });
      },
    });
  };

  const handleDelete = (id: number) => {
    deletePostMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: 'Post deleted' });
      },
    });
  };

  const isFormValid =
    caption.trim() &&
    selectedPlatforms.length > 0 &&
    (isDraft || (scheduledDate && scheduledTime));

  return (
    <>
      <Helmet>
        <title>Social Media Manager | GigPigs</title>
        <meta
          name="description"
          content="Schedule and manage your social media posts across all platforms"
        />
      </Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Share2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Social Media Manager</h1>
            <p className="text-muted-foreground">
              Schedule and manage your posts across all platforms via Metricool
            </p>
          </div>
        </div>

        {/* Organization selector (shown if user has multiple orgs and no org prop) */}
        {!organizationId && orgList.length > 1 && (
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Organization:</Label>
            <Select value={activeOrgId ?? ''} onValueChange={setSelectedOrgId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {orgList.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.organization_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="schedule" className="flex-1">Schedule</TabsTrigger>
            <TabsTrigger value="review" className="flex-1 relative">
              Review
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-5 min-w-5 px-1 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1">Calendar</TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1">
              Upcoming ({upcomingPosts.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
          </TabsList>

          {/* Schedule Post Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Create Post</CardTitle>
                  <CardDescription>
                    Compose and schedule across multiple platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Platforms */}
                  <div className="space-y-2">
                    <Label>Platforms</Label>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORMS.map(({ id, label, network }) => (
                        <div
                          key={id}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                            selectedPlatforms.includes(network)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handlePlatformToggle(network)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handlePlatformToggle(network)
                          }
                        >
                          <Checkbox
                            checked={selectedPlatforms.includes(network)}
                            onCheckedChange={() => handlePlatformToggle(network)}
                          />
                          <span className="text-sm">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption</Label>
                    <Textarea
                      id="caption"
                      placeholder="Write your post caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-sm text-muted-foreground">
                      {caption.length} characters
                    </p>
                  </div>

                  {/* Draft toggle */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="draft"
                      checked={isDraft}
                      onCheckedChange={(checked) => setIsDraft(checked === true)}
                    />
                    <Label htmlFor="draft" className="font-normal cursor-pointer">
                      Save as draft (don't schedule yet)
                    </Label>
                  </div>

                  {/* Date and Time */}
                  {!isDraft && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          Date
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">
                          <Clock className="inline h-4 w-4 mr-1" />
                          Time
                        </Label>
                        <Input
                          id="time"
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Schedule Button */}
                  <Button
                    onClick={handleSchedule}
                    disabled={!isFormValid || createPostMutation.isPending}
                    className="w-full"
                  >
                    {createPostMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {createPostMutation.isPending
                      ? 'Scheduling...'
                      : isDraft
                        ? 'Save Draft'
                        : 'Schedule Post'}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>How your post will appear</CardDescription>
                </CardHeader>
                <CardContent>
                  {caption ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4 bg-muted/50">
                        <p className="whitespace-pre-wrap">{caption}</p>
                      </div>
                      {selectedPlatforms.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedPlatforms.map((network) => {
                            const platform = PLATFORMS.find(
                              (p) => p.network === network,
                            );
                            return (
                              <Badge key={network} variant="secondary">
                                {platform?.label ?? network}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      {scheduledDate && scheduledTime && (
                        <div className="text-sm text-muted-foreground">
                          Scheduled for:{' '}
                          {new Date(
                            `${scheduledDate}T${scheduledTime}`,
                          ).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Your post preview will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Review Queue Tab */}
          <TabsContent value="review">
            <ReviewQueue organizationId={activeOrgId} />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <ContentCalendar organizationId={activeOrgId} />
          </TabsContent>

          {/* Upcoming Posts Tab */}
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Posts</CardTitle>
                <CardDescription>
                  Posts scheduled for future publication
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to load posts. Make sure your Metricool API credentials are configured.
                    </AlertDescription>
                  </Alert>
                ) : upcomingPosts.length === 0 ? (
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      No upcoming posts scheduled. Create one to get started!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {upcomingPosts.map((post) => (
                      <Card key={post.id ?? post.uuid}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {getStatusBadge(post.providers?.[0]?.status)}
                                {post.providers?.map((p) => (
                                  <Badge key={p.network} variant="secondary" className="capitalize">
                                    {p.network?.toLowerCase()}
                                  </Badge>
                                ))}
                                <span className="text-sm text-muted-foreground">
                                  {post.publicationDate?.dateTime
                                    ? new Date(post.publicationDate.dateTime).toLocaleString()
                                    : ''}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap line-clamp-3">
                                {post.text}
                              </p>
                            </div>
                            {post.id != null && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(post.id!)}
                                disabled={deletePostMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Post History</CardTitle>
                <CardDescription>
                  Published and past posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pastPosts.length === 0 ? (
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      No post history yet.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {pastPosts.slice(0, 20).map((post) => (
                      <Card key={post.id ?? post.uuid}>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getStatusBadge(post.providers?.[0]?.status)}
                              {post.providers?.map((p) => (
                                <Badge key={p.network} variant="secondary" className="capitalize">
                                  {p.network?.toLowerCase()}
                                </Badge>
                              ))}
                              <span className="text-sm text-muted-foreground">
                                {post.publicationDate?.dateTime
                                  ? new Date(post.publicationDate.dateTime).toLocaleString()
                                  : ''}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap line-clamp-2 text-muted-foreground">
                              {post.text}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <SocialAnalytics organizationId={activeOrgId} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AutomationSettings organizationId={activeOrgId} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
