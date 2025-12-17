import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Label } from '@/components/ui/label';
import {
  useFeature,
  useFeatureComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
  useVoteFeature,
  useUnvoteFeature,
  useUserVote,
  useUpdateFeature,
  useDeleteFeature,
} from '@/hooks/useRoadmap';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface FeatureDetailDialogProps {
  featureId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'ui_ux', label: 'UI/UX' },
  { value: 'performance', label: 'Performance' },
  { value: 'integration', label: 'Integration' },
  { value: 'new_feature', label: 'New Feature' },
  { value: 'bug_fix', label: 'Bug Fix' },
];

const STATUS_OPTIONS = [
  { value: 'requested', label: 'Requested' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  requested: { variant: 'secondary', className: 'bg-purple-100 text-purple-800' },
  under_review: { variant: 'secondary', className: 'bg-blue-100 text-blue-800' },
  planned: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
  in_progress: { variant: 'secondary', className: 'bg-orange-100 text-orange-800' },
  completed: { variant: 'secondary', className: 'bg-green-100 text-green-800' },
};

export function FeatureDetailDialog({
  featureId,
  open,
  onOpenChange,
}: FeatureDetailDialogProps) {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');

  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const { data: feature, isLoading: isLoadingFeature } = useFeature(featureId || '');
  const { data: comments, isLoading: isLoadingComments } = useFeatureComments(featureId || '');
  const { data: hasVoted } = useUserVote(featureId || '');

  const voteFeatureMutation = useVoteFeature();
  const unvoteFeatureMutation = useUnvoteFeature();
  const addCommentMutation = useAddComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  const updateFeatureMutation = useUpdateFeature();
  const deleteFeatureMutation = useDeleteFeature();

  if (!featureId) return null;

  const handleVoteClick = async () => {
    try {
      if (hasVoted) {
        await unvoteFeatureMutation.mutateAsync(featureId);
        toast.success('Vote removed');
      } else {
        await voteFeatureMutation.mutateAsync(featureId);
        toast.success('Vote added');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to update vote');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await addCommentMutation.mutateAsync({
        featureId,
        content: newComment.trim(),
      });
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editedCommentContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      await updateCommentMutation.mutateAsync({
        id: commentId,
        content: editedCommentContent.trim(),
        featureId,
      });
      setEditingCommentId(null);
      setEditedCommentContent('');
      toast.success('Comment updated');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteCommentMutation.mutateAsync({ id: commentId, featureId });
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await updateFeatureMutation.mutateAsync({
        id: featureId,
        data: { status },
      });
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleUpdateCategory = async (category: string) => {
    try {
      await updateFeatureMutation.mutateAsync({
        id: featureId,
        data: { category },
      });
      toast.success('Category updated');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteFeature = async () => {
    if (!confirm('Are you sure you want to delete this feature request? This action cannot be undone.')) return;

    try {
      await deleteFeatureMutation.mutateAsync(featureId);
      toast.success('Feature request deleted');
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast.error('Failed to delete feature request');
    }
  };

  const statusBadge = feature ? STATUS_BADGES[feature.status] : null;
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === feature?.status)?.label || feature?.status;
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === feature?.category)?.label || feature?.category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {isLoadingFeature ? (
          <div className="p-8 text-center">Loading...</div>
        ) : !feature ? (
          <div className="p-8 text-center">Feature not found</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{feature.title}</DialogTitle>
              <DialogDescription>
                Feature request details and discussion
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                {/* Status badge */}
                <Badge variant={statusBadge?.variant} className={statusBadge?.className}>
                  {statusLabel}
                </Badge>

                {/* Category badge */}
                {feature.category && (
                  <Badge className="professional-button">{categoryLabel}</Badge>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {feature.description || 'No description provided'}
                </p>
              </div>

              {/* Created by */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <OptimizedAvatar
                  src={feature.creator_avatar}
                  name={feature.creator_name || 'U'}
                  className="h-6 w-6"
                  fallbackClassName="text-[10px]"
                />
                <span>
                  Created by {feature.creator_name} •{' '}
                  {formatDistanceToNow(new Date(feature.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Vote button with heart */}
              <div className="flex justify-center py-2">
                <button
                  onClick={handleVoteClick}
                  disabled={
                    voteFeatureMutation.isPending || unvoteFeatureMutation.isPending
                  }
                  className="flex flex-col items-center gap-1 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl font-bold">{feature.vote_count || 0}</span>
                  <Heart
                    className={cn(
                      'h-8 w-8 transition-all duration-200',
                      hasVoted
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-400 group-hover:text-red-400 group-hover:scale-110'
                    )}
                  />
                  <span className="text-xs text-muted-foreground mt-1">
                    {hasVoted ? 'Voted' : 'Vote for this feature'}
                  </span>
                </button>
              </div>

              {/* Admin controls */}
              {isAdmin && (
                <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                  <h4 className="font-semibold text-sm">Admin Controls</h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={feature.status}
                        onValueChange={handleUpdateStatus}
                        disabled={updateFeatureMutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Category</Label>
                      <Select
                        value={feature.category || undefined}
                        onValueChange={handleUpdateCategory}
                        disabled={updateFeatureMutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteFeature}
                    disabled={deleteFeatureMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Feature Request
                  </Button>
                </div>
              )}

              {/* Comments section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-4">
                  Comments ({feature.comment_count || 0})
                </h4>

                {/* Add comment form */}
                <form onSubmit={handleAddComment} className="mb-4">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={addCommentMutation.isPending || !newComment.trim()}
                    >
                      {addCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
                    </Button>
                  </div>
                </form>

                {/* Comments list */}
                {isLoadingComments ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    Loading comments...
                  </div>
                ) : !comments || comments.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    No comments yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => {
                      const isOwner = user?.id === comment.user_id;
                      const isEditing = editingCommentId === comment.id;

                      return (
                        <div key={comment.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <OptimizedAvatar
                                src={comment.user_avatar}
                                name={comment.user_name || 'U'}
                                className="h-6 w-6"
                                fallbackClassName="text-[10px]"
                              />
                              <div>
                                <p className="text-sm font-medium">{comment.user_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>

                            {isOwner && !isEditing && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditedCommentContent(comment.content);
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={deleteCommentMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editedCommentContent}
                                onChange={(e) => setEditedCommentContent(e.target.value)}
                                rows={3}
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  className="professional-button"
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditedCommentContent('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleEditComment(comment.id)}
                                  disabled={updateCommentMutation.isPending}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
