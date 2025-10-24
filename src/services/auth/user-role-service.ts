import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export const userRoleService = {
  async listByUser(userId: string) {
    const { data, error } = await supabaseClient
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return (data as Array<{ user_id: string; role: string }> | null) ?? [];
  },

  async addRole(userId: string, role: string) {
    const { error } = await supabaseClient
      .from('user_roles')
      .insert({ user_id: userId, role });

    if (error) {
      const message: string = error.message ?? '';
      if (!message.includes('duplicate key') && error.code !== '23505') {
        throw error;
      }
    }
  },

  async addRoles(userId: string, roles: string[]) {
    for (const role of roles) {
      await this.addRole(userId, role);
    }
  },
};

export type UserRoleService = typeof userRoleService;
