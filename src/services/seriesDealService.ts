/**
 * Series Deal Service
 *
 * Orchestration service for series-level deals:
 * - Syncing series deals to event_deals
 * - Creating recurring invoices for fixed-fee deals
 * - Revenue aggregation across linked events
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateGST } from '@/utils/gst-calculator';
import type { GSTMode } from '@/utils/gst-calculator';
import type { SeriesDealRevenue } from '@/types/deal';

/**
 * Sync a series deal to all events in the series.
 * Creates event_deals with series_deal_id FK and copies participants.
 */
export async function syncSeriesDealToEvents(
  seriesDealId: string,
  seriesId: string
): Promise<{ eventsCreated: number }> {
  // 1. Get the series deal with participants
  const { data: seriesDeal, error: dealError } = await supabase
    .from('series_deals')
    .select('*')
    .eq('id', seriesDealId)
    .single();

  if (dealError || !seriesDeal) {
    throw new Error('Series deal not found');
  }

  const { data: participants, error: partError } = await supabase
    .from('deal_participants')
    .select('*')
    .eq('series_deal_id', seriesDealId);

  if (partError) throw partError;

  // 2. Get all events in the series
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, promoter_id')
    .eq('series_id', seriesId);

  if (eventsError) throw eventsError;
  if (!events || events.length === 0) {
    return { eventsCreated: 0 };
  }

  // 3. Get existing synced event_deals to avoid duplicates
  const { data: existingDeals } = await supabase
    .from('event_deals')
    .select('event_id')
    .eq('series_deal_id', seriesDealId);

  const existingEventIds = new Set((existingDeals || []).map(d => d.event_id));

  // 4. For each event, create an event_deal + copy participants
  let eventsCreated = 0;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Map series deal_type to event deal_type
  const eventDealType = mapSeriesDealType(seriesDeal.deal_type);

  for (const event of events) {
    if (existingEventIds.has(event.id)) continue;

    // Create event_deal
    const { data: eventDeal, error: createError } = await supabase
      .from('event_deals')
      .insert({
        event_id: event.id,
        deal_name: seriesDeal.title,
        deal_type: eventDealType,
        status: 'draft',
        total_revenue: seriesDeal.deal_type === 'fixed_split' ? seriesDeal.fixed_fee_amount : null,
        series_deal_id: seriesDealId,
        is_synced_from_series: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error(`Failed to create event deal for event ${event.id}:`, createError);
      continue;
    }

    // Copy participants from series deal to event deal
    if (participants && participants.length > 0) {
      const eventParticipants = participants.map(p => ({
        deal_id: eventDeal.id,
        participant_id: p.participant_id,
        participant_email: p.participant_email,
        participant_type: p.participant_type,
        split_type: p.split_type,
        split_percentage: p.split_percentage,
        flat_fee_amount: p.flat_fee_amount,
        gst_mode: p.gst_mode,
        approval_status: 'pending' as const,
        version: 1,
        notes: p.notes,
      }));

      const { error: insertPartError } = await supabase
        .from('deal_participants')
        .insert(eventParticipants);

      if (insertPartError) {
        console.error(`Failed to copy participants for event ${event.id}:`, insertPartError);
      }
    }

    eventsCreated++;
  }

  // 5. Update series deal status to active if it was draft
  if (seriesDeal.status === 'draft' && eventsCreated > 0) {
    await supabase
      .from('series_deals')
      .update({ status: 'active' })
      .eq('id', seriesDealId);
  }

  return { eventsCreated };
}

/**
 * Called when a new event is added to a series.
 * Auto-creates event_deals for any active series deals.
 */
export async function syncNewEventToSeriesDeals(
  eventId: string,
  seriesId: string
): Promise<void> {
  // Get active series deals
  const { data: seriesDeals, error } = await supabase
    .from('series_deals')
    .select('*')
    .eq('series_id', seriesId)
    .in('status', ['active', 'draft']);

  if (error || !seriesDeals || seriesDeals.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  for (const deal of seriesDeals) {
    // Skip if apply_to_future_only is false and deal is already active
    // (it was already synced to existing events)

    const eventDealType = mapSeriesDealType(deal.deal_type);

    // Create event_deal
    const { data: eventDeal, error: createError } = await supabase
      .from('event_deals')
      .insert({
        event_id: eventId,
        deal_name: deal.title,
        deal_type: eventDealType,
        status: 'draft',
        total_revenue: deal.deal_type === 'fixed_split' ? deal.fixed_fee_amount : null,
        series_deal_id: deal.id,
        is_synced_from_series: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error(`Failed to sync deal ${deal.id} to event ${eventId}:`, createError);
      continue;
    }

    // Copy participants
    const { data: participants } = await supabase
      .from('deal_participants')
      .select('*')
      .eq('series_deal_id', deal.id);

    if (participants && participants.length > 0) {
      const eventParticipants = participants.map(p => ({
        deal_id: eventDeal.id,
        participant_id: p.participant_id,
        participant_email: p.participant_email,
        participant_type: p.participant_type,
        split_type: p.split_type,
        split_percentage: p.split_percentage,
        flat_fee_amount: p.flat_fee_amount,
        gst_mode: p.gst_mode,
        approval_status: 'pending' as const,
        version: 1,
        notes: p.notes,
      }));

      await supabase.from('deal_participants').insert(eventParticipants);
    }
  }
}

/**
 * Aggregate revenue across all event_deals linked to a series deal.
 */
export async function getSeriesDealRevenue(seriesDealId: string): Promise<SeriesDealRevenue> {
  // Get all event_deals linked to this series deal
  const { data: eventDeals, error } = await supabase
    .from('event_deals')
    .select(`
      id,
      total_revenue,
      status,
      deal_participants (
        participant_id,
        split_percentage,
        flat_fee_amount,
        split_type,
        calculated_amount,
        final_amount
      )
    `)
    .eq('series_deal_id', seriesDealId);

  if (error) throw error;

  let totalRevenue = 0;
  let settledRevenue = 0;
  let pendingRevenue = 0;
  const participantEarnings: Record<string, { earned: number; settled: number; pending: number }> = {};

  for (const deal of eventDeals || []) {
    const revenue = deal.total_revenue || 0;
    totalRevenue += revenue;

    if (deal.status === 'settled') {
      settledRevenue += revenue;
    } else {
      pendingRevenue += revenue;
    }

    // Calculate per-participant amounts
    for (const p of deal.deal_participants || []) {
      const pid = p.participant_id || 'unknown';
      if (!participantEarnings[pid]) {
        participantEarnings[pid] = { earned: 0, settled: 0, pending: 0 };
      }

      const amount = p.final_amount || p.calculated_amount ||
        (p.split_type === 'percentage' ? revenue * (p.split_percentage || 0) / 100 :
         p.split_type === 'flat_fee' ? (p.flat_fee_amount || 0) : 0);

      participantEarnings[pid].earned += amount;
      if (deal.status === 'settled') {
        participantEarnings[pid].settled += amount;
      } else {
        participantEarnings[pid].pending += amount;
      }
    }
  }

  // Get participant names
  const participantIds = Object.keys(participantEarnings).filter(id => id !== 'unknown');
  let nameMap: Record<string, string> = {};
  if (participantIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', participantIds);
    if (profiles) {
      nameMap = profiles.reduce((acc, p) => {
        acc[p.id] = p.name || 'Unknown';
        return acc;
      }, {} as Record<string, string>);
    }
  }

  return {
    series_deal_id: seriesDealId,
    total_revenue: totalRevenue,
    settled_revenue: settledRevenue,
    pending_revenue: pendingRevenue,
    event_count: (eventDeals || []).length,
    per_participant: Object.entries(participantEarnings).map(([pid, data]) => ({
      participant_id: pid,
      participant_name: nameMap[pid] || 'Unknown',
      ...data,
    })),
  };
}

/**
 * Create a recurring invoice linked to a fixed-fee series deal.
 */
export async function createRecurringInvoiceForDeal(
  seriesDealId: string,
  seriesDeal: {
    title: string;
    fixed_fee_amount: number;
    gst_mode: string;
    frequency: string;
    day_of_week: number | null;
  },
  senderInfo: {
    name: string;
    email: string;
  },
  recipientInfo: {
    name: string;
    email: string;
  }
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const gstMode = seriesDeal.gst_mode as GSTMode;
  const gst = calculateGST(seriesDeal.fixed_fee_amount, gstMode);

  // Calculate next invoice date
  const nextDate = calculateNextInvoiceDate(seriesDeal.frequency, seriesDeal.day_of_week);

  const taxTreatment = gstMode === 'inclusive' ? 'inclusive' :
    gstMode === 'exclusive' ? 'exclusive' : 'none';

  const { data: recurringInvoice, error } = await supabase
    .from('recurring_invoices')
    .insert({
      invoice_type: 'payable',
      sender_name: senderInfo.name,
      sender_email: senderInfo.email,
      recipient_name: recipientInfo.name,
      recipient_email: recipientInfo.email,
      description: seriesDeal.title,
      amount: seriesDeal.fixed_fee_amount,
      currency: 'AUD',
      tax_rate: gstMode === 'none' ? 0 : 10,
      tax_treatment: taxTreatment,
      frequency: seriesDeal.frequency,
      next_invoice_date: nextDate.toISOString().split('T')[0],
      is_active: true,
      series_deal_id: seriesDealId,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) throw error;

  // Link back to the series deal
  await supabase
    .from('series_deals')
    .update({ recurring_invoice_id: recurringInvoice.id })
    .eq('id', seriesDealId);

  return recurringInvoice.id;
}

// ============================================================================
// HELPERS
// ============================================================================

function mapSeriesDealType(seriesDealType: string | null): string {
  switch (seriesDealType) {
    case 'revenue_share': return 'percentage';
    case 'fixed_split': return 'flat_fee';
    case 'tiered': return 'custom';
    case 'custom': return 'custom';
    default: return 'custom';
  }
}

function calculateNextInvoiceDate(frequency: string, dayOfWeek: number | null): Date {
  const now = new Date();
  const next = new Date(now);

  switch (frequency) {
    case 'weekly': {
      const targetDay = dayOfWeek ?? now.getDay();
      const daysUntil = (targetDay - now.getDay() + 7) % 7 || 7;
      next.setDate(now.getDate() + daysUntil);
      break;
    }
    case 'fortnightly': {
      const targetDay = dayOfWeek ?? now.getDay();
      const daysUntil = (targetDay - now.getDay() + 7) % 7 || 7;
      next.setDate(now.getDate() + daysUntil);
      if (next.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
        next.setDate(next.getDate() + 7);
      }
      break;
    }
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      break;
    default:
      next.setDate(now.getDate() + 7);
  }

  return next;
}
