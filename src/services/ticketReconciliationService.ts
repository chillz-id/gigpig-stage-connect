/**
 * Ticket Sales Reconciliation Service
 * Ensures data accuracy between local database and external platforms
 */

import { supabase } from '@/integrations/supabase/client';
import { PlatformType } from '@/types/ticketSales';
import { humanitixApiService } from './humanitixApiService';
import { eventbriteApiService } from './eventbriteApiService';

export interface ReconciliationDiscrepancy {
  id: string;
  eventId: string;
  platform: PlatformType;
  type: 'missing_sale' | 'amount_mismatch' | 'duplicate_sale' | 'data_inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  localData?: any;
  platformData?: any;
  difference?: {
    field: string;
    localValue: any;
    platformValue: any;
  };
  detectedAt: string;
  resolvedAt?: string;
  resolution?: 'auto_corrected' | 'manual_review' | 'ignored' | 'platform_updated';
  notes?: string;
}

export interface ReconciliationReport {
  id: string;
  eventId: string;
  platform: PlatformType;
  startTime: string;
  endTime: string;
  status: 'running' | 'completed' | 'failed';
  totalLocalSales: number;
  totalPlatformSales: number;
  totalLocalRevenue: number;
  totalPlatformRevenue: number;
  discrepanciesFound: number;
  discrepanciesResolved: number;
  syncHealth: 'healthy' | 'warning' | 'critical';
  details: ReconciliationDiscrepancy[];
  error?: string;
}

export interface ReconciliationConfig {
  autoCorrectThreshold: number; // Amount difference threshold for auto-correction
  duplicateTimeWindow: number; // Minutes to consider for duplicate detection
  alertThreshold: {
    count: number; // Number of discrepancies
    amount: number; // Total amount difference
  };
}

class TicketReconciliationService {
  private config: ReconciliationConfig = {
    autoCorrectThreshold: 0.01, // $0.01 difference
    duplicateTimeWindow: 5, // 5 minutes
    alertThreshold: {
      count: 10,
      amount: 100, // $100
    },
  };

  // ==================================
  // RECONCILIATION ORCHESTRATION
  // ==================================

