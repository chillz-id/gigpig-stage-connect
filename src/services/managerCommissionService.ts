/**
 * Manager Commission Service
 *
 * Manages commission rates for comedian-manager relationships.
 * Handles commission tracking, calculation, and manager earnings from deals.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ManagerCommission {
  id: string;
  manager_id: string;
  comedian_id: string;
  commission_percentage: number;
  commission_notes?: string;
  default_commission: boolean;
  is_active: boolean;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ManagerCommissionWithDetails extends ManagerCommission {
  manager?: {
    id: string;
    name: string;
    avatar_url?: string;
    email?: string;
  };
  comedian?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface ManagerEarnings {
  deal_id: string;
  participant_id: string;
  comedian_name: string;
  calculated_amount: number;
  commission_percentage: number;
  commission_amount: number;
}

export interface UpdateCommissionInput {
  commission_percentage: number;
  commission_notes?: string;
  default_commission?: boolean;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get active manager commission for a comedian
 * Uses PostgreSQL function for accurate current rate
 */
export async function getManagerCommission(comedianId: string): Promise<ManagerCommissionWithDetails | null> {
  const { data, error } = await supabase
    .rpc('get_comedian_manager_commission', { p_comedian_id: comedianId })
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No manager found
    console.error('Error fetching manager commission:', error);
    throw error;
  }

  if (!data) return null;

  // Fetch full details
  const { data: fullDetails, error: detailsError } = await supabase
    .from('comedian_managers')
    .select(`
      *,
      manager:profiles!manager_id (
        id,
        name,
        avatar_url,
        email
      ),
      comedian:profiles!comedian_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq('id', data.id)
    .single();

  if (detailsError) {
    console.error('Error fetching commission details:', detailsError);
    throw detailsError;
  }

  return fullDetails as unknown as ManagerCommissionWithDetails;
}

/**
 * Get all comedians for a manager
 */
export async function getComediansByManager(managerId: string): Promise<ManagerCommissionWithDetails[]> {
  const { data, error } = await supabase
    .from('comedian_managers')
    .select(`
      *,
      manager:profiles!manager_id (
        id,
        name,
        avatar_url,
        email
      ),
      comedian:profiles!comedian_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq('manager_id', managerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching comedians by manager:', error);
    throw error;
  }

  return data as unknown as ManagerCommissionWithDetails[];
}

/**
 * Get all managers for a comedian (includes inactive)
 */
