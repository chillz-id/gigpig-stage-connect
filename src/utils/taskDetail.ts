import type { Task, TaskStatus } from '@/types/task';

export const taskStatusLabels: Record<TaskStatus, string> = {
  pending: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const getTaskStatusLabel = (status: TaskStatus): string => taskStatusLabels[status];

export const computeDueState = (task: Task): 'overdue' | 'upcoming' => {
  if (!task.due_date || task.status === 'completed') {
    return 'upcoming';
  }

  return new Date(task.due_date) < new Date() ? 'overdue' : 'upcoming';
};
