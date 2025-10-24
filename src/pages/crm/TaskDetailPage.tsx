import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  AlarmClock,
  User,
  Repeat,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Bell,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTask, useUpdateTask, useAddTaskComment } from '@/hooks/useTasks';
import type { Task, TaskStatus } from '@/types/task';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { taskStatusLabels, getTaskStatusLabel, computeDueState } from '@/utils/taskDetail';

const statusVariant: Record<TaskStatus, string> = {
  pending: 'bg-purple-100 text-purple-800 border-purple-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  review: 'bg-amber-100 text-amber-800 border-amber-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

const priorityVariant: Record<Task['priority'], string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const safeId = id ?? '';

  const { data: task, isLoading, error } = useTask(safeId);
  const updateTask = useUpdateTask();
  const addComment = useAddTaskComment(safeId);

  const [commentValue, setCommentValue] = useState('');
  const [statusDraft, setStatusDraft] = useState<TaskStatus | undefined>();

  useEffect(() => {
    if (task) {
      setStatusDraft(task.status);
    }
  }, [task]);

  const sortedComments = useMemo(() => {
    if (!task?.comments) return [];
    return [...task.comments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [task?.comments]);

  const handleStatusChange = (nextStatus: TaskStatus) => {
    if (!task || nextStatus === task.status) {
      return;
    }

    setStatusDraft(nextStatus);
    updateTask.mutate({
      id: task.id,
      updates: { status: nextStatus },
    });
  };

  const handleAddComment = () => {
    if (!commentValue.trim() || !id) {
      return;
    }

    addComment.mutate(
      { content: commentValue.trim() },
      {
        onSuccess: () => setCommentValue(''),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading task…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/crm/tasks')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tasks
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Task not found or failed to load.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dueState = computeDueState(task);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/crm/tasks')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(task.created_at)} • Last updated {formatDate(task.updated_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className={`border ${priorityVariant[task.priority]} uppercase`}
          >
            {task.priority}
          </Badge>
          <Badge
            variant="secondary"
            className={`border ${statusVariant[task.status]} capitalize`}
          >
            {getTaskStatusLabel(task.status)}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Task Overview</CardTitle>
            <CardDescription>
              Assignment, due dates, and progress across the task lifecycle.
            </CardDescription>
          </div>
          <Select
            value={statusDraft ?? 'pending'}
            onValueChange={(value) => handleStatusChange(value as TaskStatus)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Update status" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(taskStatusLabels) as TaskStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {taskStatusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-6">
          {task.description && (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              {task.description}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4" />
                Assignee
              </div>
              <p className="mt-2 text-sm text-foreground">
                {task.assignee?.name ||
                  task.assignee?.email ||
                  (task.assignee_id ? 'Assigned user' : 'Unassigned')}
              </p>
            </div>

            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Due date
              </div>
              <p className="mt-2 text-sm text-foreground">
                {task.due_date ? formatDate(task.due_date) : 'No due date'}
              </p>
              {dueState === 'overdue' && (
                <Badge variant="destructive" className="mt-2 gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>

            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <AlarmClock className="h-4 w-4" />
                Completed
              </div>
              <p className="mt-2 text-sm text-foreground">
                {task.completed_at ? formatDate(task.completed_at) : 'Not completed'}
              </p>
            </div>

            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                Creator
              </div>
              <p className="mt-2 text-sm text-foreground">
                {task.creator?.name || task.creator?.email || 'Unknown'}
              </p>
            </div>
          </div>

          {(task.is_recurring || task.recurrence_pattern) && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed bg-purple-50/80 p-4 text-sm text-purple-800">
              <Repeat className="h-4 w-4" />
              Recurring task — check reminders to ensure repetition stays aligned.
            </div>
          )}

          {Array.isArray(task.tags) && task.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Tags</h3>
              <div className="flex flex-wrap items-center gap-2">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="gap-1 text-xs">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Activity & Comments</CardTitle>
            <CardDescription>
              Collaborate with teammates and track decision context for this task.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Leave a note for the team…"
              value={commentValue}
              onChange={(event) => setCommentValue(event.target.value)}
            />
            <div className="flex items-center justify-end">
              <Button onClick={handleAddComment} disabled={addComment.isPending}>
                {addComment.isPending ? (
                  <Clock3 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="mr-2 h-4 w-4" />
                )}
                Add comment
              </Button>
            </div>
            <Separator />
            {sortedComments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            ) : (
              <ScrollArea className="h-80 pr-4">
                <div className="space-y-4">
                  {sortedComments.map((comment) => (
                    <div key={comment.id} className="rounded-lg border bg-muted/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {comment.user?.name || comment.user?.email || 'Team member'}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Reminders & Timeline</CardTitle>
            <CardDescription>
              Automated nudges to keep this task moving before key deadlines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {task.reminders && task.reminders.length > 0 ? (
              <div className="space-y-3">
                {task.reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <Bell className="h-4 w-4 text-purple-500" />
                        {reminder.reminder_type === 'recurring'
                          ? 'Recurring Reminder'
                          : 'Due Date Reminder'}
                      </span>
                      <span>{formatDateTime(reminder.remind_at)}</span>
                    </div>
                    {reminder.message && (
                      <p className="mt-2 text-xs">{reminder.message}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                No reminders configured yet.
              </div>
            )}

            <Separator />

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>
                  Created on <strong>{formatDate(task.created_at)}</strong> by{' '}
                  {task.creator?.name || task.creator?.email || 'system'}.
                </span>
              </div>
              {task.completed_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>
                    Completed on <strong>{formatDate(task.completed_at)}</strong>.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
