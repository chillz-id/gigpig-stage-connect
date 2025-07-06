// Task Management Service - API layer for all task-related operations
import { supabase } from '@/lib/supabase';
import type {
  Task,
  TaskComment,
  TaskReminder,
  TaskTemplate,
  TaskTemplateItem,
  CreateTaskFormData,
  UpdateTaskFormData,
  ApplyTemplateData,
  CreateTemplateFormData,
  TaskFilters,
  TaskSort,
  TaskStatistics,
  UserTaskStatistics,
  BulkTaskOperation,
  BulkOperationResult,
  TasksResponse,
  TemplatesResponse,
  TimeEntry,
  TaskCalendarEvent
} from '@/types/task';

// ============================================================================
// TASK CRUD OPERATIONS
// ============================================================================

export const taskService = {
  // Get tasks with filtering, sorting, and pagination
  async getTasks(
    filters: TaskFilters = {},
    sort: TaskSort = { field: 'created_at', direction: 'desc' },
    page: number = 1,
    pageSize: number = 20
  ): Promise<TasksResponse> {
    let query = supabase
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

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.priority?.length) {
      query = query.in('priority', filters.priority);
    }
    if (filters.category?.length) {
      query = query.in('category', filters.category);
    }
    if (filters.assignee_id?.length) {
      query = query.in('assignee_id', filters.assignee_id);
    }
    if (filters.creator_id?.length) {
      query = query.in('creator_id', filters.creator_id);
    }
    if (filters.parent_task_id) {
      query = query.eq('parent_task_id', filters.parent_task_id);
    }
    if (filters.template_id) {
      query = query.eq('template_id', filters.template_id);
    }
    if (filters.tags?.length) {
      query = query.overlaps('tags', filters.tags);
    }
    if (filters.due_date_range?.start) {
      query = query.gte('due_date', filters.due_date_range.start);
    }
    if (filters.due_date_range?.end) {
      query = query.lte('due_date', filters.due_date_range.end);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.is_overdue) {
      query = query.lt('due_date', new Date().toISOString()).neq('status', 'completed');
    }
    if (filters.has_subtasks !== undefined) {
      if (filters.has_subtasks) {
        query = query.not('parent_task_id', 'is', null);
      } else {
        query = query.is('parent_task_id', null);
      }
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    // Apply pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      tasks: data || [],
      total_count: count || 0,
      page,
      page_size: pageSize,
      has_more: (count || 0) > end + 1
    };
  },

  // Get single task with full details
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

  // Create new task
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

  // Update task
  async updateTask(id: string, updates: UpdateTaskFormData): Promise<Task> {
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
  },

  // Delete task
  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get user tasks (assigned or created by user)
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

  // Bulk operations
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
            await this.updateTask(taskId, { status: operation.data.status });
            break;
          case 'update_assignee':
            await this.updateTask(taskId, { assignee_id: operation.data.assignee_id });
            break;
          case 'update_priority':
            await this.updateTask(taskId, { priority: operation.data.priority });
            break;
          case 'delete':
            await this.deleteTask(taskId);
            break;
          case 'archive':
            await this.updateTask(taskId, { status: 'cancelled' });
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

// ============================================================================
// TASK COMMENTS
// ============================================================================

