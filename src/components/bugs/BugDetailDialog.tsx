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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  useBug,
  useBugComments,
  useAddBugComment,
  useUpdateBugComment,
  useDeleteBugComment,
  useUpdateBug,
  useDeleteBug,
} from '@/hooks/useBugTracker';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface BugDetailDialogProps {
  bugId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', icon: '⚪' },
  { value: 'medium', label: 'Medium', icon: '🟡' },
  { value: 'high', label: 'High', icon: '🟠' },
  { value: 'critical', label: 'Critical', icon: '🔴' },
];

const CATEGORY_OPTIONS = [
  { value: 'ui', label: 'UI' },
  { value: 'functionality', label: 'Functionality' },
  { value: 'performance', label: 'Performance' },
  { value: 'security', label: 'Security' },
  { value: 'data', label: 'Data' },
];

const STATUS_OPTIONS = [
  { value: 'reported', label: 'Reported' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'verified', label: 'Verified' },
  { value: 'closed', label: 'Closed' },
];

const SEVERITY_STYLES: Record<string, { icon: string; className: string }> = {
  critical: { icon: '🔴', className: 'bg-red-100 text-red-900 border-red-300' },
  high: { icon: '🟠', className: 'bg-orange-100 text-orange-900 border-orange-300' },
  medium: { icon: '🟡', className: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
  low: { icon: '⚪', className: 'bg-gray-100 text-gray-900 border-gray-300' },
};

const STATUS_BADGES: Record<string, { className: string }> = {
  reported: { className: 'bg-purple-100 text-purple-800' },
  triaged: { className: 'bg-blue-100 text-blue-800' },
  in_progress: { className: 'bg-orange-100 text-orange-800' },
  fixed: { className: 'bg-green-100 text-green-800' },
  verified: { className: 'bg-teal-100 text-teal-800' },
  closed: { className: 'bg-gray-100 text-gray-800' },
};

export function BugDetailDialog({
  bugId,
  open,
  onOpenChange,
}: BugDetailDialogProps) {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');

  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const { data: bug, isLoading: isLoadingBug } = useBug(bugId || '');
  const { data: comments, isLoading: isLoadingComments } = useBugComments(bugId || '');

  const addCommentMutation = useAddBugComment();
  const updateCommentMutation = useUpdateBugComment();
  const deleteCommentMutation = useDeleteBugComment();
  const updateBugMutation = useUpdateBug();
  const deleteBugMutation = useDeleteBug();

  if (!bugId) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await addCommentMutation.mutateAsync({
        bugId,
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
        bugId,
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
      await deleteCommentMutation.mutateAsync({ id: commentId, bugId });
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await updateBugMutation.mutateAsync({
        id: bugId,
        data: { status },
      });
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleUpdateSeverity = async (severity: string) => {
    try {
      await updateBugMutation.mutateAsync({
        id: bugId,
        data: { severity },
      });
      toast.success('Severity updated');
    } catch (error) {
      console.error('Error updating severity:', error);
      toast.error('Failed to update severity');
    }
  };

  const handleUpdateCategory = async (category: string) => {
    try {
      await updateBugMutation.mutateAsync({
        id: bugId,
        data: { category },
      });
      toast.success('Category updated');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteBug = async () => {
    if (!confirm('Are you sure you want to delete this bug report? This action cannot be undone.')) return;

    try {
      await deleteBugMutation.mutateAsync(bugId);
      toast.success('Bug report deleted');
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting bug:', error);
      toast.error('Failed to delete bug report');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const severityStyle = bug ? SEVERITY_STYLES[bug.severity] : null;
  const statusBadge = bug ? STATUS_BADGES[bug.status] : null;
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === bug?.status)?.label || bug?.status;
  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === bug?.category)?.label || bug?.category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {isLoadingBug ? (
          <div className="p-8 text-center">Loading...</div>
        ) : !bug ? (
          <div className="p-8 text-center">Bug not found</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{bug.title}</DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  {/* Severity badge */}
                  <Badge variant="secondary" className={cn('text-xs font-medium', severityStyle?.className)}>
                    {severityStyle?.icon} {bug.severity.toUpperCase()}
                  </Badge>

                  {/* Status badge */}
                  <Badge variant="secondary" className={cn('text-xs', statusBadge?.className)}>
                    {statusLabel}
                  </Badge>

                  {/* Category badge */}
                  {bug.category && (
                    <Badge className="professional-button text-xs">{categoryLabel}</Badge>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {bug.description || 'No description provided'}
                </p>
              </div>

              {/* Steps to Reproduce */}
              {bug.steps_to_reproduce && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Steps to Reproduce</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {bug.steps_to_reproduce}
                  </p>
                </div>
              )}

              {/* Expected vs Actual Behavior */}
              {(bug.expected_behavior || bug.actual_behavior) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {bug.expected_behavior && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-green-700">Expected Behavior</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {bug.expected_behavior}
                      </p>
                    </div>
                  )}
                  {bug.actual_behavior && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-red-700">Actual Behavior</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {bug.actual_behavior}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Reporter and Assignment */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    {bug.reporter_avatar && (
                      <AvatarImage src={bug.reporter_avatar} alt={bug.reporter_name} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(bug.reporter_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    Reported by {bug.reporter_name} •{' '}
                    {formatDistanceToNow(new Date(bug.created_at), { addSuffix: true })}
                  </span>
                </div>

                {bug.assigned_to && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Assigned to:</span>
                    <Avatar className="h-6 w-6 border-2 border-green-500">
                      {bug.assigned_avatar && (
                        <AvatarImage src={bug.assigned_avatar} alt={bug.assigned_name} />
                      )}
                      <AvatarFallback className="text-[10px] bg-green-100">
                        {getInitials(bug.assigned_name || 'A')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{bug.assigned_name}</span>
                  </div>
                )}
              </div>

              {/* Admin controls */}
              {isAdmin && (
                <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Admin Controls
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={bug.status}
                        onValueChange={handleUpdateStatus}
                        disabled={updateBugMutation.isPending}
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
                      <Label>Severity</Label>
                      <Select
                        value={bug.severity}
                        onValueChange={handleUpdateSeverity}
                        disabled={updateBugMutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEVERITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Category</Label>
                      <Select
                        value={bug.category || undefined}
                        onValueChange={handleUpdateCategory}
                        disabled={updateBugMutation.isPending}
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
                    onClick={handleDeleteBug}
                    disabled={deleteBugMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Bug Report
                  </Button>
                </div>
              )}

              {/* Comments section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-4">
                  Comments ({bug.comment_count || 0})
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
                              <Avatar className="h-6 w-6">
                                {comment.user_avatar && (
                                  <AvatarImage
                                    src={comment.user_avatar}
                                    alt={comment.user_name}
                                  />
                                )}
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(comment.user_name || 'U')}
                                </AvatarFallback>
                              </Avatar>
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
