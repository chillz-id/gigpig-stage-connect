// Custom React hooks for task management
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  taskService,
  taskCommentService,
  taskTemplateService,
  taskAnalyticsService,
  timeTrackingService,
  taskCalendarService,
  taskSubscriptionService
} from '@/services/task';
import type {
  Task,
  TaskComment,
  TaskTemplate,
  CreateTaskFormData,
  UpdateTaskFormData,
  ApplyTemplateData,
  CreateTemplateFormData,
  TaskFilters,
  TaskSort,
  TaskStatistics,
  UserTaskStatistics,
  BulkTaskOperation,
  TimeEntry,
  TaskCalendarEvent
} from '@/types/task';
import { useEffect } from 'react';

// ============================================================================
// TASK HOOKS
// ============================================================================

// Hook for fetching tasks with filtering and pagination
export function useTasks(
  filters: TaskFilters = {},
  sort: TaskSort = { field: 'created_at', direction: 'desc' },
  pageSize: number = 20
) {
  return useInfiniteQuery({
    queryKey: ['tasks', filters, sort, pageSize],
    queryFn: ({ pageParam = 1 }) => taskService.getTasks(filters, sort, pageParam, pageSize),
    getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching a single task
export function useTask(taskId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => taskService.getTask(taskId),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
  });

  // Subscribe to real-time updates
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

// Hook for user's tasks (assigned or created by user)
export function useUserTasks(userId?: string, filters: Omit<TaskFilters, 'assignee_id' | 'creator_id'> = {}) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-tasks', targetUserId, filters],
    queryFn: () => taskService.getUserTasks(targetUserId!, filters),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes for user tasks
  });
}

