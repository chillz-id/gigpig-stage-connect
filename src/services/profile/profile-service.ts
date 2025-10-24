import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface ProfileRecord {
  id: string;
  email?: string | null;
  name?: string | null;
  profile_slug?: string | null;
  [key: string]: any;
}

export const profileService = {
  async getProfileById(userId: string): Promise<ProfileRecord | null> {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        email,
        name,
        first_name,
        last_name,
        stage_name,
        name_display_preference,
        bio,
        location,
        avatar_url,
        is_verified,
        created_at,
        updated_at,
        phone,
        website_url,
        instagram_url,
        twitter_url,
        youtube_url,
        facebook_url,
        tiktok_url,
        show_contact_in_epk,
        custom_show_types,
        profile_slug
      `)
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return data as ProfileRecord;
    }

    const { data: fallback, error: fallbackError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .limit(1);

    if (fallbackError) throw fallbackError;
    return (fallback as ProfileRecord[] | null)?.[0] ?? null;
  },

  async createProfile(profile: ProfileRecord) {
    const { error } = await supabaseClient
      .from('profiles')
      .insert(profile);

    if (error) throw error;
  },

  async updateProfile(userId: string, updates: Record<string, any>) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseClient
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) throw error;
  },

  async updateProfileSlug(userId: string, slug: string) {
    await this.updateProfile(userId, { profile_slug: slug });
  },

  async isSlugAvailable(slug: string, excludeUserId?: string): Promise<boolean> {
    const query = supabaseClient
      .from('profiles')
      .select('id')
      .eq('profile_slug', slug)
      .limit(1);

    if (excludeUserId) {
      query.neq('id', excludeUserId);
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !data;
  },

  async generateUniqueSlug(name: string, excludeUserId?: string): Promise<string> {
    const baseName = name.trim() || 'user';
    const baseSlug = baseName
      .toLowerCase()
      .replace(/[^a-z0-9\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() || 'user';

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query = supabaseClient
        .from('profiles')
        .select('id')
        .eq('profile_slug', slug)
        .limit(1)
        .maybeSingle();

      const { data, error } = await query;

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data || data.id === excludeUserId) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
  },

  async listInterests(userId: string) {
    const { data, error } = await supabaseClient
      .from('user_interests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
};

export type ProfileService = typeof profileService;
