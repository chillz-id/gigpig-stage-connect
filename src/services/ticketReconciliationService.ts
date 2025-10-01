/**
 * Ticket Sales Reconciliation Service
 * Coordinates reconciliation between local database and external platforms.
 */

import { supabase } from '@/integrations/supabase/client';
import { PlatformType } from '@/types/ticketSales';

import { checkAndSendAlerts } from './ticketReconciliation/alerts';
import { DEFAULT_RECONCILIATION_CONFIG } from './ticketReconciliation/config';
import { detectDiscrepancies } from './ticketReconciliation/discrepancyDetection';
import { resolveDiscrepancies } from './ticketReconciliation/discrepancyResolution';
import { fetchLocalSalesData, fetchPlatformSalesData } from './ticketReconciliation/dataFetchers';
import {
  fetchReconciliationHistory,
  fetchRecentReports,
  fetchUnresolvedDiscrepancies,
  persistReport,
  updateEventHealthStatus,
} from './ticketReconciliation/persistence';
import { calculateSyncHealth, buildReconciliationStats } from './ticketReconciliation/analytics';
import {
  ManualAdjustment,
  ReconciliationConfig,
  ReconciliationReport,
  SyncHealthStatus,
} from './ticketReconciliation/types';
import {
  createManualAdjustment,
  manuallyResolveDiscrepancy,
} from './ticketReconciliation/manualAdjustments';

interface TicketPlatformRecord {
  platform: PlatformType;
  external_event_id: string;
}

class TicketReconciliationService {
  constructor(private readonly config: ReconciliationConfig = DEFAULT_RECONCILIATION_CONFIG) {}

  async reconcileEvent(eventId: string, platform?: PlatformType): Promise<ReconciliationReport[]> {
    const reports: ReconciliationReport[] = [];

    const platformsQuery = (supabase as any)
      .from('ticket_platforms')
      .select('*')
      .eq('event_id', eventId);

    const { data: platforms, error } = platform
      ? await platformsQuery.eq('platform', platform)
      : await platformsQuery;

    if (error) throw error;
    const platformConfigs = (platforms || []) as TicketPlatformRecord[];

    if (platformConfigs.length === 0) {
      console.log(`No platforms to reconcile for event ${eventId}`);
      return reports;
    }

    for (const platformConfig of platformConfigs) {
      const report = await this.reconcilePlatform(
        eventId,
        platformConfig.platform as PlatformType,
        platformConfig.external_event_id
      );
      reports.push(report);
    }

    await this.updateReconciliationHealth(eventId, reports);

    return reports;
  }

  private async reconcilePlatform(
    eventId: string,
    platform: PlatformType,
    externalEventId: string
  ): Promise<ReconciliationReport> {
    const startTime = new Date().toISOString();
    const report: ReconciliationReport = {
      id: crypto.randomUUID(),
      eventId,
      platform,
      startTime,
      endTime: '',
      status: 'running',
      totalLocalSales: 0,
      totalPlatformSales: 0,
      totalLocalRevenue: 0,
      totalPlatformRevenue: 0,
      discrepanciesFound: 0,
      discrepanciesResolved: 0,
      syncHealth: 'healthy',
      details: [],
    };

    try {
      await persistReport(report);

      const localSales = await fetchLocalSalesData(eventId, platform);
      report.totalLocalSales = localSales.length;
      report.totalLocalRevenue = localSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

      const platformSales = await fetchPlatformSalesData(platform, externalEventId);
      report.totalPlatformSales = platformSales.length;
      report.totalPlatformRevenue = platformSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

      const discrepancies = detectDiscrepancies({
        eventId,
        platform,
        localSales,
        platformSales,
        config: this.config,
      });

      report.details = discrepancies;
      report.discrepanciesFound = discrepancies.length;

      report.discrepanciesResolved = await resolveDiscrepancies(discrepancies, this.config);
      report.syncHealth = calculateSyncHealth(report);
      report.status = 'completed';
      report.endTime = new Date().toISOString();

      await persistReport(report);
      await checkAndSendAlerts(report, this.config);

      return report;
    } catch (error) {
      report.status = 'failed';
      report.endTime = new Date().toISOString();
      report.error = error instanceof Error ? error.message : 'Unknown error';
      await persistReport(report);
      throw error;
    }
  }

  async getReconciliationHistory(eventId: string, limit: number = 10): Promise<ReconciliationReport[]> {
    return fetchReconciliationHistory(eventId, limit);
  }

  async getUnresolvedDiscrepancies(eventId?: string) {
    return fetchUnresolvedDiscrepancies(eventId);
  }

  async getReconciliationStats(eventId: string) {
    const reports = await fetchRecentReports(eventId, 30);
    return buildReconciliationStats(reports);
  }

  async manuallyResolveDiscrepancy(
    discrepancyId: string,
    resolution: 'ignored' | 'platform_updated' | 'manual_review',
    notes: string
  ): Promise<void> {
    await manuallyResolveDiscrepancy(discrepancyId, resolution, notes);
  }

  async createManualAdjustment(
    eventId: string,
    platform: PlatformType,
    adjustment: ManualAdjustment
  ): Promise<void> {
    await createManualAdjustment(eventId, platform, adjustment);
  }

  private async updateReconciliationHealth(
    eventId: string,
    reports: ReconciliationReport[]
  ): Promise<void> {
    const overallHealth = reports.reduce<SyncHealthStatus>((health, report) => {
      if (report.syncHealth === 'critical' || health === 'critical') return 'critical';
      if (report.syncHealth === 'warning' || health === 'warning') return 'warning';
      return health;
    }, 'healthy');

    await updateEventHealthStatus(eventId, overallHealth);
  }
}

export const ticketReconciliationService = new TicketReconciliationService();
