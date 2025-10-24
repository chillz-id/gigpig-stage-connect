import { supabase } from '@/integrations/supabase/client';
import type {
  PhotographerProfile,
  PhotographerFilters,
  PhotographerAvailability,
  PortfolioItem,
  PhotographerVouchStats,
  PhotographerVouch,
} from '@/types/photographer';

const supabaseClient = supabase as any;

export type PhotographerWithStats = PhotographerProfile & {
  vouch_stats: PhotographerVouchStats;
};

const defaultVouchStats = (photographerId: string): PhotographerVouchStats => ({
  photographer_id: photographerId,
  total_vouches: 0,
  unique_vouchers: 0,
  average_rating: 0,
  recent_vouches: 0,
});

const applyFilters = (
  filters: PhotographerFilters | undefined,
  baseQuery: any
) => {
  let query = baseQuery.in('role', ['photographer', 'videographer']);

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(`name.ilike.${searchTerm},stage_name.ilike.${searchTerm}`);
  }

  if (filters?.available_for_events !== undefined) {
    query = query.eq(
      'photographer_profile.available_for_events',
      filters.available_for_events
    );
  }

  if (filters?.max_rate) {
    query = query.or(
      `photographer_profile.rate_per_hour.lte.${filters.max_rate},photographer_profile.rate_per_event.lte.${filters.max_rate}`
    );
  }

  switch (filters?.sortBy) {
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'experience':
      query = query.order('photographer_profile.experience_years', {
        ascending: false,
      });
      break;
    case 'rate':
      query = query.order('photographer_profile.rate_per_hour', {
        ascending: true,
      });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  return query;
};

const attachVouchStats = async (
  photographers: any[]
): Promise<PhotographerWithStats[]> => {
  if (!photographers.length) return [];

  const ids = photographers.map((profile) => profile.id);
  const { data: vouchStats, error: statsError } = await supabaseClient
    .from('photographer_vouch_stats')
    .select('*')
    .in('photographer_id', ids);

  if (statsError) {
    console.error('Failed to load photographer vouch stats:', statsError);
    return photographers.map((profile) => ({
      ...(profile as PhotographerProfile),
      vouch_stats: defaultVouchStats(profile.id),
    }));
  }

  const statsMap = new Map(
    (vouchStats ?? []).map((stat: PhotographerVouchStats) => [
      stat.photographer_id,
      stat,
    ])
  );

  return photographers.map((profile) => ({
    ...(profile as PhotographerProfile),
    vouch_stats: statsMap.get(profile.id) ?? defaultVouchStats(profile.id),
  }));
};

export const photographerService = {
  async list(filters?: PhotographerFilters): Promise<PhotographerWithStats[]> {
    const baseQuery = supabaseClient
      .from('profiles')
      .select(
        `
          *,
          photographer_profile:photographer_profiles!id(*)
        `
      );

    const query = applyFilters(filters, baseQuery);
    const { data, error } = await query;
    if (error) throw error;

    let photographers = (data ?? []) as any[];

    if (filters?.specialties?.length) {
      photographers = photographers.filter((photographer) =>
        photographer.photographer_profile?.specialties?.some(
          (specialty: string) => filters.specialties?.includes(specialty)
        )
      );
    }

    if (filters?.services?.length) {
      photographers = photographers.filter((photographer) =>
        photographer.photographer_profile?.services_offered?.some(
          (service: string) => filters.services?.includes(service)
        )
      );
    }

    const withStats = await attachVouchStats(photographers);

    if (filters?.sortBy === 'vouches') {
      withStats.sort(
        (a, b) => b.vouch_stats.total_vouches - a.vouch_stats.total_vouches
      );
    }

    return withStats;
  },

  async getById(photographerId: string): Promise<PhotographerWithStats | null> {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select(
        `
          *,
          photographer_profile:photographer_profiles!id(*),
          portfolio:photographer_portfolio!photographer_id(*)
        `
      )
      .eq('id', photographerId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    const stats = await photographerService.getVouchStats(photographerId);

    return {
      ...(data as PhotographerProfile),
      vouch_stats: stats ?? defaultVouchStats(photographerId),
    };
  },

  async listAvailability(
    photographerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<PhotographerAvailability[]> {
    let query = supabaseClient
      .from('photographer_availability')
      .select('*')
      .eq('photographer_id', photographerId);

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as PhotographerAvailability[];
  },

  async upsertProfile(
    updates: Partial<PhotographerProfile['photographer_profile']> & {
      id: string;
    }
  ) {
    const { id, ...profileData } = updates;

    const { data, error } = await supabaseClient
      .from('photographer_profiles')
      .upsert({
        id,
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async listPortfolio(photographerId: string): Promise<PortfolioItem[]> {
    const { data, error } = await supabaseClient
      .from('photographer_portfolio')
      .select('*')
      .eq('photographer_id', photographerId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data ?? []) as PortfolioItem[];
  },

  async addPortfolioItem(
    item: Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PortfolioItem> {
    const { data, error } = await supabaseClient
      .from('photographer_portfolio')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as PortfolioItem;
  },

  async deletePortfolioItem(id: string): Promise<void> {
    const { error } = await supabaseClient
      .from('photographer_portfolio')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async listVouches(photographerId: string): Promise<PhotographerVouch[]> {
    const { data, error } = await supabaseClient.rpc(
      'get_photographer_vouches',
      { photographer_id: photographerId }
    );

    if (error) throw error;
    return (data ?? []) as PhotographerVouch[];
  },

  async getVouchStats(
    photographerId: string
  ): Promise<PhotographerVouchStats | null> {
    const { data, error } = await supabaseClient
      .from('photographer_vouch_stats')
      .select('*')
      .eq('photographer_id', photographerId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return data as PhotographerVouchStats;
  },
};

