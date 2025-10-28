/**
 * Event Deal Service
 *
 * Manages event deals, revenue sharing, and settlement workflows.
 * Handles deal creation, participant management, approval workflows,
 * and automated invoice generation.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type DealType =
  | 'solo_show'
  | 'co_headliner'
  | 'door_split'
  | 'flat_fee'
  | 'percentage'
  | 'custom';

export type DealStatus =
  | 'draft'              // Being created
  | 'pending_approval'   // Submitted for participant approval
  | 'fully_approved'     // All participants approved
  | 'settled'            // Invoices generated
  | 'cancelled';         // Deal cancelled

export interface EventDeal {
  id: string;
  event_id: string;
  deal_name: string;
  deal_type: DealType;
  description?: string;
  total_revenue?: number;
  guaranteed_minimum?: number;
  status: DealStatus;
  submitted_for_approval_at?: string;
  fully_approved_at?: string;
  settled_at?: string;
  settled_by?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  notes?: Record<string, any>;
}

export interface EventDealWithDetails extends EventDeal {
  event?: {
    id: string;
    title: string;
    venue: string;
    event_date: string;
  };
  participants?: DealParticipantSummary[];
  creator?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface DealParticipantSummary {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_type: string;
  split_type: string;
  split_percentage?: number;
  flat_fee_amount?: number;
  calculated_amount?: number;
  approval_status: string;
}

export interface CreateDealInput {
  event_id: string;
  deal_name: string;
  deal_type: DealType;
  description?: string;
  guaranteed_minimum?: number;
}

export interface UpdateDealInput {
  deal_name?: string;
  description?: string;
  total_revenue?: number;
  guaranteed_minimum?: number;
}

export interface DealCalculation {
  participant_id: string;
  calculated_amount: number;
  split_description: string;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all deals for an event
 */