export async function getManagersByComedian(comedianId: string): Promise<ManagerCommissionWithDetails[]> {
  const { data, error } = await supabase
    .from('comedian_managers')
    .select(`
      *,
      manager:profiles!manager_id (
        id,
        name,
        avatar_url,
        email
      ),
      comedian:profiles!comedian_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq('comedian_id', comedianId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching managers by comedian:', error);
    throw error;
  }

  return data as unknown as ManagerCommissionWithDetails[];
}

// ============================================================================
// COMMISSION MANAGEMENT
// ============================================================================

/**
 * Update commission rate for a comedian-manager relationship
 */
export async function updateManagerCommission(
  managerId: string,
  comedianId: string,
  input: UpdateCommissionInput
): Promise<ManagerCommission> {
  const { data, error } = await supabase
    .from('comedian_managers')
    .update({
      commission_percentage: input.commission_percentage,
      commission_notes: input.commission_notes,
      default_commission: input.default_commission ?? false
    })
    .eq('manager_id', managerId)
    .eq('comedian_id', comedianId)
    .eq('is_active', true)
    .select()
    .single();

  if (error) {
    console.error('Error updating manager commission:', error);
    throw error;
  }

  return data as ManagerCommission;
}

/**
 * Get default commission rate for a manager
 * Returns the rate they use for new comedians
 */
export async function getDefaultCommissionRate(managerId: string): Promise<number> {
  const { data, error } = await supabase
    .from('comedian_managers')
    .select('commission_percentage')
    .eq('manager_id', managerId)
    .eq('default_commission', true)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No default set, return industry standard
      return 15.0;
    }
    console.error('Error fetching default commission rate:', error);
    throw error;
  }

  return data.commission_percentage || 15.0;
}

/**
 * Set a manager's default commission rate
 */
export async function setDefaultCommissionRate(
  managerId: string,
  commissionPercentage: number
): Promise<void> {
  // First, unset any existing defaults for this manager
  await supabase
    .from('comedian_managers')
    .update({ default_commission: false })
    .eq('manager_id', managerId);

  // Create or update the default commission record
  const { error } = await supabase
    .from('comedian_managers')
    .upsert({
      manager_id: managerId,
      comedian_id: managerId, // Self-reference for default rate
      commission_percentage: commissionPercentage,
      default_commission: true,
      is_active: true
    });

  if (error) {
    console.error('Error setting default commission rate:', error);
    throw error;
  }
}

// ============================================================================
// EARNINGS CALCULATION
// ============================================================================

/**
 * Calculate manager's earnings from a specific deal
 * Returns all comedians in the deal managed by this manager
 */
export async function calculateManagerEarnings(
  dealId: string,
  managerId: string
): Promise<ManagerEarnings[]> {
  // Get all comedian participants in the deal
  const { data: comedianParticipants, error: participantsError } = await supabase
    .from('deal_participants')
    .select(`
      id,
      participant_id,
      calculated_amount,
      participant:profiles!participant_id (
        id,
        name
      )
    `)
    .eq('deal_id', dealId)
    .eq('participant_type', 'comedian');

  if (participantsError) {
    console.error('Error fetching comedian participants:', participantsError);
    throw participantsError;
  }

  if (!comedianParticipants || comedianParticipants.length === 0) {
    return [];
  }

  // For each comedian, check if managed by this manager and calculate commission
  const earnings: ManagerEarnings[] = [];

  for (const participant of comedianParticipants) {
    const commission = await getManagerCommission(participant.participant_id);

    if (commission && commission.manager_id === managerId) {
      const calculatedAmount = participant.calculated_amount || 0;
      const commissionPercentage = commission.commission_percentage;
      const commissionAmount = Math.round((calculatedAmount * commissionPercentage / 100) * 100) / 100;

      earnings.push({
        deal_id: dealId,
        participant_id: participant.id,
        comedian_name: (participant.participant as any)?.name || 'Unknown',
        calculated_amount: calculatedAmount,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount
      });
    }
  }

  return earnings;
}

/**
 * Calculate total earnings for a manager across all deals
 */
export async function calculateTotalManagerEarnings(
  managerId: string,
  eventId?: string
): Promise<{
  total_earnings: number;
  earnings_by_deal: ManagerEarnings[];
  comedians_count: number;
}> {
  // Get all deals for the manager (optionally filtered by event)
  let query = supabase
    .from('event_deals')
    .select('id, event_id')
    .eq('status', 'settled');

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data: deals, error } = await query;

  if (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }

  if (!deals || deals.length === 0) {
    return {
      total_earnings: 0,
      earnings_by_deal: [],
      comedians_count: 0
    };
  }

  // Calculate earnings for each deal
  const allEarnings: ManagerEarnings[] = [];
  const uniqueComedians = new Set<string>();

  for (const deal of deals) {
    const dealEarnings = await calculateManagerEarnings(deal.id, managerId);
    allEarnings.push(...dealEarnings);

    dealEarnings.forEach(e => uniqueComedians.add(e.participant_id));
  }

  const totalEarnings = allEarnings.reduce((sum, e) => sum + e.commission_amount, 0);

  return {
    total_earnings: Math.round(totalEarnings * 100) / 100,
    earnings_by_deal: allEarnings,
    comedians_count: uniqueComedians.size
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get commission statistics for a manager
 */
export interface ManagerCommissionStats {
  active_comedians: number;
  total_comedians: number;
  average_commission: number;
  default_commission: number;
  commission_range: {
    min: number;
    max: number;
  };
}

export async function getManagerCommissionStats(managerId: string): Promise<ManagerCommissionStats> {
  const { data, error } = await supabase
    .from('comedian_managers')
    .select('commission_percentage, is_active, default_commission')
    .eq('manager_id', managerId)
    .neq('comedian_id', managerId); // Exclude self-reference for default rate

  if (error) {
    console.error('Error fetching manager commission stats:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return {
      active_comedians: 0,
      total_comedians: 0,
      average_commission: 15.0,
      default_commission: 15.0,
      commission_range: { min: 0, max: 0 }
    };
  }

  const activeComedians = data.filter(c => c.is_active);
  const commissions = data.map(c => c.commission_percentage);
  const defaultRate = await getDefaultCommissionRate(managerId);

  return {
    active_comedians: activeComedians.length,
    total_comedians: data.length,
    average_commission: Math.round((commissions.reduce((a, b) => a + b, 0) / commissions.length) * 100) / 100,
    default_commission: defaultRate,
    commission_range: {
      min: Math.min(...commissions),
      max: Math.max(...commissions)
    }
  };
}

/**
 * Get comedian commission stats (for comedian view)
 */
export interface ComedianCommissionInfo {
  has_manager: boolean;
  manager_name?: string;
  manager_id?: string;
  commission_percentage?: number;
  commission_notes?: string;
  started_at?: string;
}

export async function getComedianCommissionInfo(comedianId: string): Promise<ComedianCommissionInfo> {
  const commission = await getManagerCommission(comedianId);

  if (!commission) {
    return {
      has_manager: false
    };
  }

  return {
    has_manager: true,
    manager_name: commission.manager?.name,
    manager_id: commission.manager_id,
    commission_percentage: commission.commission_percentage,
    commission_notes: commission.commission_notes,
    started_at: commission.started_at
  };
}
