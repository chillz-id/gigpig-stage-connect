import { supabase } from '@/integrations/supabase/client';
import type {
  Vouch,
  VouchFormData,
  VouchStats,
  VouchWithProfiles,
  UserSearchResult,
} from '@/types/vouch';

const supabaseClient = supabase as any;

const VOUCH_SELECT = `
  *,
  voucher_profile:voucher_id(id, name, stage_name, avatar_url),
  vouchee_profile:vouchee_id(id, name, stage_name, avatar_url)
`;

const mapUserSearchResult = (profile: any): UserSearchResult => ({
  id: profile.id as string,
  name: (profile.name as string) ?? '',
  stage_name: profile.stage_name ?? undefined,
  avatar_url: profile.avatar_url ?? undefined,
  roles: Array.isArray(profile.user_roles)
    ? profile.user_roles.map((role: { role: string }) => role.role)
    : [],
});

export const vouchService = {
  async listForUser(userId: string): Promise<VouchWithProfiles[]> {
    const { data, error } = await supabaseClient
      .from('vouches')
      .select(VOUCH_SELECT)
      .or(`voucher_id.eq.${userId},vouchee_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as VouchWithProfiles[];
  },

  async getStats(userId: string): Promise<VouchStats | null> {
    const { data, error } = await supabaseClient.rpc('get_vouch_stats', {
      user_id_param: userId,
    });

    if (error) throw error;
    const [stats] = (data ?? []) as VouchStats[];
    return stats ?? null;
  },

  async searchUsers(
    query: string,
    excludeUserId: string
  ): Promise<UserSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const { data, error } = await supabaseClient
      .from('profiles')
      .select(
        `
          id,
          name,
          stage_name,
          avatar_url,
          user_roles!inner(role)
        `
      )
      .neq('id', excludeUserId)
      .or(`name.ilike.%${trimmed}%,stage_name.ilike.%${trimmed}%`)
      .limit(10);

    if (error) throw error;
    return (data ?? []).map(mapUserSearchResult);
  },

  async getExistingVouch(
    giverId: string,
    receiverId: string
  ): Promise<Vouch | null> {
    const { data, error } = await supabaseClient.rpc('get_existing_vouch', {
      giver_id: giverId,
      receiver_id: receiverId,
    });

    if (error) throw error;
    const [existing] = (data ?? []) as Vouch[];
    return existing ?? null;
  },

  async create(
    giverId: string,
    formData: VouchFormData
  ): Promise<VouchWithProfiles> {
    const payload = {
      voucher_id: giverId,
      vouchee_id: formData.vouchee_id,
      message: formData.message,
      rating: formData.rating ?? null,
    };

    const { data, error } = await supabaseClient
      .from('vouches')
      .insert(payload)
      .select(VOUCH_SELECT)
      .single();

    if (error) throw error;
    return data as VouchWithProfiles;
  },

  async update(
    vouchId: string,
    giverId: string,
    updates: Partial<VouchFormData>
  ): Promise<VouchWithProfiles> {
    const payload: Record<string, unknown> = {};
    if (updates.message !== undefined) payload.message = updates.message;
    if (updates.rating !== undefined) payload.rating = updates.rating;

    const { data, error } = await supabaseClient
      .from('vouches')
      .update(payload)
      .eq('id', vouchId)
      .eq('voucher_id', giverId)
      .select(VOUCH_SELECT)
      .single();

    if (error) throw error;
    return data as VouchWithProfiles;
  },

  async remove(vouchId: string, giverId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('vouches')
      .delete()
      .eq('id', vouchId)
      .eq('voucher_id', giverId);

    if (error) throw error;
  },
};

export type VouchService = typeof vouchService;
