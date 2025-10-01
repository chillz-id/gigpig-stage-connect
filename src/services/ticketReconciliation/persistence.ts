import { supabase } from '@/integrations/supabase/client';
import { PlatformType } from '@/types/ticketSales';

import {
  LocalSale,
  ManualAdjustment,
  PlatformSale,
  ReconciliationDiscrepancy,
  ReconciliationReport,
  SyncHealthStatus,
} from './types';

async function persistDiscrepancy(reportId: string, discrepancy: ReconciliationDiscrepancy): Promise<void> {
  const { error } = await supabase
    .from('reconciliation_discrepancies')
    .upsert({
      id: discrepancy.id,
      report_id: reportId,
      event_id: discrepancy.eventId,
      platform: discrepancy.platform,
      type: discrepancy.type,
      severity: discrepancy.severity,
      local_data: discrepancy.localData,
      platform_data: discrepancy.platformData,
      difference: discrepancy.difference,
      detected_at: discrepancy.detectedAt,
      resolved_at: discrepancy.resolvedAt,
      resolution: discrepancy.resolution,
      notes: discrepancy.notes,
    });

  if (error) {
    console.error('Error saving discrepancy:', error);
  }
}

export async function persistReport(report: ReconciliationReport): Promise<void> {
  const { error } = await supabase
    .from('reconciliation_reports')
    .upsert({
      id: report.id,
      event_id: report.eventId,
      platform: report.platform,
      start_time: report.startTime,
      end_time: report.endTime,
      status: report.status,
      total_local_sales: report.totalLocalSales,
      total_platform_sales: report.totalPlatformSales,
      total_local_revenue: report.totalLocalRevenue,
      total_platform_revenue: report.totalPlatformRevenue,
      discrepancies_found: report.discrepanciesFound,
      discrepancies_resolved: report.discrepanciesResolved,
      sync_health: report.syncHealth,
      error_message: report.error,
    });

  if (error) {
    console.error('Error saving reconciliation report:', error);
  }

  for (const discrepancy of report.details) {
    await persistDiscrepancy(report.id, discrepancy);
  }
}

export async function updateDiscrepancyRecord(discrepancy: ReconciliationDiscrepancy): Promise<void> {
  const { error } = await supabase
    .from('reconciliation_discrepancies')
    .update({
      resolved_at: discrepancy.resolvedAt,
      resolution: discrepancy.resolution,
      notes: discrepancy.notes,
    })
    .eq('id', discrepancy.id);

  if (error) {
    console.error('Error updating discrepancy:', error);
  }
}

export async function logReconciliationAction(
  eventId: string,
  action: string,
  description: string,
  metadata?: unknown
): Promise<void> {
  const { error } = await supabase
    .from('reconciliation_audit_log')
    .insert({
      event_id: eventId,
      action,
      description,
      metadata,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error logging reconciliation action:', error);
  }
}

export async function insertPlatformSale(
  eventId: string,
  platform: PlatformType,
  platformSale: PlatformSale,
  flags?: Partial<LocalSale>
): Promise<void> {
  const payload = {
    event_id: eventId,
    customer_name: platformSale.customerName,
    customer_email: platformSale.customerEmail,
    ticket_quantity: platformSale.quantity,
    ticket_type: platformSale.ticketType,
    total_amount: platformSale.totalAmount,
    platform,
    platform_order_id: platformSale.orderId,
    purchase_date: platformSale.purchaseDate,
    ...flags,
  };

  const { error } = await supabase.from('ticket_sales').insert(payload);

  if (error) throw error;
}

export async function updateSaleAmount(
  saleId: string,
  newAmount: number,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabase
    .from('ticket_sales')
    .update({
      total_amount: newAmount,
      ...metadata,
    })
    .eq('id', saleId);

  if (error) throw error;
}

export async function updateEventHealthStatus(eventId: string, health: SyncHealthStatus): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({
      reconciliation_status: health,
      last_reconciliation: new Date().toISOString(),
    })
    .eq('id', eventId);

  if (error) {
    console.error('Error updating reconciliation health:', error);
  }
}

export async function createReconciliationAlertNotification(report: ReconciliationReport): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      type: 'reconciliation_alert',
      title: 'Reconciliation Alert for Event',
      message: `Critical discrepancies found: ${report.discrepanciesFound} issues detected with ${report.syncHealth} health status`,
      metadata: {
        reportId: report.id,
        eventId: report.eventId,
        platform: report.platform,
        discrepanciesFound: report.discrepanciesFound,
        revenueDifference: Math.abs(report.totalLocalRevenue - report.totalPlatformRevenue),
      },
      severity: report.syncHealth === 'critical' ? 'high' : 'medium',
    });

  if (error) {
    console.error('Error sending reconciliation alert:', error);
  }
}

export async function fetchReconciliationHistory(
  eventId: string,
  limit: number
): Promise<ReconciliationReport[]> {
  const { data, error } = await supabase
    .from('reconciliation_reports')
    .select('*')
    .eq('event_id', eventId)
    .order('start_time', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as ReconciliationReport[];
}

export async function fetchUnresolvedDiscrepancies(
  eventId?: string
): Promise<ReconciliationDiscrepancy[]> {
  let query = supabase
    .from('reconciliation_discrepancies')
    .select('*')
    .is('resolved_at', null);

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query.order('detected_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ReconciliationDiscrepancy[];
}

export async function fetchRecentReports(
  eventId: string,
  limit: number
): Promise<ReconciliationReport[]> {
  const { data, error } = await supabase
    .from('reconciliation_reports')
    .select('*')
    .eq('event_id', eventId)
    .order('start_time', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as ReconciliationReport[];
}

export async function markDiscrepancyResolved(
  discrepancyId: string,
  resolution: 'ignored' | 'platform_updated' | 'manual_review',
  notes: string
): Promise<void> {
  const { error } = await supabase
    .from('reconciliation_discrepancies')
    .update({
      resolution,
      resolved_at: new Date().toISOString(),
      notes,
    })
    .eq('id', discrepancyId);

  if (error) throw error;
}

export async function applyManualAdjustmentMutation(
  eventId: string,
  platform: PlatformType,
  adjustment: ManualAdjustment
): Promise<void> {
  switch (adjustment.type) {
    case 'add_sale': {
      const payload = {
        ...adjustment.data,
        event_id: eventId,
        platform,
        manual_entry: true,
      } as Record<string, unknown>;
      const { error } = await supabase.from('ticket_sales').insert(payload);
      if (error) throw error;
      return;
    }
    case 'remove_sale': {
      if (!adjustment.saleId) return;
      const { error } = await supabase.from('ticket_sales').delete().eq('id', adjustment.saleId);
      if (error) throw error;
      return;
    }
    case 'update_amount': {
      if (!adjustment.saleId || adjustment.data?.total_amount === undefined) return;
      const { error } = await supabase
        .from('ticket_sales')
        .update({
          total_amount: adjustment.data.total_amount,
          manual_adjustment: true,
        })
        .eq('id', adjustment.saleId);
      if (error) throw error;
      return;
    }
  }
}

