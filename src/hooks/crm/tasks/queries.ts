import { useEffect } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  taskService,
  taskTemplateService,
  taskAnalyticsService,
  taskCalendarService,
  taskSubscriptionService,
} from '@/services/task';
import type { TaskFilters, TaskSort, TaskAssigneeOption } from '@/types/task';

export function useTasks(
  filters: TaskFilters = {},
  sort: TaskSort = { field: 'created_at', direction: 'desc' },
  pageSize: number = 20
) {
  return useInfiniteQuery({
    queryKey: ['tasks', filters, sort, pageSize],
    queryFn: ({ pageParam = 1 }) => taskService.getTasks(filters, sort, pageParam, pageSize),
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTask(taskId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => taskService.getTask(taskId),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!taskId) return;

    const subscription = taskSubscriptionService.subscribeToTaskChanges(
      (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new.id === taskId) {
          queryClient.setQueryData(['tasks', taskId], payload.new);
        } else if (payload.eventType === 'DELETE' && payload.old.id === taskId) {
          queryClient.removeQueries({ queryKey: ['tasks', taskId] });
        }
      },
      { task_id: taskId }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [taskId, queryClient]);

  return query;
}

export function useUserTasks(
  userId?: string,
  filters: Omit<TaskFilters, 'assignee_id' | 'creator_id'> = {}
) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-tasks', targetUserId, filters],
    queryFn: () => taskService.getUserTasks(targetUserId!, filters),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTaskTemplates(isPublic?: boolean, category?: string, search?: string) {
  return useQuery({
    queryKey: ['task-templates', isPublic, category, search],
    queryFn: () => taskTemplateService.getTemplates(isPublic, category, search),
    staleTime: 10 * 60 * 1000,
  });
}

export function useTaskTemplate(templateId: string) {
  return useQuery({
    queryKey: ['task-templates', templateId],
    queryFn: () => taskTemplateService.getTemplate(templateId),
    enabled: !!templateId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUserTaskStatistics(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-task-statistics', targetUserId],
    queryFn: () => taskAnalyticsService.getUserTaskStatistics(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeamTaskStatistics() {
  return useQuery({
    queryKey: ['team-task-statistics'],
    queryFn: () => taskAnalyticsService.getTeamTaskStatistics(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTaskCompletionTrends(startDate: string, endDate: string, userId?: string) {
  return useQuery({
    queryKey: ['task-completion-trends', startDate, endDate, userId],
    queryFn: () => taskAnalyticsService.getTaskCompletionTrends(startDate, endDate, userId),
    staleTime: 10 * 60 * 1000,
  });
}

export function useTaskCalendarEvents(startDate: string, endDate: string, userId?: string) {
  return useQuery({
    queryKey: ['task-calendar-events', startDate, endDate, userId],
    queryFn: () => taskCalendarService.getTaskCalendarEvents(startDate, endDate, userId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTaskAssignees() {
  return useQuery({
    queryKey: ['task-assignees'],
    queryFn: (): Promise<TaskAssigneeOption[]> => taskService.listAssigneeOptions(),
    staleTime: 10 * 60 * 1000,
  });
}
