import { supabase } from '@/integrations/supabase/client';
import type { TimeEntry } from '@/types/task';

async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

export const timeTrackingService = {
  async startTimer(taskId: string, description?: string): Promise<TimeEntry> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('time_entries')
      .insert([{ task_id: taskId, user_id: userId, start_time: new Date().toISOString(), description }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async stopTimer(entryId: string): Promise<TimeEntry> {
    const endTime = new Date().toISOString();

    const { data, error } = await supabase
      .from('time_entries')
      .update({ end_time: endTime, updated_at: endTime })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;

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

export default timeTrackingService;
