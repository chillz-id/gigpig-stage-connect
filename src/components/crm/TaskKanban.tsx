import { useMemo, useState, useRef } from 'react';
import { ClipboardList, Loader2, ShieldCheck, Eye, CheckCircle, Archive } from 'lucide-react';
import { Task } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './TaskCard';
import { toast } from 'sonner';

interface TaskKanbanProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (task: Task, status: Task['status']) => Promise<void> | void;
  isLoading?: boolean;
  isUpdating?: boolean;
}

type KanbanStatus = Task['status'];

const columns: Array<{
  status: KanbanStatus;
  title: string;
  accent: string;
  icon: React.ReactNode;
}> = [
  {
    status: 'pending',
    title: 'To Do',
    accent: 'bg-purple-100 text-purple-700 border-purple-300',
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    status: 'in_progress',
    title: 'In Progress',
    accent: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: <Loader2 className="h-4 w-4" />,
  },
  {
    status: 'review',
    title: 'Review',
    accent: 'bg-amber-100 text-amber-700 border-amber-300',
    icon: <Eye className="h-4 w-4" />,
  },
  {
    status: 'completed',
    title: 'Completed',
    accent: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  {
    status: 'cancelled',
    title: 'Archived',
    accent: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: <Archive className="h-4 w-4" />,
  },
];

export const groupTasksByStatus = (tasks: Task[]): Record<KanbanStatus, Task[]> => {
  const base = columns.reduce((acc, column) => {
    acc[column.status] = [];
    return acc;
  }, {} as Record<KanbanStatus, Task[]>);

  tasks.forEach((task) => {
    const bucket = base[task.status];
    if (bucket) {
      bucket.push(task);
    }
  });

  return base;
};

export const TaskKanban = ({
  tasks,
  onTaskClick,
  onStatusChange,
  isLoading = false,
  isUpdating = false,
}: TaskKanbanProps) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<KanbanStatus | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [focusedColumn, setFocusedColumn] = useState<number>(0);
  const [focusedTaskIndex, setFocusedTaskIndex] = useState<number>(0);
  const kanbanRef = useRef<HTMLDivElement>(null);

  const groupedTasks = useMemo(() => groupTasksByStatus(tasks), [tasks]);

  const handleDragStart = (task: Task, event: React.DragEvent<HTMLDivElement>) => {
    if (isUpdating) return;
    setDraggedTask(task);
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    setDraggedTask(null);
    setDragOverStatus(null);
    event.currentTarget.classList.remove('opacity-50');
  };

  const handleDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    targetStatus: KanbanStatus
  ) => {
    event.preventDefault();
    setDragOverStatus(null);

    if (!draggedTask || draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    await onStatusChange(draggedTask, targetStatus);
    announceToScreenReader(`Task ${draggedTask.title} moved to ${targetStatus}`);
    setDraggedTask(null);
  };

  // Announce updates to screen readers
  const announceToScreenReader = (message: string) => {
    const announcer = document.getElementById('crm-status-announcements');
    if (announcer) {
      announcer.textContent = message;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentColumnTasks = groupedTasks[columns[focusedColumn]?.status] || [];

    switch (e.key) {
      case 'ArrowRight':
        if (e.shiftKey && selectedTask) {
          e.preventDefault();
          moveTaskToColumn(selectedTask, focusedColumn + 1);
        } else if (focusedColumn < columns.length - 1) {
          e.preventDefault();
          setFocusedColumn(focusedColumn + 1);
          setFocusedTaskIndex(0);
        }
        break;

      case 'ArrowLeft':
        if (e.shiftKey && selectedTask) {
          e.preventDefault();
          moveTaskToColumn(selectedTask, focusedColumn - 1);
        } else if (focusedColumn > 0) {
          e.preventDefault();
          setFocusedColumn(focusedColumn - 1);
          setFocusedTaskIndex(0);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (focusedTaskIndex < currentColumnTasks.length - 1) {
          setFocusedTaskIndex(focusedTaskIndex + 1);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (focusedTaskIndex > 0) {
          setFocusedTaskIndex(focusedTaskIndex - 1);
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (currentColumnTasks[focusedTaskIndex]) {
          onTaskClick(currentColumnTasks[focusedTaskIndex]!);
        }
        break;

      case ' ':
        e.preventDefault();
        if (currentColumnTasks[focusedTaskIndex]) {
          setSelectedTask(
            selectedTask?.id === currentColumnTasks[focusedTaskIndex]?.id
              ? null
              : currentColumnTasks[focusedTaskIndex] ?? null
          );
          announceToScreenReader(
            selectedTask?.id === currentColumnTasks[focusedTaskIndex]?.id
              ? 'Task deselected'
              : `Task ${currentColumnTasks[focusedTaskIndex]?.title} selected. Use Shift + Arrow keys to move.`
          );
        }
        break;

      case 'Escape':
        e.preventDefault();
        setSelectedTask(null);
        announceToScreenReader('Task deselected');
        break;
    }
  };

  const moveTaskToColumn = async (task: Task, targetColumnIndex: number) => {
    if (targetColumnIndex < 0 || targetColumnIndex >= columns.length || isUpdating) return;

    const targetStatus = columns[targetColumnIndex]?.status;
    if (!targetStatus || task.status === targetStatus) return;

    try {
      await onStatusChange(task, targetStatus);
      toast.success(`Task "${task.title}" moved to ${targetStatus}`);
      announceToScreenReader(`Task ${task.title} successfully moved to ${targetStatus}`);
      setSelectedTask(null);
      setFocusedColumn(targetColumnIndex);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {columns.map((column) => (
          <Card key={column.status} className="min-h-[420px]">
            <CardHeader className="border-b bg-muted/40">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  {column.icon}
                  {column.title}
                </CardTitle>
                <Badge variant="secondary" className={`border ${column.accent}`}>
                  <ShieldCheck className="mr-1 h-3 w-3" />
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={kanbanRef}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Task kanban board - Use arrow keys to navigate, Space to select, Shift+Arrow to move tasks"
    >
      {columns.map((column, columnIndex) => {
        const items = groupedTasks[column.status] || [];
        const isDropTarget = dragOverStatus === column.status;
        const isFocusedColumn = focusedColumn === columnIndex;

        return (
          <Card
            data-testid={`task-kanban-column-${column.status}`}
            key={column.status}
            className={`flex min-h-[420px] flex-col transition-all ${
              isDropTarget ? 'ring-2 ring-purple-500 ring-offset-2' : ''
            } ${isFocusedColumn ? 'ring-2 ring-blue-400' : ''}`}
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={() => setDragOverStatus(column.status)}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={(event) => handleDrop(event, column.status)}
            role="region"
            aria-label={`${column.title} column with ${items.length} tasks`}
          >
            <CardHeader className="border-b bg-muted/40 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  {column.icon}
                  {column.title}
                </CardTitle>
                <Badge variant="secondary" className={`border ${column.accent}`}>
                  {items.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                  Drag tasks here
                </div>
              ) : (
                items.map((task, taskIndex) => {
                  const isFocused = isFocusedColumn && focusedTaskIndex === taskIndex;
                  const isSelected = selectedTask?.id === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable={!isUpdating}
                      onDragStart={(event) => handleDragStart(task, event)}
                      onDragEnd={handleDragEnd}
                      className={`transition-all ${isFocused ? 'ring-2 ring-blue-500' : ''} ${
                        isSelected ? 'ring-2 ring-green-500' : ''
                      }`}
                      tabIndex={isFocused ? 0 : -1}
                      role="button"
                      aria-pressed={isSelected}
                      aria-label={`Task: ${task.title}, Status: ${column.title}${
                        isSelected ? ', Selected' : ''
                      }`}
                    >
                      <TaskCard
                        task={task}
                        onClick={() => onTaskClick(task)}
                        isDragging={draggedTask?.id === task.id}
                      />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
