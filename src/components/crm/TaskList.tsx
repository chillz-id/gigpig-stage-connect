import { Task } from '@/types/task';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/formatters';
import { AlarmClock, Repeat, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskClick: (task: Task) => void;
  onLoadMore?: (...args: any[]) => unknown;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const statusVariant: Record<Task['status'], string> = {
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

export const TaskList = ({
  tasks,
  isLoading = false,
  onTaskClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: TaskListProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border bg-card p-4">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">No tasks found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Adjust your filters or create a new task to get started.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}

        {hasMore && onLoadMore && (
          <div className="flex justify-center">
            <Button onClick={() => onLoadMore()} disabled={isLoadingMore} className="professional-button">
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="mt-2 h-3 w-64" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/40 p-12 text-center">
        <h3 className="text-base font-semibold text-foreground">No tasks found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Adjust your filters or create a new task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer hover:bg-muted/60"
              onClick={() => onTaskClick(task)}
            >
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {task.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} className="professional-button">
                        {tag}
                      </Badge>
                    ))}
                    {task.tags && task.tags.length > 2 && (
                      <span>+{task.tags.length - 2} more</span>
                    )}
                    {(task.is_recurring || task.recurrence_pattern) && (
                      <Badge className="professional-button gap-1">
                        <Repeat className="h-3 w-3" />
                        Recurring
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={`border ${statusVariant[task.status]} capitalize`}
                >
                  {task.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={`border ${priorityVariant[task.priority]} uppercase`}
                >
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>
                    {task.assignee?.name ||
                      task.assignee?.email ||
                      (task.assignee_id ? 'Assigned user' : 'Unassigned')}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {task.due_date ? formatDate(task.due_date) : 'No due date'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlarmClock className="h-4 w-4" />
                  <span>{formatDate(task.updated_at)}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {hasMore && onLoadMore && (
        <div className="flex items-center justify-center border-t bg-background p-4">
          <Button onClick={onLoadMore} className="professional-button" disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
};