// Hook for creating tasks
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: CreateTaskFormData) => taskService.createTask(taskData),
    onSuccess: (newTask) => {
      // Invalidate and refetch tasks queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      
      toast({
        title: "Task created",
        description: `"${newTask.title}" has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook for updating tasks
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTaskFormData }) =>
      taskService.updateTask(id, updates),
    onSuccess: (updatedTask) => {
      // Update specific task in cache
      queryClient.setQueryData(['tasks', updatedTask.id], updatedTask);
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      
      toast({
        title: "Task updated",
        description: `"${updatedTask.title}" has been updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook for deleting tasks
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: (_, taskId) => {
      // Remove task from cache
      queryClient.removeQueries({ queryKey: ['tasks', taskId] });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook for bulk task operations
export function useBulkTaskOperations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operation: BulkTaskOperation) => taskService.bulkUpdateTasks(operation),
    onSuccess: (result) => {
      // Invalidate all task queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      
      toast({
        title: "Bulk operation completed",
        description: `${result.success_count} tasks updated successfully. ${result.error_count} errors.`,
        variant: result.error_count > 0 ? "destructive" : "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk operation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================================================
// TASK COMMENT HOOKS
// ============================================================================

// Hook for adding task comments
export function useAddTaskComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, attachments = [] }: { content: string; attachments?: any[] }) =>
      taskCommentService.addComment(taskId, content, attachments),
    onSuccess: () => {
      // Refetch task to get updated comments
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      
      toast({
        title: "Comment added",
        description: "Your comment has been added to the task.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================================================
// TASK TEMPLATE HOOKS
// ============================================================================

// Hook for fetching templates
export function useTaskTemplates(isPublic?: boolean, category?: string, search?: string) {
  return useQuery({
    queryKey: ['task-templates', isPublic, category, search],
    queryFn: () => taskTemplateService.getTemplates(isPublic, category, search),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching a single template
export function useTaskTemplate(templateId: string) {
  return useQuery({
    queryKey: ['task-templates', templateId],
    queryFn: () => taskTemplateService.getTemplate(templateId),
    enabled: !!templateId,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for creating templates
export function useCreateTaskTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateData: CreateTemplateFormData) => 
      taskTemplateService.createTemplate(templateData),
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      
      toast({
        title: "Template created",
        description: `"${newTemplate.name}" template has been created.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook for applying templates
export function useApplyTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applyData: ApplyTemplateData) => taskTemplateService.applyTemplate(applyData),
    onSuccess: (createdTasks) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      
      toast({
        title: "Template applied",
        description: `${createdTasks.length} tasks have been created from the template.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error applying template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

// Hook for user task statistics
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

// Hook for team task statistics
export function useTeamTaskStatistics() {
  return useQuery({
    queryKey: ['team-task-statistics'],
    queryFn: () => taskAnalyticsService.getTeamTaskStatistics(),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for task completion trends
export function useTaskCompletionTrends(
  startDate: string,
  endDate: string,
  userId?: string
) {
  return useQuery({
    queryKey: ['task-completion-trends', startDate, endDate, userId],
    queryFn: () => taskAnalyticsService.getTaskCompletionTrends(startDate, endDate, userId),
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// TIME TRACKING HOOKS
// ============================================================================

// Hook for time tracking operations
export function useTimeTracking(taskId: string) {
  const queryClient = useQueryClient();

  const startTimer = useMutation({
    mutationFn: (description?: string) => timeTrackingService.startTimer(taskId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-time-entries', taskId] });
      toast({
        title: "Timer started",
        description: "Time tracking has started for this task.",
      });
    },
  });

  const stopTimer = useMutation({
    mutationFn: (entryId: string) => timeTrackingService.stopTimer(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-time-entries', taskId] });
      toast({
        title: "Timer stopped",
        description: "Time tracking has been stopped and recorded.",
      });
    },
  });

  const timeEntries = useQuery({
    queryKey: ['task-time-entries', taskId],
    queryFn: () => timeTrackingService.getTaskTimeEntries(taskId),
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    startTimer: startTimer.mutate,
    stopTimer: stopTimer.mutate,
    timeEntries: timeEntries.data || [],
    isStartingTimer: startTimer.isPending,
    isStoppingTimer: stopTimer.isPending,
    isLoadingEntries: timeEntries.isLoading,
  };
}

// ============================================================================
// CALENDAR HOOKS
// ============================================================================

// Hook for task calendar events
export function useTaskCalendarEvents(
  startDate: string,
  endDate: string,
  userId?: string
) {
  return useQuery({
    queryKey: ['task-calendar-events', startDate, endDate, userId],
    queryFn: () => taskCalendarService.getTaskCalendarEvents(startDate, endDate, userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================================
// COMPOUND HOOKS
// ============================================================================

// Comprehensive hook for task management on a single task page
export function useTaskManagement(taskId: string) {
  const task = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addComment = useAddTaskComment(taskId);
  const timeTracking = useTimeTracking(taskId);

  // Subscribe to comments
  useEffect(() => {
    if (!taskId) return;

    const subscription = taskSubscriptionService.subscribeToTaskComments(
      taskId,
      () => {
        // Invalidate task query to get updated comments
        task.refetch();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [taskId, task]);

  return {
    task: task.data,
    isLoading: task.isLoading,
    error: task.error,
    updateTask: (updates: UpdateTaskFormData) => 
      updateTask.mutate({ id: taskId, updates }),
    deleteTask: () => deleteTask.mutate(taskId),
    addComment: addComment.mutate,
    ...timeTracking,
    isUpdating: updateTask.isPending,
    isDeleting: deleteTask.isPending,
    isAddingComment: addComment.isPending,
    refetch: task.refetch,
  };
}

// Hook for dashboard with user tasks and statistics
export function useTaskDashboard() {
  const { user } = useAuth();
  const userTasks = useUserTasks();
  const userStats = useUserTaskStatistics();
  
  // Get tasks due today and this week
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneWeekStr = oneWeekFromNow.toISOString().split('T')[0];

  const tasksDueToday = useUserTasks(user?.id, {
    due_date_range: { start: todayStr, end: todayStr },
    status: ['pending', 'in_progress']
  });

  const tasksDueThisWeek = useUserTasks(user?.id, {
    due_date_range: { start: todayStr, end: oneWeekStr },
    status: ['pending', 'in_progress']
  });

  const overdueTasks = useUserTasks(user?.id, {
    is_overdue: true
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
    }
  };
}
