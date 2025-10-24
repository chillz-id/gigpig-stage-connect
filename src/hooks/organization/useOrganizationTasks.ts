import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Types for organization tasks
 */
export interface OrganizationTask {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: string;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  related_event_id: string | null;
  related_invoice_id: string | null;
  tags: string[];
  attachments: any[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: OrganizationTask['status'];
  priority?: OrganizationTask['priority'];
  assigned_to?: string;
  due_date?: string;
  related_event_id?: string;
  related_invoice_id?: string;
  tags?: string[];
}

/**
 * Hook to fetch tasks for the current organization
 *
 * @example
 * ```tsx
 * function OrganizationTasks() {
 *   const { data: tasks, isLoading } = useOrganizationTasks();
 *
 *   return (
 *     <div>
 *       {tasks?.map(task => (
 *         <TaskCard key={task.id} task={task} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useOrganizationTasks = () => {
  const { orgId } = useOrganization();

  return useQuery({
    queryKey: ['organization-tasks', orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const { data, error } = await supabase
        .from('organization_tasks')
        .select(`
          *,
          created_by_profile:created_by (
            id,
            first_name,
            last_name,
            email
          ),
          assigned_to_profile:assigned_to (
            id,
            first_name,
            last_name,
            email
          ),
          related_event:related_event_id (
            id,
            title,
            name,
            event_date
          )
        `)
        .eq('organization_id', orgId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Error fetching organization tasks:', error);
        throw error;
      }

      return data as OrganizationTask[];
    },
    enabled: !!orgId,
  });
};

/**
 * Hook to create a new organization task
 *
 * @example
 * ```tsx
 * function CreateTaskForm() {
 *   const { mutate: createTask } = useCreateOrganizationTask();
 *
 *   const handleSubmit = (data) => {
 *     createTask({
 *       title: data.title,
 *       description: data.description,
 *       assigned_to: data.assignee,
 *       due_date: data.dueDate
 *     });
 *   };
 * }
 * ```
 */
export const useCreateOrganizationTask = () => {
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const { data, error } = await supabase
        .from('organization_tasks')
        .insert({
          organization_id: orgId,
          ...input,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating organization task:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-tasks', orgId] });
      toast({
        title: 'Task created',
        description: 'The task has been created successfully.',
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
};

/**
 * Hook to update an organization task
 */
export const useUpdateOrganizationTask = () => {
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<CreateTaskInput> }) => {
      const { data, error } = await supabase
        .from('organization_tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('organization_id', orgId!)
        .select()
        .single();

      if (error) {
        console.error('Error updating organization task:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-tasks', orgId] });
      toast({
        title: 'Task updated',
        description: 'The task has been updated successfully.',
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
};

/**
 * Hook to delete an organization task
 */
export const useDeleteOrganizationTask = () => {
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('organization_tasks')
        .delete()
        .eq('id', taskId)
        .eq('organization_id', orgId!);

      if (error) {
        console.error('Error deleting organization task:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-tasks', orgId] });
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
};
