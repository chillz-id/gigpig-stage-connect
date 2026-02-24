/**
 * ReviewQueue Component
 * Lists AI-generated drafts pending review, with filter controls.
 */

import { useState } from 'react';
import { Inbox, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReviewPostCard } from './ReviewPostCard';
import {
  useReviewQueue,
  useApproveDraft,
  useRejectDraft,
  useUpdateDraft,
  useDeleteDraft,
} from '@/hooks/social/useReviewQueue';
import { usePublishDraft } from '@/hooks/social/usePublishDraft';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ContentDraft } from '@/types/social';

type StatusFilter = ContentDraft['status'] | 'all';

interface ReviewQueueProps {
  organizationId: string | undefined;
}

export function ReviewQueue({ organizationId }: ReviewQueueProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('draft');

  const { data: drafts, isLoading, error } = useReviewQueue(
    organizationId,
    statusFilter === 'all' ? undefined : statusFilter,
  );

  const approveMutation = useApproveDraft();
  const rejectMutation = useRejectDraft();
  const updateMutation = useUpdateDraft();
  const deleteMutation = useDeleteDraft();
  const publishMutation = usePublishDraft();

  const handleApprove = (id: string, notes?: string) => {
    if (!user?.id) return;
    approveMutation.mutate({ id, userId: user.id, notes });
  };

  const handlePublish = (draft: ContentDraft) => {
    publishMutation.mutate(draft, {
      onSuccess: () => {
        toast({ title: 'Post scheduled on Metricool', description: `${draft.platform} post queued for publishing.` });
      },
      onError: (err) => {
        toast({ title: 'Failed to publish', description: err instanceof Error ? err.message : 'Please try again', variant: 'destructive' });
      },
    });
  };

  const handleReject = (id: string, notes?: string) => {
    if (!user?.id) return;
    rejectMutation.mutate({ id, userId: user.id, notes });
  };

  const handleUpdate = (
    id: string,
    updates: Partial<Pick<ContentDraft, 'caption' | 'hashtags' | 'scheduled_for'>>,
  ) => {
    updateMutation.mutate({ id, updates });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const filters: { label: string; value: StatusFilter; count?: number }[] = [
    { label: 'Pending Review', value: 'draft' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'All', value: 'all' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
            {f.count != null && (
              <Badge variant="secondary" className="ml-1">
                {f.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load review queue. {error instanceof Error ? error.message : ''}
          </AlertDescription>
        </Alert>
      ) : !organizationId ? (
        <Card>
          <CardHeader>
            <CardTitle>Review Queue</CardTitle>
            <CardDescription>
              Select an organization to view content awaiting review.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : !drafts || drafts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Inbox className="h-10 w-10 mb-3" />
            <p className="font-medium">No drafts to review</p>
            <p className="text-sm mt-1">
              {statusFilter === 'draft'
                ? 'Run the /social-content skill to generate content for review.'
                : `No ${statusFilter} drafts found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <ReviewPostCard
              key={draft.id}
              draft={draft}
              onApprove={handleApprove}
              onReject={handleReject}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onPublish={handlePublish}
              isApproving={approveMutation.isPending}
              isRejecting={rejectMutation.isPending}
              isUpdating={updateMutation.isPending}
              isPublishing={publishMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
