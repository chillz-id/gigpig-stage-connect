// Agency Service Layer for API operations
import { supabase } from '../integrations/supabase/client';
import type {
  Agency,
  ManagerProfile,
  ArtistManagement,
  DealNegotiation,
  DealMessage,
  AgencyAnalytics,
  AgencyDashboardData,
  CreateAgencyRequest,
  CreateManagerProfileRequest,
  CreateArtistManagementRequest,
  CreateDealNegotiationRequest,
  UpdateDealStatusRequest,
  SendDealMessageRequest,
  AgencyFilters,
  DealFilters,
  ArtistManagementFilters,
  PaginationParams,
  PaginatedResponse,
  NegotiationStrategy
} from '../types/agency';

// Agency CRUD Operations
export const agencyService = {
  // Get all agencies with filters
  async getAgencies(
    filters: AgencyFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Agency>> {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('agencies')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.agency_type?.length) {
      query = query.in('agency_type', filters.agency_type);
    }
    if (filters.specialties?.length) {
      query = query.overlaps('specialties', filters.specialties);
    }
    if (filters.location) {
      query = query.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%`);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply sorting and pagination
    query = query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: offset + limit < (count || 0),
        has_prev: page > 1
      }
    };
  },

  // Get agency by ID
  async getAgency(id: string): Promise<Agency> {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new agency
  async createAgency(agencyData: CreateAgencyRequest): Promise<Agency> {
    const { data, error } = await supabase
      .from('agencies')
      .insert([agencyData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update agency
  async updateAgency(id: string, updates: Partial<Agency>): Promise<Agency> {
    const { data, error } = await supabase
      .from('agencies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete agency
  async deleteAgency(id: string): Promise<void> {
    const { error } = await supabase
      .from('agencies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get agencies for current user
  async getUserAgencies(): Promise<Agency[]> {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// Manager Profile Operations
export const managerService = {
  // Get managers for agency
  async getAgencyManagers(agencyId: string): Promise<ManagerProfile[]> {
    const { data, error } = await supabase
      .from('manager_profiles')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get manager profile
  async getManagerProfile(id: string): Promise<ManagerProfile> {
    const { data, error } = await supabase
      .from('manager_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create manager profile
  async createManagerProfile(profileData: CreateManagerProfileRequest): Promise<ManagerProfile> {
    const { data, error } = await supabase
      .from('manager_profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update manager profile
  async updateManagerProfile(id: string, updates: Partial<ManagerProfile>): Promise<ManagerProfile> {
    const { data, error } = await supabase
      .from('manager_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get current user manager profile
  async getCurrentUserManagerProfile(): Promise<ManagerProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('manager_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }
};

// Artist Management Operations
export const artistManagementService = {
  // Get artists for agency
  async getAgencyArtists(
    agencyId: string,
    filters: ArtistManagementFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<ArtistManagement>> {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('artist_management')
      .select(`
        *,
        artist:profiles!artist_id(id, stage_name, name, avatar_url, location, bio),
        manager:manager_profiles!manager_id(id, first_name, last_name, title)
      `, { count: 'exact' })
      .eq('agency_id', agencyId);

    // Apply filters
    if (filters.relationship_status?.length) {
      query = query.in('relationship_status', filters.relationship_status);
    }
    if (filters.manager_id) {
      query = query.eq('manager_id', filters.manager_id);
    }
    if (filters.priority_level?.length) {
      query = query.in('priority_level', filters.priority_level);
    }
    if (filters.search) {
      // Note: This would need to be a more complex query in real implementation
      // as we're searching across related tables
    }

    // Apply sorting and pagination
    query = query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: offset + limit < (count || 0),
        has_prev: page > 1
      }
    };
  },

  // Create artist management relationship
  async createArtistManagement(managementData: CreateArtistManagementRequest): Promise<ArtistManagement> {
    const { data, error } = await supabase
      .from('artist_management')
      .insert([managementData])
      .select(`
        *,
        artist:profiles!artist_id(id, stage_name, name, avatar_url, location, bio),
        manager:manager_profiles!manager_id(id, first_name, last_name, title)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Update artist management
  async updateArtistManagement(id: string, updates: Partial<ArtistManagement>): Promise<ArtistManagement> {
    const { data, error } = await supabase
      .from('artist_management')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        artist:profiles!artist_id(id, stage_name, name, avatar_url, location, bio),
        manager:manager_profiles!manager_id(id, first_name, last_name, title)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Get artist management by ID
  async getArtistManagement(id: string): Promise<ArtistManagement> {
    const { data, error } = await supabase
      .from('artist_management')
      .select(`
        *,
        artist:profiles!artist_id(id, stage_name, name, avatar_url, location, bio),
        manager:manager_profiles!manager_id(id, first_name, last_name, title)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
};

// Deal Negotiation Operations
export const dealService = {
  // Get deals with filters
  async getDeals(
    filters: DealFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<DealNegotiation>> {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('deal_negotiations')
      .select(`
        *,
        artist:profiles!artist_id(id, stage_name, name, avatar_url),
        promoter:profiles!promoter_id(id, name, stage_name),
        event:events!event_id(id, title, event_date, venue),
        agency:agencies!agency_id(id, name),
        manager:manager_profiles!manager_id(id, first_name, last_name, title)
      `, { count: 'exact' });

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.deal_type?.length) {
      query = query.in('deal_type', filters.deal_type);
    }
    if (filters.artist_id) {
      query = query.eq('artist_id', filters.artist_id);
    }
    if (filters.agency_id) {
      query = query.eq('agency_id', filters.agency_id);
    }
    if (filters.promoter_id) {
      query = query.eq('promoter_id', filters.promoter_id);
    }
    if (filters.date_from) {
      query = query.gte('performance_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('performance_date', filters.date_to);
    }
    if (filters.min_fee) {
      query = query.gte('proposed_fee', filters.min_fee);
    }
    if (filters.max_fee) {
      query = query.lte('proposed_fee', filters.max_fee);
    }
    if (filters.priority_level?.length) {
      query = query.in('priority_level', filters.priority_level);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply sorting and pagination
    query = query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: offset + limit < (count || 0),
        has_prev: page > 1
      }
    };
  },

  // Get deal by ID
  async getDeal(id: string): Promise<DealNegotiation> {
    const { data, error } = await supabase
      .from('deal_negotiations')
      .select(`
        *,
        artist:profiles!artist_id(id, stage_name, name, avatar_url),
        promoter:profiles!promoter_id(id, name, stage_name),
        event:events!event_id(id, title, event_date, venue),
        agency:agencies!agency_id(id, name),
        manager:manager_profiles!manager_id(id, first_name, last_name, title)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create deal negotiation
  async createDeal(dealData: CreateDealNegotiationRequest): Promise<DealNegotiation> {
    const { data, error } = await supabase
      .from('deal_negotiations')
      .insert([dealData])
      .select(`
        *,
        artist:profiles!artist_id(id, stage_name, name, avatar_url),
        promoter:profiles!promoter_id(id, name, stage_name),
        event:events!event_id(id, title, event_date, venue),
        agency:agencies!agency_id(id, name),
        manager:manager_profiles!manager_id(id, first_name, last_name, title)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Update deal status
  async updateDealStatus(id: string, statusUpdate: UpdateDealStatusRequest): Promise<DealNegotiation> {
    const { data, error } = await supabase
      .from('deal_negotiations')
      .update(statusUpdate)
      .eq('id', id)
      .select(`
        *,
        artist:profiles!artist_id(id, stage_name, name, avatar_url),
        promoter:profiles!promoter_id(id, name, stage_name),
        event:events!event_id(id, title, event_date, venue),
        agency:agencies!agency_id(id, name),
        manager:manager_profiles!manager_id(id, first_name, last_name, title)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Calculate negotiation strategy
  async calculateNegotiationStrategy(dealId: string, marketData?: Record<string, any>): Promise<NegotiationStrategy> {
    const { data, error } = await supabase.rpc('calculate_negotiation_strategy', {
      _deal_id: dealId,
      _market_data: marketData || {}
    });

    if (error) throw error;
    return data;
  },

  // Process automated response
  async processAutomatedResponse(dealId: string, offerAmount: number, responderId: string): Promise<any> {
    const { data, error } = await supabase.rpc('process_automated_deal_response', {
      _deal_id: dealId,
      _new_offer_amount: offerAmount,
      _responder_id: responderId
    });

    if (error) throw error;
    return data;
  }
};

// Deal Messages Operations
export const dealMessagesService = {
  // Get messages for deal
  async getDealMessages(dealId: string): Promise<DealMessage[]> {
    const { data, error } = await supabase
      .from('deal_messages')
      .select(`
        *,
        sender:profiles!sender_id(id, name, stage_name, avatar_url)
      `)
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Send message
  async sendMessage(messageData: SendDealMessageRequest): Promise<DealMessage> {
    const { data, error } = await supabase
      .from('deal_messages')
      .insert([messageData])
      .select(`
        *,
        sender:profiles!sender_id(id, name, stage_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Mark message as read
  async markMessageAsRead(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('deal_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;
  }
};

// Analytics Operations
export const analyticsService = {
  // Get agency analytics
  async getAgencyAnalytics(
    agencyId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<AgencyAnalytics> {
    const { data, error } = await supabase
      .from('agency_analytics')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('period_start', periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .eq('period_end', periodEnd || new Date().toISOString().split('T')[0])
      .single();

    if (error) throw error;
    return data;
  },

  // Update agency analytics
  async updateAgencyAnalytics(
    agencyId: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<AgencyAnalytics> {
    const { data, error } = await supabase.rpc('update_agency_analytics', {
      _agency_id: agencyId,
      _period_start: periodStart,
      _period_end: periodEnd
    });

    if (error) throw error;
    return data;
  },

  // Get dashboard data
  async getDashboardData(agencyId: string, managerId?: string): Promise<AgencyDashboardData> {
    const { data, error } = await supabase.rpc('get_agency_dashboard_data', {
      _agency_id: agencyId,
      _manager_id: managerId
    });

    if (error) throw error;
    return data;
  }
};

