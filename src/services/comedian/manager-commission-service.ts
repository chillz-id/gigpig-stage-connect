import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

/**
 * Manager-Comedian relationship with commission rate
 */
export interface ManagerRelationship {
  id: string;
  comedian_id: string;
  manager_id: string;
  commission_percentage: number;
  commission_notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}

/**
 * Commission update payload
 */
export interface CommissionUpdate {
  commission_percentage: number;
  commission_notes?: string;
}

/**
 * Commission calculation result
 */
export interface CommissionCalculation {
  total_amount: number;
  commission_rate: number;
  commission_amount: number;
  comedian_net: number;
}

// Commission rate validation (0-30%)
const MIN_COMMISSION_RATE = 0;
const MAX_COMMISSION_RATE = 30;

/**
 * Validate commission rate is within acceptable range
 */
function validateCommissionRate(rate: number): void {
  if (rate < MIN_COMMISSION_RATE || rate > MAX_COMMISSION_RATE) {
    throw new Error(
      `Commission rate must be between ${MIN_COMMISSION_RATE}% and ${MAX_COMMISSION_RATE}%`
    );
  }
}

export const managerCommissionService = {
  /**
   * Get active manager relationship for a comedian
   */
  async getManagerForComedian(comedianId: string): Promise<ManagerRelationship | null> {
    const { data, error } = await supabaseClient
      .from('comedian_managers')
      .select('*')
      .eq('comedian_id', comedianId)
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data as ManagerRelationship | null;
  },

  /**
   * Get commission rate for specific manager-comedian relationship
   */
  async getManagerCommissionRate(
    managerId: string,
    comedianId: string
  ): Promise<number> {
    const { data, error } = await supabaseClient
      .from('comedian_managers')
      .select('commission_percentage')
      .eq('manager_id', managerId)
      .eq('comedian_id', comedianId)
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      throw new Error('No active manager relationship found');
    }

    return data.commission_percentage ?? 15; // Default 15%
  },

  /**
   * Get manager's default commission rate from their profile
   */
  async getDefaultCommission(managerId: string): Promise<number> {
    const { data, error } = await supabaseClient
      .from('comedy_manager_profiles')
      .select('default_commission_percentage')
      .eq('id', managerId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.default_commission_percentage ?? 15; // Default 15%
  },

  /**
   * Update commission rate for a specific relationship
   */
  async updateCommissionRate(
    relationshipId: string,
    update: CommissionUpdate
  ): Promise<void> {
    validateCommissionRate(update.commission_percentage);

    const { error } = await supabaseClient
      .from('comedian_managers')
      .update({
        commission_percentage: update.commission_percentage,
        commission_notes: update.commission_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', relationshipId);

    if (error) throw error;
  },

  /**
   * Update manager's default commission rate
   */
  async updateDefaultCommission(managerId: string, rate: number): Promise<void> {
    validateCommissionRate(rate);

    const { error } = await supabaseClient
      .from('comedy_manager_profiles')
      .update({
        default_commission_percentage: rate,
      })
      .eq('id', managerId);

    if (error) throw error;
  },

  /**
   * Calculate manager commission from total amount
   */
  async calculateManagerCut(
    amount: number,
    rate: number
  ): Promise<CommissionCalculation> {
    validateCommissionRate(rate);

    const commission_amount = Math.round(amount * (rate / 100) * 100) / 100;
    const comedian_net = Math.round((amount - commission_amount) * 100) / 100;

    return {
      total_amount: amount,
      commission_rate: rate,
      commission_amount,
      comedian_net,
    };
  },
};

export type ManagerCommissionService = typeof managerCommissionService;
