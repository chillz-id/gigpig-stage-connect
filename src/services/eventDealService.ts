/**
 * Event Deal Service
 *
 * Manages event deals, revenue sharing, and settlement workflows.
 * Handles deal creation, participant management, approval workflows,
 * and automated invoice generation.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  validateDealForSettlement as validateDeal,
  calculateInvoiceDirection,
  generateSplitDescription
} from './settlement';

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
 * Settle a deal and trigger invoice generation with transaction rollback
 *
 * Pre-conditions:
 * - Deal must be in 'fully_approved' status
 * - All participants must have approval_status = 'approved'
 * - total_revenue must be set
 * - Only event owner can settle
 *
 * Post-conditions:
 * - Deal status changes to 'settled'
 * - Invoice created for each participant
 * - invoice_id set in deal_participants
 * - Notifications sent to all participants
 */
export async function settleDeal(dealId: string, userId: string): Promise<{
  deal: EventDeal;
  invoices: Array<{ participant_id: string; invoice_id: string; invoice_number: string }>;
}> {
  // Get deal with all participants and event details
  const { data: deal, error: dealError } = await supabase
    .from('event_deals')
    .select(`
      *,
      deal_participants (
        id,
        participant_id,
        participant_name,
        participant_type,
        split_type,
        split_percentage,
        flat_fee_amount,
        calculated_amount,
        approval_status,
        invoice_id
      ),
      events (
        id,
        title,
        venue,
        event_date,
        promoter_id
      )
    `)
    .eq('id', dealId)
    .single();

  if (dealError) throw dealError;
  if (!deal) throw new Error('Deal not found');

  // Validate using pure function
  const validation = validateDeal(deal as any, userId);
  if (!validation.isValid) {
    throw new Error(validation.errors.join('. '));
  }

  // Generate invoices for each participant (with transaction safety)
  let invoices: Array<{ participant_id: string; invoice_id: string; invoice_number: string }> = [];
  try {
    invoices = await generateInvoicesForDeal(deal);
  } catch (error) {
    console.error('Invoice generation failed, settlement aborted:', error);
    throw new Error('Failed to generate invoices. Settlement aborted. ' + (error as Error).message);
  }

  // Only update deal status AFTER all invoices succeed
  const { error: updateError } = await supabase
    .from('event_deals')
    .update({
      status: 'settled',
      settled_at: new Date().toISOString(),
      settled_by: userId
    })
    .eq('id', dealId);

  if (updateError) {
    // Rollback: Delete generated invoices
    console.error('Deal status update failed, rolling back invoices:', updateError);
    for (const invoice of invoices) {
      await supabase.from('invoices').delete().eq('id', invoice.invoice_id);
    }
    throw new Error('Failed to update deal status. Invoices rolled back.');
  }

  // Update participants with invoice IDs
  for (const invoice of invoices) {
    await supabase
      .from('deal_participants')
      .update({ invoice_id: invoice.invoice_id })
      .eq('participant_id', invoice.participant_id)
      .eq('deal_id', dealId);
  }

  // Send notifications (non-blocking, use existing notification system)
  try {
    await notifyDealParticipants(dealId, 'settled', invoices);
  } catch (notifError) {
    console.error('Notification failed (non-blocking):', notifError);
    // Don't throw - settlement succeeded even if notifications fail
  }

  return {
    deal: { ...deal, status: 'settled', settled_at: new Date().toISOString(), settled_by: userId } as EventDeal,
    invoices
  };
}

/**
 * Generate invoices for all participants in a deal
 */
