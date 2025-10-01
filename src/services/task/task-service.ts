import { supabase } from '@/integrations/supabase/client';
import type {
  Task,
  CreateTaskFormData,
  UpdateTaskFormData,
  TaskFilters,
  TaskSort,
  BulkTaskOperation,
  BulkOperationResult,
  TasksResponse
} from '@/types/task';

const DEFAULT_SORT: TaskSort = { field: 'created_at', direction: 'desc' };
const DEFAULT_PAGE_SIZE = 20;

function applyFilters(query: any, filters: TaskFilters) {
  let currentQuery = query;

  if (filters.status?.length) {
    currentQuery = currentQuery.in('status', filters.status);
  }
  if (filters.priority?.length) {
    currentQuery = currentQuery.in('priority', filters.priority);
  }
  if (filters.category?.length) {
    currentQuery = currentQuery.in('category', filters.category);
  }
  if (filters.assignee_id?.length) {
    currentQuery = currentQuery.in('assignee_id', filters.assignee_id);
  }
  if (filters.creator_id?.length) {
    currentQuery = currentQuery.in('creator_id', filters.creator_id);
  }
  if (filters.parent_task_id) {
    currentQuery = currentQuery.eq('parent_task_id', filters.parent_task_id);
  }
  if (filters.template_id) {
    currentQuery = currentQuery.eq('template_id', filters.template_id);
  }
  if (filters.tags?.length) {
    currentQuery = currentQuery.overlaps('tags', filters.tags);
  }
  if (filters.due_date_range?.start) {
    currentQuery = currentQuery.gte('due_date', filters.due_date_range.start);
  }
  if (filters.due_date_range?.end) {
    currentQuery = currentQuery.lte('due_date', filters.due_date_range.end);
  }
  if (filters.search) {
    currentQuery = currentQuery.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters.is_overdue) {
    currentQuery = currentQuery.lt('due_date', new Date().toISOString()).neq('status', 'completed');
  }
  if (filters.has_subtasks !== undefined) {
    currentQuery = filters.has_subtasks
      ? currentQuery.not('parent_task_id', 'is', null)
      : currentQuery.is('parent_task_id', null);
  }

  return currentQuery;
}

async function updateTaskWithTimestamp(id: string, updates: UpdateTaskFormData): Promise<Task> {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      assignee:assignee_id(id, name, email, avatar_url),
      creator:creator_id(id, name, email, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data;
}

export const taskService = {
  async getTasks(
    filters: TaskFilters = {},
    sort: TaskSort = DEFAULT_SORT,
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE
  ): Promise<TasksResponse> {
    const baseQuery = supabase
      .from('tasks')
      .select(`
        *,
        assignee:assignee_id(id, name, email, avatar_url),
        creator:creator_id(id, name, email, avatar_url),
        template:template_id(id, name, description),
        parent_task:parent_task_id(id, title, status),
        comments:task_comments(count),
        reminders:task_reminders(count)
      `, { count: 'exact' });

    const filteredQuery = applyFilters(baseQuery, filters);
    const orderedQuery = filteredQuery.order(sort.field, { ascending: sort.direction === 'asc' });

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    const { data, error, count } = await orderedQuery.range(start, end);

    if (error) throw error;

    return {
      tasks: data || [],
      total_count: count || 0,
      page,
      page_size: pageSize,
      has_more: (count || 0) > end + 1
    };
  },

  async getTask(id: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:assignee_id(id, name, email, avatar_url),
        creator:creator_id(id, name, email, avatar_url),
        template:template_id(id, name, description, variables),
        parent_task:parent_task_id(id, title, status),
        subtasks:tasks!parent_task_id(id, title, status, priority, due_date, assignee_id),
        comments:task_comments(
          id, content, created_at, is_system_comment, attachments,
          user:user_id(id, name, email, avatar_url)
        ),
        reminders:task_reminders(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Task not found');

    return data;
  },

  async createTask(taskData: CreateTaskFormData): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select(`
        *,
        assignee:assignee_id(id, name, email, avatar_url),
        creator:creator_id(id, name, email, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(id: string, updates: UpdateTaskFormData): Promise<Task> {
    return updateTaskWithTimestamp(id, updates);
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },

  async getUserTasks(
    userId: string,
    filters: Omit<TaskFilters, 'assignee_id' | 'creator_id'> = {}
  ): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:assignee_id(id, name, email, avatar_url),
        creator:creator_id(id, name, email, avatar_url),
        template:template_id(id, name)
      `)
      .or(`assignee_id.eq.${userId},creator_id.eq.${userId}`)
      .order('due_date', { ascending: true, nullsLast: true })
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async bulkUpdateTasks(operation: BulkTaskOperation): Promise<BulkOperationResult> {
    const results: BulkOperationResult = {
      success_count: 0,
      error_count: 0,
      errors: []
    };

    for (const taskId of operation.task_ids) {
      try {
        switch (operation.operation) {
          case 'update_status':
            await taskService.updateTask(taskId, { status: operation.data.status });
            break;
          case 'update_assignee':
            await taskService.updateTask(taskId, { assignee_id: operation.data.assignee_id });
            break;
          case 'update_priority':
            await taskService.updateTask(taskId, { priority: operation.data.priority });
            break;
          case 'delete':
            await taskService.deleteTask(taskId);
            break;
          case 'archive':
            await taskService.updateTask(taskId, { status: 'cancelled' });
            break;
        }
        results.success_count++;
      } catch (error) {
        results.error_count++;
        results.errors.push({
          task_id: taskId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
};

export default taskService;
