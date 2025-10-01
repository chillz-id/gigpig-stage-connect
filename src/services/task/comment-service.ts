import { supabase } from '@/integrations/supabase/client';
import type { TaskComment } from '@/types/task';

async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

export const taskCommentService = {
  async addComment(
    taskId: string,
    content: string,
    attachments: any[] = []
  ): Promise<TaskComment> {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('task_comments')
      .insert([{ task_id: taskId, content, attachments, user_id: userId }])
      .select(`
        *,
        user:user_id(id, name, email, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  },

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

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export default taskCommentService;