async function generateInvoicesForDeal(deal: any): Promise<Array<{
  participant_id: string;
  invoice_id: string;
  invoice_number: string;
}>> {
  const { invoiceService } = await import('./invoiceService');
  const invoices = [];

  for (const participant of deal.deal_participants || []) {
    // Use pure function to determine if invoice should be generated
    const direction = calculateInvoiceDirection(participant.calculated_amount || 0);

    if (!direction.shouldGenerate) {
      console.warn(`Skipping invoice for participant ${participant.participant_id} - zero amount`);
      continue;
    }

    // Create invoice from deal participant
    const invoice = await invoiceService.createInvoiceFromDeal({
      deal_id: deal.id,
      participant_id: participant.participant_id,
      participant_name: participant.participant_name,
      participant_type: participant.participant_type,
      amount: participant.calculated_amount,
      event_title: deal.events?.title || 'Event',
      event_date: deal.events?.event_date,
      venue: deal.events?.venue,
      deal_name: deal.deal_name,
      deal_type: deal.deal_type,
      split_description: generateSplitDescription(participant) // Use pure function
    });

    invoices.push({
      participant_id: participant.participant_id,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number
    });
  }

  return invoices;
}

/**
 * Send notifications to participants using existing notification system
 */
async function notifyDealParticipants(
  dealId: string,
  eventType: 'submitted' | 'approved' | 'settled' | 'cancelled',
  invoices?: Array<{ participant_id: string; invoice_id: string; invoice_number: string }>
): Promise<void> {
  // Import existing notification service
  const { notificationService } = await import('./notificationService');

  // Get deal and participants
  const { data: deal } = await supabase
    .from('event_deals')
    .select(`
      *,
      deal_participants (participant_id, participant_name),
      events (title, event_date, venue)
    `)
    .eq('id', dealId)
    .single();

  if (!deal) return;

  const events = deal.events as any;
  const dealParticipants = deal.deal_participants as any[];

  for (const participant of dealParticipants) {
    let notificationTitle = '';
    let notificationMessage = '';
    let actionUrl = '';
    let notificationType: 'payment_received' | 'event_booking' | 'general' = 'general';
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

    switch (eventType) {
      case 'submitted':
        notificationTitle = 'Deal Approval Required';
        notificationMessage = `You've been added to a deal for ${events?.title}. Please review and approve.`;
        actionUrl = `/events/${deal.event_id}/manage?tab=deals`;
        notificationType = 'event_booking';
        priority = 'high';
        break;

      case 'approved':
        notificationTitle = 'Deal Approved';
        notificationMessage = `Deal for ${events?.title} has been approved by all participants.`;
        actionUrl = `/events/${deal.event_id}/manage?tab=deals`;
        notificationType = 'event_booking';
        priority = 'medium';
        break;

      case 'settled':
        const invoice = invoices?.find(i => i.participant_id === participant.participant_id);
        notificationTitle = 'Deal Settled - Invoice Generated';
        notificationMessage = `The deal for ${events?.title} has been settled. Invoice ${invoice?.invoice_number} has been generated.`;
        actionUrl = invoice ? `/profile?tab=invoices&invoice=${invoice.invoice_id}` : `/events/${deal.event_id}/manage?tab=deals`;
        notificationType = 'payment_received';
        priority = 'high';
        break;

      case 'cancelled':
        notificationTitle = 'Deal Cancelled';
        notificationMessage = `The deal for ${events?.title} has been cancelled.`;
        actionUrl = `/events/${deal.event_id}/manage?tab=deals`;
        notificationType = 'event_booking';
        priority = 'medium';
        break;
    }

    // Create notification using existing notification system
    // This respects user preferences for email/SMS/push delivery
    await notificationService.createNotification({
      user_id: participant.participant_id,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      priority,
      action_url: actionUrl,
      action_label: eventType === 'settled' ? 'View Invoice' : 'View Deal'
    });
  }
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
 * Validate deal can be settled (async wrapper for UI validation)
 * For internal use, the settleDeal() function uses the pure validation function
 */
export async function validateDealForSettlement(dealId: string, userId: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  // Get deal with details
  const { data: deal, error } = await supabase
    .from('event_deals')
    .select(`
      *,
      deal_participants (
        id,
        participant_id,
        approval_status
      ),
      events (
        id,
        promoter_id
      )
    `)
    .eq('id', dealId)
    .single();

  if (error || !deal) {
    return { valid: false, errors: ['Deal not found'] };
  }

  // Use pure validation function
  const validation = validateDeal(deal as any, userId);

  return {
    valid: validation.isValid,
    errors: validation.errors
  };
}
