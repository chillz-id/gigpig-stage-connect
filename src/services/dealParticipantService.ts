/**
 * Deal Participant Service
 *
 * Manages participants in event deals, including approval workflows,
 * version tracking, and split calculations.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type ParticipantType =
  | 'comedian'
  | 'manager'
  | 'organization'
  | 'venue'
  | 'promoter'
  | 'other';

export type SplitType =
  | 'percentage'
  | 'flat_fee'
  | 'door_split'
  | 'tiered'
  | 'custom';

export type ApprovalStatus =
  | 'pending'        // Awaiting participant approval
  | 'approved'       // Participant approved
  | 'edited'         // Participant requested changes
  | 'declined';      // Participant declined

export interface DealParticipant {
  id: string;
  deal_id: string;
  participant_id: string;
  participant_type: ParticipantType;
  participant_role?: string;
  split_type: SplitType;
  split_percentage?: number;
  flat_fee_amount?: number;
  door_split_percentage?: number;
  guaranteed_minimum?: number;
  tiered_config?: TieredSplitConfig[];
  calculated_amount?: number;
  final_amount?: number;
  approval_status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  edit_notes?: string;
  edited_by?: string;
  edited_at?: string;
  version: number;
  notes?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DealParticipantWithDetails extends DealParticipant {
  participant?: {
    id: string;
    name: string;
    avatar_url?: string;
    email?: string;
  };
  deal?: {
    id: string;
    deal_name: string;
    status: string;
  };
}

export interface TieredSplitConfig {
  threshold: number;
  percentage: number;
}

export interface CreateParticipantInput {
  deal_id: string;
  participant_id: string;
  participant_type: ParticipantType;
  participant_role?: string;
  split_type: SplitType;
  split_percentage?: number;
  flat_fee_amount?: number;
  door_split_percentage?: number;
  guaranteed_minimum?: number;
  tiered_config?: TieredSplitConfig[];
  notes?: string;
  internal_notes?: string;
}

export interface UpdateParticipantSplitInput {
  split_type?: SplitType;
  split_percentage?: number;
  flat_fee_amount?: number;
  door_split_percentage?: number;
  guaranteed_minimum?: number;
  tiered_config?: TieredSplitConfig[];
  edit_notes: string; // Required when editing
  edited_by: string;  // User making the edit
}

export interface ParticipantHistoryEntry {
  id: string;
  participant_id: string;
  version: number;
  split_type: string;
  split_percentage?: number;
  flat_fee_amount?: number;
  door_split_percentage?: number;
  guaranteed_minimum?: number;
  tiered_config?: TieredSplitConfig[];
  changed_by: string;
  change_notes?: string;
  changed_at: string;
  previous_approval_status?: string;
  changed_by_user?: {
    name: string;
    avatar_url?: string;
  };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all participants for a deal
 */
export async function getParticipantsByDeal(dealId: string): Promise<DealParticipantWithDetails[]> {
  const { data, error } = await supabase
    .from('deal_participants')
    .select(`
      *,
      participant:profiles!participant_id (
        id,
        name,
        avatar_url,
        email
      ),
      deal:event_deals (
        id,
        deal_name,
        status
      )
    `)
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching participants:', error);
    throw error;
  }

  return data as unknown as DealParticipantWithDetails[];
}

/**
 * Get a single participant by ID
 */
export async function getParticipantById(participantId: string): Promise<DealParticipantWithDetails | null> {
  const { data, error } = await supabase
    .from('deal_participants')
    .select(`
      *,
      participant:profiles!participant_id (
        id,
        name,
        avatar_url,
        email
      ),
      deal:event_deals (
        id,
        deal_name,
        status
      )
    `)
    .eq('id', participantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching participant:', error);
    throw error;
  }

  return data as unknown as DealParticipantWithDetails;
}

/**
 * Get participant history (version tracking)
 */
export async function getParticipantHistory(participantId: string): Promise<ParticipantHistoryEntry[]> {
  const { data, error } = await supabase
    .from('deal_participant_history')
    .select(`
      *,
      changed_by_user:profiles!changed_by (
        name,
        avatar_url
      )
    `)
    .eq('participant_id', participantId)
    .order('version', { ascending: false });

  if (error) {
    console.error('Error fetching participant history:', error);
    throw error;
  }

  return data as unknown as ParticipantHistoryEntry[];
}

/**
 * Add a participant to a deal
 */
