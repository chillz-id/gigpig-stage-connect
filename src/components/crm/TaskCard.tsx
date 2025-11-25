import { useRef, useState } from 'react';
import { Task } from '@/types/task';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, User, AlarmClock, Repeat, Tag, Eye, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onComplete?: (task: Task) => void;
  isDragging?: boolean;
}

const priorityStyles: Record<Task['priority'], string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const statusAccent: Record<Task['status'], string> = {
  pending: 'border-l-4 border-l-purple-500',
  in_progress: 'border-l-4 border-l-blue-500',
  review: 'border-l-4 border-l-amber-500',
  completed: 'border-l-4 border-l-emerald-500',
  cancelled: 'border-l-4 border-l-slate-400',
};

export const TaskCard = ({ task, onClick, onComplete, isDragging }: TaskCardProps) => {
  const isMobile = useIsMobile();
  const [isSwiped, setIsSwiped] = useState(false);
  const startXRef = useRef<number | null>(null);

  const dueDateCopy = task.due_date ? formatDate(task.due_date) : 'No due date';
  const assigneeName =
    task.assignee?.name ||
    task.assignee?.email ||
    (task.assignee_id ? 'Assigned user' : 'Unassigned');

  const tags = Array.isArray(task.tags) ? task.tags.slice(0, 3) : [];
  const hasMoreTags = Array.isArray(task.tags) && task.tags.length > 3;

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    startXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || startXRef.current === null) return;
    const touch = event.touches[0];
    if (!touch) return;
    const delta = touch.clientX - startXRef.current;
    if (delta < -30) {
      setIsSwiped(true);
    } else if (delta > 30) {
      setIsSwiped(false);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    startXRef.current = null;
  };

  const closeSwipe = () => setIsSwiped(false);

  const handleCardClick = () => {
    if (isSwiped) {
      closeSwipe();
      return;
    }
    onClick?.();
  };

  return (
    <div className="relative">
      {isMobile && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-36 items-center justify-around rounded-r-lg bg-muted/80 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              closeSwipe();
              onClick?.();
            }}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={!onComplete}
            onClick={(event) => {
              event.stopPropagation();
              closeSwipe();
              onComplete?.(task);
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="sr-only">Mark complete</span>
          </Button>
        </div>
      )}
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          statusAccent[task.status],
          isDragging ? 'opacity-50' : '',
          isMobile && isSwiped ? '-translate-x-20' : ''
        )}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold leading-tight text-foreground">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
              )}
            </div>
            <Badge
              variant="secondary"
              className={`border ${priorityStyles[task.priority]} uppercase`}
            >
              {task.priority}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              <span>{assigneeName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>{dueDateCopy}</span>
            </div>
          </div>

          {(task.is_recurring || task.recurrence_pattern) && (
            <Badge className="professional-button gap-2 text-xs">
              <Repeat className="h-3 w-3" />
              Recurring
            </Badge>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <Badge key={tag} className="professional-button gap-1 text-[11px]">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {tag}
                </Badge>
              ))}
              {hasMoreTags && (
                <Badge className="professional-button text-[11px]">
                  +{task.tags.length - tags.length} more
                </Badge>
              )}
            </div>
          )}

          {typeof task.progress_percentage === 'number' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-medium">Progress</span>
                <span>{Math.round(task.progress_percentage)}%</span>
              </div>
              <Progress value={task.progress_percentage} />
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <AlarmClock className="h-3 w-3" />
              Updated {formatDate(task.updated_at)}
            </span>
            <span className="capitalize">{task.status.replace('_', ' ')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
