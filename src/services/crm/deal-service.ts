import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import type { DealStatsSummary } from '@/types/crm';

const supabaseClient = supabase as any;

export type DealStatus =
  | 'proposed'
  | 'negotiating'
  | 'counter_offered'
  | 'accepted'
  | 'declined'
  | 'expired';

export type DealType = 'booking' | 'performance' | 'collaboration' | 'sponsorship';

export type NegotiationStage =
  | 'initial'
  | 'negotiating'
  | 'counter_offer'
  | 'final_offer'
  | 'accepted'
  | 'declined';

export interface Deal {
  id: string;
  deal_type: DealType;
  status: DealStatus;
  negotiation_stage: NegotiationStage;
  agency_id: string | null;
  artist_id: string | null;
  promoter_id: string | null;
  manager_id: string | null;
  event_id: string | null;
  title: string;
  description: string | null;
  proposed_fee: number | null;
  minimum_fee: number | null;
  maximum_fee: number | null;
  currency: string | null;
  commission_rate: number | null;
  performance_date: string | null;
  performance_duration: number | null;
  technical_requirements: string | null;
  offers: unknown;
  counter_offers: unknown;
  negotiation_notes: string | null;
  terms_and_conditions: string | null;
  special_requirements: string | null;
  cancellation_policy: string | null;
  negotiation_strategy: unknown;
  automated_responses: boolean | null;
  auto_accept_threshold: number | null;
  auto_decline_threshold: number | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  artist?: {
    id: string;
    stage_name: string;
    first_name: string;
    last_name: string;
  };
  promoter?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  event?: {
    id: string;
    title: string;
    date: string;
  };
}

export interface DealFilters {
  status?: DealStatus;
  dealType?: DealType;
  agencyId?: string;
  artistId?: string;
  promoterId?: string;
  dateFrom?: string;
  dateTo?: string;
}

const DEAL_SELECT = `
  *,
  artist:profiles!artist_id(id, stage_name, first_name, last_name),
  promoter:profiles!promoter_id(id, first_name, last_name, email),
  event:events(id, title, date)
`;

const buildBaseQuery = () => {
  return supabaseClient
    .from('deal_negotiations')
    .select(DEAL_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false });
};

const applyFilters = (query: any, filters: DealFilters | undefined) => {
  if (!filters) return query;

  let filteredQuery = query;

  if (filters.status) {
    filteredQuery = filteredQuery.eq('status', filters.status);
  }

  if (filters.dealType) {
    filteredQuery = filteredQuery.eq('deal_type', filters.dealType);
  }

  if (filters.agencyId) {
    filteredQuery = filteredQuery.eq('agency_id', filters.agencyId);
  }

  if (filters.artistId) {
    filteredQuery = filteredQuery.eq('artist_id', filters.artistId);
  }

  if (filters.promoterId) {
    filteredQuery = filteredQuery.eq('promoter_id', filters.promoterId);
  }

  if (filters.dateFrom) {
    filteredQuery = filteredQuery.gte('performance_date', filters.dateFrom);
  }

  if (filters.dateTo) {
    filteredQuery = filteredQuery.lte('performance_date', filters.dateTo);
  }

  return filteredQuery;
};

const groupDealsByStatus = (deals: Deal[]) => {
  const grouped: Record<DealStatus, Deal[]> = {
    proposed: [],
    negotiating: [],
    counter_offered: [],
    accepted: [],
    declined: [],
    expired: [],
  };

  deals.forEach((deal) => {
    if (grouped[deal.status]) {
      grouped[deal.status].push(deal);
    }
  });

  return grouped;
};

export const dealService = {
  async list(filters?: DealFilters, limit: number = 100) {
    const sanitizedLimit = Math.max(limit, 1);
    const query = applyFilters(buildBaseQuery(), filters).limit(sanitizedLimit);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      deals: (data || []) as Deal[],
      totalCount: count ?? data?.length ?? 0,
    };
  },

  async listByStatus(filters?: Omit<DealFilters, 'status'>) {
    const query = applyFilters(
      supabaseClient
        .from('deal_negotiations')
        .select(DEAL_SELECT)
        .order('created_at', { ascending: false }),
      filters
    );

    const { data, error } = await query;

    if (error) throw error;

    return groupDealsByStatus(((data || []) as Deal[]).slice());
  },

  async getById(dealId: string) {
    const { data, error } = await supabaseClient
      .from('deal_negotiations')
      .select(
        `
          *,
          artist:profiles!artist_id(id, stage_name, first_name, last_name, email, phone),
          promoter:profiles!promoter_id(id, first_name, last_name, email, phone),
          manager:profiles!manager_id(id, first_name, last_name, email, phone),
          event:events(id, title, date, venue_name)
        `
      )
      .eq('id', dealId)
      .single();

    if (error) throw error;

    return data as Deal;
  },

  async updateStatus(dealId: string, status: DealStatus) {
    const { data, error } = await supabaseClient
      .from('deal_negotiations')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId)
      .select()
      .single();

    if (error) throw error;

    return data as Deal;
  },

  async update(dealId: string, updates: Partial<Deal>) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseClient
      .from('deal_negotiations')
      .update(payload)
      .eq('id', dealId)
      .select()
      .single();

    if (error) throw error;

    return data as Deal;
  },

  async create(newDeal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseClient
      .from('deal_negotiations')
      .insert({
        ...newDeal,
        status: newDeal.status || 'proposed',
        negotiation_stage: newDeal.negotiation_stage || 'initial',
      })
      .select()
      .single();

    if (error) throw error;

    return data as Deal;
  },

  async delete(dealId: string) {
    const { error } = await supabaseClient.from('deal_negotiations').delete().eq('id', dealId);

    if (error) throw error;

    return dealId;
  },

  async getStats(): Promise<DealStatsSummary> {
    const { data, error } = await supabaseClient
      .from('deal_negotiations')
      .select('status, proposed_fee');

    if (error) throw error;

    const rows =
      (data as Array<{ status: DealStatus; proposed_fee: number | null }> | null | undefined) || [];

    const stats: DealStatsSummary = {
      total: rows.length,
      byStatus: {
        proposed: 0,
        negotiating: 0,
        counter_offered: 0,
        accepted: 0,
        declined: 0,
        expired: 0,
      },
      totalValue: 0,
      acceptedValue: 0,
    };

    rows.forEach((deal) => {
      const status = deal.status;

      if (stats.byStatus[status] !== undefined) {
        stats.byStatus[status]++;
      }

      if (deal.proposed_fee) {
        const feeValue = Number(deal.proposed_fee);
        stats.totalValue += feeValue;

        if (status === 'accepted') {
          stats.acceptedValue += feeValue;
        }
      }
    });

    return stats;
  },
};

export type DealStats = DealStatsSummary;
export type DealServiceError = PostgrestError;