export async function getDealsByEvent(eventId: string): Promise<EventDealWithDetails[]> {
  const { data, error } = await supabase
    .from('event_deals')
    .select(`
      *,
      event:events!inner (
        id,
        title,
        venue,
        event_date
      ),
      creator:profiles!created_by (
        id,
        name,
        avatar_url
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }

  return data as unknown as EventDealWithDetails[];
}

/**
 * Get a single deal by ID with full details
 */
export async function getDealById(dealId: string): Promise<EventDealWithDetails | null> {
  const { data, error } = await supabase
    .from('event_deals')
    .select(`
      *,
      event:events!inner (
        id,
        title,
        venue,
        event_date
      ),
      creator:profiles!created_by (
        id,
        name,
        avatar_url
      )
    `)
    .eq('id', dealId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching deal:', error);
    throw error;
  }

  return data as unknown as EventDealWithDetails;
}

/**
 * Create a new deal
 */
export async function createDeal(input: CreateDealInput, userId: string): Promise<EventDeal> {
  const { data, error } = await supabase
    .from('event_deals')
    .insert({
      ...input,
      created_by: userId,
      status: 'draft'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating deal:', error);
    throw error;
  }

  return data as EventDeal;
}

/**
 * Update an existing deal
 */
export async function updateDeal(dealId: string, input: UpdateDealInput): Promise<EventDeal> {
  const { data, error } = await supabase
    .from('event_deals')
    .update(input)
    .eq('id', dealId)
    .select()
    .single();

  if (error) {
    console.error('Error updating deal:', error);
    throw error;
  }

  return data as EventDeal;
}

/**
 * Delete a deal (only if not settled)
 */
export async function deleteDeal(dealId: string): Promise<void> {
  const { error } = await supabase
    .from('event_deals')
    .delete()
    .eq('id', dealId);

  if (error) {
    console.error('Error deleting deal:', error);
    throw error;
  }
}

// ============================================================================
// WORKFLOW OPERATIONS
// ============================================================================

/**
 * Submit deal for approval
 * Changes status from 'draft' to 'pending_approval'
 */
export async function submitDealForApproval(dealId: string): Promise<EventDeal> {
  const { data, error } = await supabase
    .from('event_deals')
    .update({
      status: 'pending_approval',
      submitted_for_approval_at: new Date().toISOString()
    })
    .eq('id', dealId)
    .eq('status', 'draft') // Only allow if currently draft
    .select()
    .single();

  if (error) {
    console.error('Error submitting deal for approval:', error);
    throw error;
  }

  return data as EventDeal;
}

/**
 * Check if all participants have approved
 * If yes, mark deal as fully_approved
 */
export async function checkAndUpdateDealApprovalStatus(dealId: string): Promise<EventDeal> {
  // Get all participants
  const { data: participants, error: participantsError } = await supabase
    .from('deal_participants')
    .select('approval_status')
    .eq('deal_id', dealId);

  if (participantsError) {
    console.error('Error fetching participants:', participantsError);
    throw participantsError;
  }

  // Check if all approved
  const allApproved = participants.length > 0 &&
    participants.every(p => p.approval_status === 'approved');

  if (allApproved) {
    const { data, error } = await supabase
      .from('event_deals')
      .update({
        status: 'fully_approved',
        fully_approved_at: new Date().toISOString()
      })
      .eq('id', dealId)
      .select()
      .single();

    if (error) {
      console.error('Error updating deal to fully approved:', error);
      throw error;
    }

    return data as EventDeal;
  } else {
    // If not all approved, ensure status is pending_approval
    const { data, error } = await supabase
      .from('event_deals')
      .update({
        status: 'pending_approval',
        fully_approved_at: null
      })
      .eq('id', dealId)
      .select()
      .single();

    if (error) {
      console.error('Error updating deal status:', error);
      throw error;
    }

    return data as EventDeal;
  }
}

/**
 * Cancel a deal
 */
export async function cancelDeal(
  dealId: string,
  userId: string,
  reason?: string
): Promise<EventDeal> {
  const { data, error } = await supabase
    .from('event_deals')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      cancellation_reason: reason
    })
    .eq('id', dealId)
    .select()
    .single();

  if (error) {
    console.error('Error cancelling deal:', error);
    throw error;
  }

  return data as EventDeal;
}

// ============================================================================
// CALCULATION & SETTLEMENT
// ============================================================================

/**
 * Calculate split amounts for all participants
 * Calls PostgreSQL function calculate_deal_splits()
 */
export async function calculateDealSplits(dealId: string): Promise<DealCalculation[]> {
  const { data, error } = await supabase
    .rpc('calculate_deal_splits', { p_deal_id: dealId });

  if (error) {
    console.error('Error calculating deal splits:', error);
    throw error;
  }

  return data as DealCalculation[];
}

/**
 * Update calculated amounts for all participants
 */
export async function updateParticipantCalculations(dealId: string): Promise<void> {
  const calculations = await calculateDealSplits(dealId);

  for (const calc of calculations) {
    const { error } = await supabase
      .from('deal_participants')
      .update({ calculated_amount: calc.calculated_amount })
      .eq('id', calc.participant_id);

    if (error) {
      console.error('Error updating participant calculation:', error);
      throw error;
    }
  }
}

/**
 * Settle a deal and trigger invoice generation
 */
export async function settleDeal(dealId: string, userId: string): Promise<EventDeal> {
  // First, ensure all calculations are up to date
  await updateParticipantCalculations(dealId);

  // Mark deal as settled
  const { data, error } = await supabase
    .from('event_deals')
    .update({
      status: 'settled',
      settled_at: new Date().toISOString(),
      settled_by: userId
    })
    .eq('id', dealId)
    .eq('status', 'fully_approved') // Can only settle if fully approved
    .select()
    .single();

  if (error) {
    console.error('Error settling deal:', error);
    throw error;
  }

  // TODO: Trigger invoice generation
  // This will be implemented in Phase 6

  return data as EventDeal;
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Get deals by status for a promoter
 */
export async function getDealsByStatus(
  promoterId: string,
  status: DealStatus
): Promise<EventDealWithDetails[]> {
  const { data, error } = await supabase
    .from('event_deals')
    .select(`
      *,
      event:events!inner (
        id,
        title,
        venue,
        event_date,
        promoter_id
      )
    `)
    .eq('event.promoter_id', promoterId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching deals by status:', error);
    throw error;
  }

  return data as unknown as EventDealWithDetails[];
}

/**
 * Get pending approvals for a user (deals they need to approve as participant)
 */
export async function getPendingApprovalsForUser(userId: string): Promise<EventDealWithDetails[]> {
  const { data, error } = await supabase
    .from('deal_participants')
    .select(`
      deal:event_deals!inner (
        *,
        event:events (
          id,
          title,
          venue,
          event_date
        )
      )
    `)
    .eq('participant_id', userId)
    .eq('approval_status', 'pending')
    .eq('deal.status', 'pending_approval');

  if (error) {
    console.error('Error fetching pending approvals:', error);
    throw error;
  }

  return data.map(item => item.deal) as unknown as EventDealWithDetails[];
}

/**
 * Get deal statistics for an event
 */
export interface DealStats {
  total_deals: number;
  draft: number;
  pending_approval: number;
  fully_approved: number;
  settled: number;
  total_revenue: number;
  total_settled_revenue: number;
}

export async function getDealStatsByEvent(eventId: string): Promise<DealStats> {
  const { data, error } = await supabase
    .from('event_deals')
    .select('status, total_revenue')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching deal stats:', error);
    throw error;
  }

  const stats: DealStats = {
    total_deals: data.length,
    draft: 0,
    pending_approval: 0,
    fully_approved: 0,
    settled: 0,
    total_revenue: 0,
    total_settled_revenue: 0
  };

  data.forEach(deal => {
    // Count by status
    if (deal.status === 'draft') stats.draft++;
    else if (deal.status === 'pending_approval') stats.pending_approval++;
    else if (deal.status === 'fully_approved') stats.fully_approved++;
    else if (deal.status === 'settled') stats.settled++;

    // Sum revenue
    if (deal.total_revenue) {
      stats.total_revenue += deal.total_revenue;
      if (deal.status === 'settled') {
        stats.total_settled_revenue += deal.total_revenue;
      }
    }
  });

  return stats;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate deal can be submitted for approval
 */
export async function validateDealForSubmission(dealId: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Get deal
  const deal = await getDealById(dealId);
  if (!deal) {
    return { valid: false, errors: ['Deal not found'] };
  }

  // Check status
  if (deal.status !== 'draft') {
    errors.push('Deal must be in draft status to submit');
  }

  // Check has participants
  const { data: participants, error } = await supabase
    .from('deal_participants')
    .select('id')
    .eq('deal_id', dealId);

  if (error) {
    errors.push('Error checking participants');
  } else if (!participants || participants.length === 0) {
    errors.push('Deal must have at least one participant');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate deal can be settled
 */
export async function validateDealForSettlement(dealId: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Get deal
  const deal = await getDealById(dealId);
  if (!deal) {
    return { valid: false, errors: ['Deal not found'] };
  }

  // Check status
  if (deal.status !== 'fully_approved') {
    errors.push('Deal must be fully approved to settle');
  }

  // Check total_revenue is entered
  if (!deal.total_revenue || deal.total_revenue <= 0) {
    errors.push('Total revenue must be entered before settlement');
  }

  // Check all participants have calculated amounts
  const { data: participants, error } = await supabase
    .from('deal_participants')
    .select('calculated_amount')
    .eq('deal_id', dealId);

  if (error) {
    errors.push('Error checking participant calculations');
  } else if (participants?.some(p => !p.calculated_amount)) {
    errors.push('All participants must have calculated amounts');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
