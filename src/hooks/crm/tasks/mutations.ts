import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  taskService,
  taskCommentService,
  taskTemplateService,
} from '@/services/task';
import type {
  CreateTaskFormData,
  UpdateTaskFormData,
  BulkTaskOperation,
  ApplyTemplateData,
  CreateTemplateFormData,
} from '@/types/task';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: CreateTaskFormData) => taskService.createTask(taskData),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      toast({
        title: 'Task created',
        description: `"${newTask.title}" has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTaskFormData }) =>
      taskService.updateTask(id, updates),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(['tasks', updatedTask.id], updatedTask);
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      toast({
        title: 'Task updated',
        description: `"${updatedTask.title}" has been updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.removeQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      toast({
        title: 'Task deleted',
        description: 'The task has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useBulkTaskOperations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operation: BulkTaskOperation) => taskService.bulkUpdateTasks(operation),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      toast({
        title: 'Bulk operation completed',
        description: `${result.success_count} tasks updated successfully. ${result.error_count} errors.`,
        variant: result.error_count > 0 ? 'destructive' : 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk operation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAddTaskComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, attachments = [] }: { content: string; attachments?: unknown[] }) =>
      taskCommentService.addComment(taskId, content, attachments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      toast({
        title: 'Comment added',
        description: 'Your comment has been added to the task.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding comment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCreateTaskTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateData: CreateTemplateFormData) =>
      taskTemplateService.createTemplate(templateData),
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast({
        title: 'Template created',
        description: `"${newTemplate.name}" template has been created.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useApplyTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applyData: ApplyTemplateData) => taskTemplateService.applyTemplate(applyData),
    onSuccess: (createdTasks) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      toast({
        title: 'Template applied',
        description: `${createdTasks.length} tasks have been created from the template.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error applying template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
