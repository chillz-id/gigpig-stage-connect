import { supabase } from '@/integrations/supabase/client';

export const taskSubscriptionService = {
  subscribeToTaskChanges(
    callback: (payload: any) => void,
    filters?: { task_id?: string; user_id?: string }
  ) {
    let channel = supabase
      .channel('task-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          ...(filters?.task_id && { filter: `id=eq.${filters.task_id}` })
        },
        callback
      );

    if (filters?.user_id) {
      channel = channel.on(
        'postgres_changes',
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

  subscribeToTaskComments(taskId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`task-comments-${taskId}`)
      .on(
        'postgres_changes',
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

export default taskSubscriptionService;
