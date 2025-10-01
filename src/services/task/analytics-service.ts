import { supabase } from '@/integrations/supabase/client';
import type { UserTaskStatistics, TaskStatistics } from '@/types/task';

export const taskAnalyticsService = {
  async getUserTaskStatistics(userId: string): Promise<UserTaskStatistics> {
    const { data, error } = await supabase.rpc('get_user_task_statistics', { user_id: userId });
    if (error) throw error;
    return data;
  },

  async getTeamTaskStatistics(): Promise<TaskStatistics> {
    const { data, error } = await supabase.rpc('get_team_task_statistics');
    if (error) throw error;
    return data;
  },

  async getTaskCompletionTrends(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<Array<{ date: string; completed: number; created: number }>> {
    const { data, error } = await supabase.rpc('get_task_completion_trends', {
      start_date: startDate,
      end_date: endDate,
      user_id: userId
    });

    if (error) throw error;
    return data || [];
  }
};

export default taskAnalyticsService;