  async reconcileEvent(eventId: string, platform?: PlatformType): Promise<ReconciliationReport[]> {
    const reports: ReconciliationReport[] = [];

    try {
      // Get platforms to reconcile
      let platformsQuery = supabase
        .from('ticket_platforms')
        .select('*')
        .eq('event_id', eventId);

      if (platform) {
        platformsQuery = platformsQuery.eq('platform', platform);
      }

      const { data: platforms, error } = await platformsQuery;

      if (error) throw error;

      if (!platforms || platforms.length === 0) {
        console.log(`No platforms to reconcile for event ${eventId}`);
        return reports;
      }

      // Reconcile each platform
      for (const platformConfig of platforms) {
        const report = await this.reconcilePlatform(
          eventId,
          platformConfig.platform as PlatformType,
          platformConfig.external_event_id
        );
        reports.push(report);
      }

      // Check overall reconciliation health
      await this.updateReconciliationHealth(eventId, reports);

      return reports;
    } catch (error) {
      console.error('Error reconciling event:', error);
      throw error;
    }
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
      // Save initial report
      await this.saveReconciliationReport(report);

      // Get local sales data
      const localSales = await this.getLocalSalesData(eventId, platform);
      report.totalLocalSales = localSales.length;
      report.totalLocalRevenue = localSales.reduce((sum, sale) => sum + sale.total_amount, 0);

      // Get platform sales data
      const platformSales = await this.getPlatformSalesData(platform, externalEventId);
      report.totalPlatformSales = platformSales.length;
      report.totalPlatformRevenue = platformSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

      // Find discrepancies
      const discrepancies = await this.findDiscrepancies(
        eventId,
        platform,
        localSales,
        platformSales
      );
      report.details = discrepancies;
      report.discrepanciesFound = discrepancies.length;

      // Attempt to resolve discrepancies
      const resolved = await this.resolveDiscrepancies(discrepancies);
      report.discrepanciesResolved = resolved;

      // Determine sync health
      report.syncHealth = this.calculateSyncHealth(report);

      // Complete report
      report.status = 'completed';
      report.endTime = new Date().toISOString();

      await this.saveReconciliationReport(report);

      // Send alerts if needed
      await this.checkAndSendAlerts(report);

      return report;
    } catch (error) {
      report.status = 'failed';
      report.endTime = new Date().toISOString();
      report.error = error instanceof Error ? error.message : 'Unknown error';
      await this.saveReconciliationReport(report);
      throw error;
    }
  }

  // ==================================
  // DATA RETRIEVAL
  // ==================================

  private async getLocalSalesData(eventId: string, platform: PlatformType): Promise<any[]> {
    const { data, error } = await supabase
      .from('ticket_sales')
      .select('*')
      .eq('event_id', eventId)
      .eq('platform', platform)
      .order('purchase_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private async getPlatformSalesData(platform: PlatformType, externalEventId: string): Promise<any[]> {
    switch (platform) {
      case 'humanitix':
        return await humanitixApiService.getAllOrdersForEvent(externalEventId);
      case 'eventbrite':
        return await eventbriteApiService.getAllOrdersForEvent(externalEventId);
      default:
        return [];
    }
  }

  // ==================================
  // DISCREPANCY DETECTION
  // ==================================

  private async findDiscrepancies(
    eventId: string,
    platform: PlatformType,
    localSales: any[],
    platformSales: any[]
  ): Promise<ReconciliationDiscrepancy[]> {
    const discrepancies: ReconciliationDiscrepancy[] = [];

    // Create maps for efficient lookup
    const localSalesMap = new Map(
      localSales.map(sale => [sale.platform_order_id, sale])
    );
    const platformSalesMap = new Map(
      platformSales.map(sale => [sale.orderId, sale])
    );

    // Check for missing sales in local database
    for (const platformSale of platformSales) {
      if (!localSalesMap.has(platformSale.orderId)) {
        discrepancies.push({
          id: crypto.randomUUID(),
          eventId,
          platform,
          type: 'missing_sale',
          severity: 'high',
          platformData: platformSale,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // Check for sales in local but not in platform (potential data issues)
    for (const localSale of localSales) {
      const platformSale = platformSalesMap.get(localSale.platform_order_id);
      
      if (!platformSale) {
        discrepancies.push({
          id: crypto.randomUUID(),
          eventId,
          platform,
          type: 'data_inconsistency',
          severity: 'medium',
          localData: localSale,
          detectedAt: new Date().toISOString(),
        });
      } else {
        // Check for amount mismatches
        const amountDiff = Math.abs(localSale.total_amount - platformSale.totalAmount);
        if (amountDiff > this.config.autoCorrectThreshold) {
          discrepancies.push({
            id: crypto.randomUUID(),
            eventId,
            platform,
            type: 'amount_mismatch',
            severity: amountDiff > 10 ? 'high' : 'medium',
            localData: localSale,
            platformData: platformSale,
            difference: {
              field: 'total_amount',
              localValue: localSale.total_amount,
              platformValue: platformSale.totalAmount,
            },
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Check for duplicates
    const duplicates = await this.findDuplicateSales(localSales);
    for (const duplicate of duplicates) {
      discrepancies.push({
        id: crypto.randomUUID(),
        eventId,
        platform,
        type: 'duplicate_sale',
        severity: 'medium',
        localData: duplicate,
        detectedAt: new Date().toISOString(),
      });
    }

    return discrepancies;
  }

  private async findDuplicateSales(sales: any[]): Promise<any[]> {
    const duplicates: any[] = [];
    const salesByCustomer = new Map<string, any[]>();

    // Group sales by customer email
    for (const sale of sales) {
      const key = `${sale.customer_email}_${sale.total_amount}`;
      if (!salesByCustomer.has(key)) {
        salesByCustomer.set(key, []);
      }
      salesByCustomer.get(key)!.push(sale);
    }

    // Find potential duplicates
    for (const [_, customerSales] of salesByCustomer) {
      if (customerSales.length > 1) {
        // Check if purchases are within time window
        for (let i = 1; i < customerSales.length; i++) {
          const timeDiff = new Date(customerSales[i].purchase_date).getTime() -
                          new Date(customerSales[i - 1].purchase_date).getTime();
          if (timeDiff < this.config.duplicateTimeWindow * 60 * 1000) {
            duplicates.push(customerSales[i]);
          }
        }
      }
    }

    return duplicates;
  }

  // ==================================
  // DISCREPANCY RESOLUTION
  // ==================================

  private async resolveDiscrepancies(discrepancies: ReconciliationDiscrepancy[]): Promise<number> {
    let resolved = 0;

    for (const discrepancy of discrepancies) {
      try {
        const wasResolved = await this.resolveDiscrepancy(discrepancy);
        if (wasResolved) {
          resolved++;
        }
      } catch (error) {
        console.error(`Failed to resolve discrepancy ${discrepancy.id}:`, error);
      }
    }

    return resolved;
  }

  private async resolveDiscrepancy(discrepancy: ReconciliationDiscrepancy): Promise<boolean> {
    switch (discrepancy.type) {
      case 'missing_sale':
        // Auto-import missing sale from platform
        if (discrepancy.platformData) {
          await this.importMissingSale(discrepancy);
          discrepancy.resolution = 'auto_corrected';
          discrepancy.resolvedAt = new Date().toISOString();
          await this.updateDiscrepancy(discrepancy);
          return true;
        }
        break;

      case 'amount_mismatch':
        // Auto-correct small differences
        if (discrepancy.difference && 
            Math.abs(discrepancy.difference.localValue - discrepancy.difference.platformValue) <= this.config.autoCorrectThreshold) {
          await this.correctAmount(discrepancy);
          discrepancy.resolution = 'auto_corrected';
          discrepancy.resolvedAt = new Date().toISOString();
          await this.updateDiscrepancy(discrepancy);
          return true;
        }
        break;

      case 'duplicate_sale':
        // Flag for manual review
        discrepancy.resolution = 'manual_review';
        await this.updateDiscrepancy(discrepancy);
        break;

      case 'data_inconsistency':
        // Flag for manual review
        discrepancy.resolution = 'manual_review';
        await this.updateDiscrepancy(discrepancy);
        break;
    }

    return false;
  }

  private async importMissingSale(discrepancy: ReconciliationDiscrepancy): Promise<void> {
    const platformSale = discrepancy.platformData;
    
    const { error } = await supabase
      .from('ticket_sales')
      .insert({
        event_id: discrepancy.eventId,
        customer_name: platformSale.customerName,
        customer_email: platformSale.customerEmail,
        ticket_quantity: platformSale.quantity,
        ticket_type: platformSale.ticketType,
        total_amount: platformSale.totalAmount,
        platform: discrepancy.platform,
        platform_order_id: platformSale.orderId,
        purchase_date: platformSale.purchaseDate,
        reconciliation_import: true,
      });

    if (error) throw error;

    // Log the import
    await this.logReconciliationAction(
      discrepancy.eventId,
      'import_sale',
      `Imported missing sale ${platformSale.orderId} from ${discrepancy.platform}`,
      { discrepancyId: discrepancy.id, platformSale }
    );
  }

  private async correctAmount(discrepancy: ReconciliationDiscrepancy): Promise<void> {
    if (!discrepancy.localData || !discrepancy.difference) return;

    const { error } = await supabase
      .from('ticket_sales')
      .update({
        total_amount: discrepancy.difference.platformValue,
        reconciliation_corrected: true,
        reconciliation_corrected_at: new Date().toISOString(),
      })
      .eq('id', discrepancy.localData.id);

    if (error) throw error;

    // Log the correction
    await this.logReconciliationAction(
      discrepancy.eventId,
      'correct_amount',
      `Corrected amount for sale ${discrepancy.localData.platform_order_id}`,
      { 
        discrepancyId: discrepancy.id,
        oldAmount: discrepancy.difference.localValue,
        newAmount: discrepancy.difference.platformValue,
      }
    );
  }

  // ==================================
  // REPORTING AND ANALYTICS
  // ==================================

  private calculateSyncHealth(report: ReconciliationReport): 'healthy' | 'warning' | 'critical' {
    const discrepancyRate = report.totalLocalSales > 0 
      ? report.discrepanciesFound / report.totalLocalSales 
      : 0;
    
    const revenueDiff = Math.abs(report.totalLocalRevenue - report.totalPlatformRevenue);
    const revenueDiscrepancyRate = report.totalPlatformRevenue > 0
      ? revenueDiff / report.totalPlatformRevenue
      : 0;

    // Critical if more than 10% discrepancy rate or 5% revenue difference
    if (discrepancyRate > 0.1 || revenueDiscrepancyRate > 0.05) {
      return 'critical';
    }
    
    // Warning if more than 5% discrepancy rate or 2% revenue difference
    if (discrepancyRate > 0.05 || revenueDiscrepancyRate > 0.02) {
      return 'warning';
    }

    return 'healthy';
  }

  private async updateReconciliationHealth(eventId: string, reports: ReconciliationReport[]): Promise<void> {
    const overallHealth = reports.reduce((health, report) => {
      if (report.syncHealth === 'critical' || health === 'critical') return 'critical';
      if (report.syncHealth === 'warning' || health === 'warning') return 'warning';
      return 'healthy';
    }, 'healthy' as 'healthy' | 'warning' | 'critical');

    const { error } = await supabase
      .from('events')
      .update({
        reconciliation_status: overallHealth,
        last_reconciliation: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) {
      console.error('Error updating reconciliation health:', error);
    }
  }

  // ==================================
  // PERSISTENCE AND LOGGING
  // ==================================

  private async saveReconciliationReport(report: ReconciliationReport): Promise<void> {
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

    // Save discrepancies
    for (const discrepancy of report.details) {
      await this.saveDiscrepancy(report.id, discrepancy);
    }
  }

  private async saveDiscrepancy(reportId: string, discrepancy: ReconciliationDiscrepancy): Promise<void> {
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

  private async updateDiscrepancy(discrepancy: ReconciliationDiscrepancy): Promise<void> {
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

  private async logReconciliationAction(
    eventId: string,
    action: string,
    description: string,
    metadata?: any
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

  // ==================================
  // ALERTS AND NOTIFICATIONS
  // ==================================

  private async checkAndSendAlerts(report: ReconciliationReport): Promise<void> {
    const shouldAlert = 
      report.syncHealth === 'critical' ||
      report.discrepanciesFound > this.config.alertThreshold.count ||
      Math.abs(report.totalLocalRevenue - report.totalPlatformRevenue) > this.config.alertThreshold.amount;

    if (shouldAlert) {
      await this.sendReconciliationAlert(report);
    }
  }

  private async sendReconciliationAlert(report: ReconciliationReport): Promise<void> {
    // Create notification
    const { error } = await supabase
      .from('notifications')
      .insert({
        type: 'reconciliation_alert',
        title: `Reconciliation Alert for Event`,
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

  // ==================================
  // PUBLIC QUERY METHODS
  // ==================================

  async getReconciliationHistory(
    eventId: string,
    limit: number = 10
  ): Promise<ReconciliationReport[]> {
    const { data, error } = await supabase
      .from('reconciliation_reports')
      .select('*')
      .eq('event_id', eventId)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getUnresolvedDiscrepancies(eventId?: string): Promise<ReconciliationDiscrepancy[]> {
    let query = supabase
      .from('reconciliation_discrepancies')
      .select('*')
      .is('resolved_at', null);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query
      .order('detected_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getReconciliationStats(eventId: string): Promise<any> {
    const { data: reports, error } = await supabase
      .from('reconciliation_reports')
      .select('*')
      .eq('event_id', eventId)
      .order('start_time', { ascending: false })
      .limit(30);

    if (error) throw error;

    const stats = {
      totalReports: reports?.length || 0,
      averageDiscrepancies: 0,
      resolutionRate: 0,
      healthTrend: [] as any[],
      platformBreakdown: {} as any,
    };

    if (reports && reports.length > 0) {
      const totalDiscrepancies = reports.reduce((sum, r) => sum + r.discrepancies_found, 0);
      const totalResolved = reports.reduce((sum, r) => sum + r.discrepancies_resolved, 0);
      
      stats.averageDiscrepancies = totalDiscrepancies / reports.length;
      stats.resolutionRate = totalDiscrepancies > 0 ? totalResolved / totalDiscrepancies : 1;
      
      stats.healthTrend = reports.map(r => ({
        date: r.start_time,
        health: r.sync_health,
        discrepancies: r.discrepancies_found,
      }));

      // Group by platform
      reports.forEach(r => {
        if (!stats.platformBreakdown[r.platform]) {
          stats.platformBreakdown[r.platform] = {
            reports: 0,
            discrepancies: 0,
            resolved: 0,
          };
        }
        stats.platformBreakdown[r.platform].reports++;
        stats.platformBreakdown[r.platform].discrepancies += r.discrepancies_found;
        stats.platformBreakdown[r.platform].resolved += r.discrepancies_resolved;
      });
    }

    return stats;
  }

  // ==================================
  // MANUAL CORRECTION INTERFACE
  // ==================================

  async manuallyResolveDiscrepancy(
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

  async createManualAdjustment(
    eventId: string,
    platform: PlatformType,
    adjustment: {
      type: 'add_sale' | 'remove_sale' | 'update_amount';
      saleId?: string;
      data?: any;
      reason: string;
    }
  ): Promise<void> {
    // Log the manual adjustment
    await this.logReconciliationAction(
      eventId,
      `manual_${adjustment.type}`,
      adjustment.reason,
      adjustment
    );

    // Apply the adjustment
    switch (adjustment.type) {
      case 'add_sale':
        await supabase
          .from('ticket_sales')
          .insert({
            ...adjustment.data,
            event_id: eventId,
            platform,
            manual_entry: true,
          });
        break;
        
      case 'remove_sale':
        if (adjustment.saleId) {
          await supabase
            .from('ticket_sales')
            .delete()
            .eq('id', adjustment.saleId);
        }
        break;
        
      case 'update_amount':
        if (adjustment.saleId && adjustment.data?.total_amount !== undefined) {
          await supabase
            .from('ticket_sales')
            .update({
              total_amount: adjustment.data.total_amount,
              manual_adjustment: true,
            })
            .eq('id', adjustment.saleId);
        }
        break;
    }
  }
}

export const ticketReconciliationService = new TicketReconciliationService();