export async function addParticipant(input: CreateParticipantInput): Promise<DealParticipant> {
  const { data, error } = await supabase
    .from('deal_participants')
    .insert({
      ...input,
      approval_status: 'pending',
      version: 1
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding participant:', error);
    throw error;
  }

  return data as DealParticipant;
}

/**
 * Update participant split terms
 * This will increment version and require re-approval
 */
export async function updateParticipantSplit(
  participantId: string,
  input: UpdateParticipantSplitInput
): Promise<DealParticipant> {
  const { data, error } = await supabase
    .from('deal_participants')
    .update({
      split_type: input.split_type,
      split_percentage: input.split_percentage,
      flat_fee_amount: input.flat_fee_amount,
      door_split_percentage: input.door_split_percentage,
      guaranteed_minimum: input.guaranteed_minimum,
      tiered_config: input.tiered_config,
      edit_notes: input.edit_notes,
      edited_by: input.edited_by,
      edited_at: new Date().toISOString()
    })
    .eq('id', participantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating participant split:', error);
    throw error;
  }

  return data as DealParticipant;
}

/**
 * Remove a participant from a deal
 */
export async function removeParticipant(participantId: string): Promise<void> {
  const { error } = await supabase
    .from('deal_participants')
    .delete()
    .eq('id', participantId);

  if (error) {
    console.error('Error removing participant:', error);
    throw error;
  }
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

/**
 * Approve participant terms
 */
export async function approveParticipant(
  participantId: string,
  userId: string
): Promise<DealParticipant> {
  const { data, error } = await supabase
    .from('deal_participants')
    .update({
      approval_status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString()
    })
    .eq('id', participantId)
    .eq('participant_id', userId) // Can only approve own participation
    .select()
    .single();

  if (error) {
    console.error('Error approving participant:', error);
    throw error;
  }

  // Check if all participants approved and update deal status
  const participant = data as DealParticipant;
  const { checkAndUpdateDealApprovalStatus } = await import('./eventDealService');
  await checkAndUpdateDealApprovalStatus(participant.deal_id);

  return participant;
}

/**
 * Participant requests changes to their terms
 */
export async function requestChanges(
  participantId: string,
  userId: string,
  input: UpdateParticipantSplitInput
): Promise<DealParticipant> {
  // First update the split terms
  const updated = await updateParticipantSplit(participantId, {
    ...input,
    edited_by: userId
  });

  // Trigger is automatically set approval_status to 'pending'
  // Update deal status
  const { checkAndUpdateDealApprovalStatus } = await import('./eventDealService');
  await checkAndUpdateDealApprovalStatus(updated.deal_id);

  return updated;
}

/**
 * Decline participation
 */
export async function declineParticipation(
  participantId: string,
  userId: string,
  reason?: string
): Promise<DealParticipant> {
  const { data, error } = await supabase
    .from('deal_participants')
    .update({
      approval_status: 'declined',
      edit_notes: reason,
      edited_by: userId,
      edited_at: new Date().toISOString()
    })
    .eq('id', participantId)
    .eq('participant_id', userId) // Can only decline own participation
    .select()
    .single();

  if (error) {
    console.error('Error declining participation:', error);
    throw error;
  }

  return data as DealParticipant;
}

/**
 * Bulk approve all pending terms for a user
 */
export async function approveAllPendingForUser(
  dealId: string,
  userId: string
): Promise<DealParticipant[]> {
  const { data, error } = await supabase
    .from('deal_participants')
    .update({
      approval_status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString()
    })
    .eq('deal_id', dealId)
    .eq('participant_id', userId)
    .eq('approval_status', 'pending')
    .select();

  if (error) {
    console.error('Error bulk approving:', error);
    throw error;
  }

  // Update deal status
  const { checkAndUpdateDealApprovalStatus } = await import('./eventDealService');
  await checkAndUpdateDealApprovalStatus(dealId);

  return data as DealParticipant[];
}

// ============================================================================
// MANAGER AUTO-DETECTION
// ============================================================================

/**
 * Auto-add manager when comedian is added
 * Checks comedian_managers table and adds manager with commission
 */
export async function autoAddComedianManager(
  dealId: string,
  comedianId: string
): Promise<DealParticipant | null> {
  // Get active manager for comedian
  const { data: manager, error } = await supabase
    .rpc('get_comedian_manager_commission', { p_comedian_id: comedianId })
    .single();

  if (error || !manager) {
    // No manager found, that's okay
    return null;
  }

  // Check if manager already in deal
  const { data: existing } = await supabase
    .from('deal_participants')
    .select('id')
    .eq('deal_id', dealId)
    .eq('participant_id', manager.manager_id)
    .eq('participant_type', 'manager')
    .single();

  if (existing) {
    // Manager already added
    return null;
  }

  // Add manager with commission
  return await addParticipant({
    deal_id: dealId,
    participant_id: manager.manager_id,
    participant_type: 'manager',
    participant_role: 'Manager',
    split_type: 'percentage',
    split_percentage: manager.commission_percentage,
    notes: `Auto-added as ${manager.manager_name}'s manager`
  });
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Get pending approvals for a user
 */
export async function getPendingApprovalsForUser(userId: string): Promise<DealParticipantWithDetails[]> {
  const { data, error } = await supabase
    .from('deal_participants')
    .select(`
      *,
      participant:profiles!participant_id (
        id,
        name,
        avatar_url
      ),
      deal:event_deals!inner (
        id,
        deal_name,
        status
      )
    `)
    .eq('participant_id', userId)
    .eq('approval_status', 'pending')
    .eq('deal.status', 'pending_approval');

  if (error) {
    console.error('Error fetching pending approvals:', error);
    throw error;
  }

  return data as unknown as DealParticipantWithDetails[];
}

/**
 * Get all participants for events owned by promoter
 */
export async function getParticipantsByPromoter(promoterId: string): Promise<DealParticipantWithDetails[]> {
  const { data, error } = await supabase
    .from('deal_participants')
    .select(`
      *,
      participant:profiles!participant_id (
        id,
        name,
        avatar_url
      ),
      deal:event_deals!inner (
        id,
        deal_name,
        status,
        event:events!inner (
          promoter_id
        )
      )
    `)
    .eq('deal.event.promoter_id', promoterId);

  if (error) {
    console.error('Error fetching participants by promoter:', error);
    throw error;
  }

  return data as unknown as DealParticipantWithDetails[];
}

/**
 * Get participant statistics for a deal
 */
export interface ParticipantStats {
  total: number;
  pending: number;
  approved: number;
  edited: number;
  declined: number;
  total_allocated: number;
  unallocated_percentage: number;
}

export async function getParticipantStatsByDeal(dealId: string): Promise<ParticipantStats> {
  const participants = await getParticipantsByDeal(dealId);

  const stats: ParticipantStats = {
    total: participants.length,
    pending: 0,
    approved: 0,
    edited: 0,
    declined: 0,
    total_allocated: 0,
    unallocated_percentage: 100
  };

  let totalPercentage = 0;

  participants.forEach(p => {
    // Count by status
    if (p.approval_status === 'pending') stats.pending++;
    else if (p.approval_status === 'approved') stats.approved++;
    else if (p.approval_status === 'edited') stats.edited++;
    else if (p.approval_status === 'declined') stats.declined++;

    // Calculate allocated percentage
    if (p.split_type === 'percentage' && p.split_percentage) {
      totalPercentage += p.split_percentage;
    }

    // Sum allocated amounts
    if (p.calculated_amount) {
      stats.total_allocated += p.calculated_amount;
    }
  });

  stats.unallocated_percentage = Math.max(0, 100 - totalPercentage);

  return stats;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate participant split configuration
 */
export function validateParticipantSplit(input: Partial<CreateParticipantInput>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.split_type) {
    errors.push('Split type is required');
  }

  switch (input.split_type) {
    case 'percentage':
      if (!input.split_percentage || input.split_percentage < 0 || input.split_percentage > 100) {
        errors.push('Percentage must be between 0 and 100');
      }
      break;

    case 'flat_fee':
      if (!input.flat_fee_amount || input.flat_fee_amount < 0) {
        errors.push('Flat fee amount must be greater than 0');
      }
      break;

    case 'door_split':
      if (!input.door_split_percentage || input.door_split_percentage < 0 || input.door_split_percentage > 100) {
        errors.push('Door split percentage must be between 0 and 100');
      }
      break;

    case 'tiered':
      if (!input.tiered_config || input.tiered_config.length === 0) {
        errors.push('Tiered config is required for tiered splits');
      } else {
        // Validate tiered config
        input.tiered_config.forEach((tier, index) => {
          if (tier.threshold < 0) {
            errors.push(`Tier ${index + 1}: Threshold must be greater than 0`);
          }
          if (tier.percentage < 0 || tier.percentage > 100) {
            errors.push(`Tier ${index + 1}: Percentage must be between 0 and 100`);
          }
        });
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if user can approve participant
 */
export async function canApproveParticipant(
  participantId: string,
  userId: string
): Promise<boolean> {
  const participant = await getParticipantById(participantId);

  if (!participant) return false;

  // User must be the participant
  return participant.participant_id === userId;
}
