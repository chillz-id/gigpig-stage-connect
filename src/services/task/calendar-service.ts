import { supabase } from '@/integrations/supabase/client';
import type { TaskCalendarEvent } from '@/types/task';
import { getPriorityColor } from './priority-color';

export const taskCalendarService = {
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

export default taskCalendarService;