export const taskCommentService = {
  // Add comment to task
  async addComment(
    taskId: string,
    content: string,
    attachments: any[] = []
  ): Promise<TaskComment> {
    const { data, error } = await supabase
      .from('task_comments')
      .insert([{
        task_id: taskId,
        content,
        attachments,
        user_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select(`
        *,
        user:user_id(id, name, email, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Update comment
  async updateComment(id: string, content: string): Promise<TaskComment> {
    const { data, error } = await supabase
      .from('task_comments')
      .update({ content })
      .eq('id', id)
      .select(`
        *,
        user:user_id(id, name, email, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Delete comment
  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================================================
// TASK TEMPLATES
// ============================================================================

export const taskTemplateService = {
  // Get templates with filtering
  async getTemplates(
    isPublic?: boolean,
    category?: string,
    search?: string
  ): Promise<TaskTemplate[]> {
    let query = supabase
      .from('task_templates')
      .select(`
        *,
        creator:creator_id(id, name, email),
        template_items:task_template_items(*)
      `)
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (isPublic !== undefined) {
      query = query.eq('is_public', isPublic);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get single template
  async getTemplate(id: string): Promise<TaskTemplate> {
    const { data, error } = await supabase
      .from('task_templates')
      .select(`
        *,
        creator:creator_id(id, name, email),
        template_items:task_template_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Template not found');
    return data;
  },

  // Create template
  async createTemplate(templateData: CreateTemplateFormData): Promise<TaskTemplate> {
    const { template_items, ...templateFields } = templateData;
    
    // Insert template
    const { data: template, error: templateError } = await supabase
      .from('task_templates')
      .insert([{
        ...templateFields,
        creator_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (templateError) throw templateError;

    // Insert template items
    const itemsWithTemplateId = template_items.map(item => ({
      ...item,
      template_id: template.id
    }));

    const { error: itemsError } = await supabase
      .from('task_template_items')
      .insert(itemsWithTemplateId);

    if (itemsError) throw itemsError;

    // Return template with items
    return this.getTemplate(template.id);
  },

  // Apply template to create tasks
  async applyTemplate(applyData: ApplyTemplateData): Promise<Task[]> {
    const template = await this.getTemplate(applyData.template_id);
    const startDate = applyData.start_date ? new Date(applyData.start_date) : new Date();
    
    // Create tasks from template items
    const tasksToCreate = template.template_items?.map(item => {
      // Substitute variables in title and description
      let title = item.title;
      let description = item.description || '';
      
      Object.entries(applyData.variables).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        title = title.replace(new RegExp(placeholder, 'g'), String(value));
        description = description.replace(new RegExp(placeholder, 'g'), String(value));
      });

      // Calculate due date
      let dueDate: string | undefined;
      if (item.due_offset_days !== undefined) {
        const due = new Date(startDate);
        due.setDate(due.getDate() + item.due_offset_days);
        dueDate = due.toISOString();
      }

      return {
        title,
        description,
        priority: item.priority,
        category: item.category,
        estimated_hours: item.estimated_hours,
        due_date: dueDate,
        assignee_id: applyData.assignee_id,
        template_id: applyData.template_id,
        metadata: {
          ...item.metadata,
          template_item_id: item.id,
          applied_variables: applyData.variables,
          ...(applyData.project_id && { project_id: applyData.project_id })
        }
      };
    }) || [];

    // Insert all tasks
    const { data, error } = await supabase
      .from('tasks')
      .insert(tasksToCreate)
      .select(`
        *,
        assignee:assignee_id(id, name, email, avatar_url),
        creator:creator_id(id, name, email, avatar_url)
      `);

    if (error) throw error;

    // Increment template usage count
    await supabase
      .from('task_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', applyData.template_id);

    return data || [];
  },

  // Delete template
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ============================================================================
// TASK STATISTICS & ANALYTICS
// ============================================================================

export const taskAnalyticsService = {
  // Get user task statistics
  async getUserTaskStatistics(userId: string): Promise<UserTaskStatistics> {
    const { data, error } = await supabase
      .rpc('get_user_task_statistics', { user_id: userId });

    if (error) throw error;
    return data;
  },

  // Get team/organization task statistics
  async getTeamTaskStatistics(): Promise<TaskStatistics> {
    const { data, error } = await supabase
      .rpc('get_team_task_statistics');

    if (error) throw error;
    return data;
  },

  // Get task completion trends
  async getTaskCompletionTrends(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<Array<{ date: string; completed: number; created: number }>> {
    const { data, error } = await supabase
      .rpc('get_task_completion_trends', {
        start_date: startDate,
        end_date: endDate,
        user_id: userId
      });

    if (error) throw error;
    return data || [];
  }
};

// ============================================================================
// TIME TRACKING
// ============================================================================

export const timeTrackingService = {
  // Start time tracking for task
  async startTimer(taskId: string, description?: string): Promise<TimeEntry> {
    const { data, error } = await supabase
      .from('time_entries')
      .insert([{
        task_id: taskId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        start_time: new Date().toISOString(),
        description
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Stop time tracking
  async stopTimer(entryId: string): Promise<TimeEntry> {
    const endTime = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('time_entries')
      .update({
        end_time: endTime,
        updated_at: endTime
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;

    // Calculate duration and update
    const startTime = new Date(data.start_time);
    const duration = Math.round((new Date(endTime).getTime() - startTime.getTime()) / 1000 / 60);
    
    const { data: updatedData, error: updateError } = await supabase
      .from('time_entries')
      .update({ duration_minutes: duration })
      .eq('id', entryId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedData;
  },

  // Get time entries for task
  async getTaskTimeEntries(taskId: string): Promise<TimeEntry[]> {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('task_id', taskId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// ============================================================================
// CALENDAR INTEGRATION
// ============================================================================

export const taskCalendarService = {
  // Get tasks as calendar events
  async getTaskCalendarEvents(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<TaskCalendarEvent[]> {
    let query = supabase
      .from('tasks')
      .select(`
        id, title, due_date, priority, status,
        assignee:assignee_id(name)
      `)
      .not('due_date', 'is', null)
      .gte('due_date', startDate)
      .lte('due_date', endDate);

    if (userId) {
      query = query.or(`assignee_id.eq.${userId},creator_id.eq.${userId}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(task => ({
      id: `task-${task.id}`,
      task_id: task.id,
      title: task.title,
      start: task.due_date!,
      all_day: true,
      color: getPriorityColor(task.priority),
      priority: task.priority,
      status: task.status,
      assignee_name: task.assignee?.name
    }));
  }
};

// Helper function for priority colors
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
    default: return '#6b7280';
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export const taskSubscriptionService = {
  // Subscribe to task changes
  subscribeToTaskChanges(
    callback: (payload: any) => void,
    filters?: { task_id?: string; user_id?: string }
  ) {
    let channel = supabase
      .channel('task-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          ...(filters?.task_id && { filter: `id=eq.${filters.task_id}` })
        }, 
        callback
      );

    if (filters?.user_id) {
      channel = channel.on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assignee_id=eq.${filters.user_id}`
        },
        callback
      );
    }

    return channel.subscribe();
  },

  // Subscribe to task comments
  subscribeToTaskComments(taskId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`task-comments-${taskId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`
        },
        callback
      )
      .subscribe();
  }
};

export default taskService;