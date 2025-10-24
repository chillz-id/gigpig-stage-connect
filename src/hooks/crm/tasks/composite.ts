import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { taskSubscriptionService } from '@/services/task';
import type { UpdateTaskFormData } from '@/types/task';
import { useTask, useUserTasks, useUserTaskStatistics } from './queries';
import {
  useUpdateTask,
  useDeleteTask,
  useAddTaskComment,
} from './mutations';
import { useTimeTracking } from './timeTracking';

export function useTaskManagement(taskId: string) {
  const task = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addComment = useAddTaskComment(taskId);
  const timeTracking = useTimeTracking(taskId);

  useEffect(() => {
    if (!taskId) return;

    const subscription = taskSubscriptionService.subscribeToTaskComments(taskId, () => {
      task.refetch();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [taskId, task]);

  return {
    task: task.data,
    isLoading: task.isLoading,
    error: task.error,
    updateTask: (updates: UpdateTaskFormData) => updateTask.mutate({ id: taskId, updates }),
    deleteTask: () => deleteTask.mutate(taskId),
    addComment: addComment.mutate,
    ...timeTracking,
    isUpdating: updateTask.isPending,
    isDeleting: deleteTask.isPending,
    isAddingComment: addComment.isPending,
    refetch: task.refetch,
  };
}

export function useTaskDashboard() {
  const { user } = useAuth();
  const userTasks = useUserTasks();
  const userStats = useUserTaskStatistics();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneWeekStr = oneWeekFromNow.toISOString().split('T')[0];

  const tasksDueToday = useUserTasks(user?.id, {
    due_date_range: { start: todayStr, end: todayStr },
    status: ['pending', 'in_progress'],
  });

  const tasksDueThisWeek = useUserTasks(user?.id, {
    due_date_range: { start: todayStr, end: oneWeekStr },
    status: ['pending', 'in_progress'],
  });

  const overdueTasks = useUserTasks(user?.id, {
    is_overdue: true,
  });

  return {
    allTasks: userTasks.data || [],
    tasksDueToday: tasksDueToday.data || [],
    tasksDueThisWeek: tasksDueThisWeek.data || [],
    overdueTasks: overdueTasks.data || [],
    statistics: userStats.data,
    isLoading: userTasks.isLoading || userStats.isLoading,
    refetch: () => {
      userTasks.refetch();
      userStats.refetch();
      tasksDueToday.refetch();
      tasksDueThisWeek.refetch();
      overdueTasks.refetch();
    },
  };
}
