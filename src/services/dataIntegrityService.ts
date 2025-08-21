/**
 * Data Integrity Service
 * Ensures data consistency and validates ticket sales data
 */

import { supabase } from '@/integrations/supabase/client';
import { DataIntegrityCheck } from '@/types/reconciliation';

export interface IntegrityRule {
  id: string;
  name: string;
  description: string;
  checkType: 'validation' | 'consistency' | 'orphaned' | 'duplicate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  query: string;
  expectedResult?: 'empty' | 'not_empty' | 'count_zero' | 'count_positive';
  customValidator?: (data: any[]) => any[];
}

class DataIntegrityService {
  private integrityRules: IntegrityRule[] = [
    // Orphaned records checks
    {
      id: 'orphaned_ticket_sales',
      name: 'Orphaned Ticket Sales',
      description: 'Ticket sales referencing non-existent events',
      checkType: 'orphaned',
      severity: 'high',
      query: `
        SELECT ts.* 
        FROM ticket_sales ts 
        LEFT JOIN events e ON ts.event_id = e.id 
        WHERE e.id IS NULL
      `,
      expectedResult: 'empty',
    },
    {
      id: 'orphaned_applications',
      name: 'Orphaned Applications',
      description: 'Applications referencing non-existent events or profiles',
      checkType: 'orphaned',
      severity: 'medium',
      query: `
        SELECT a.* 
        FROM applications a 
        LEFT JOIN events e ON a.event_id = e.id 
        LEFT JOIN profiles p ON a.comedian_id = p.id 
        WHERE e.id IS NULL OR p.id IS NULL
      `,
      expectedResult: 'empty',
    },
    {
      id: 'orphaned_spots',
      name: 'Orphaned Event Spots',
      description: 'Event spots referencing non-existent events',
      checkType: 'orphaned',
      severity: 'medium',
      query: `
        SELECT es.* 
        FROM event_spots es 
        LEFT JOIN events e ON es.event_id = e.id 
        WHERE e.id IS NULL
      `,
      expectedResult: 'empty',
    },

    // Data validation checks
    {
      id: 'negative_amounts',
      name: 'Negative Ticket Amounts',
      description: 'Ticket sales with negative amounts',
      checkType: 'validation',
      severity: 'critical',
      query: `
        SELECT * 
        FROM ticket_sales 
        WHERE total_amount < 0
      `,
      expectedResult: 'empty',
    },
    {
      id: 'zero_ticket_quantity',
      name: 'Zero Ticket Quantities',
      description: 'Ticket sales with zero or negative quantities',
      checkType: 'validation',
      severity: 'high',
      query: `
        SELECT * 
        FROM ticket_sales 
        WHERE ticket_quantity <= 0
      `,
      expectedResult: 'empty',
    },
    {
      id: 'missing_customer_info',
      name: 'Missing Customer Information',
      description: 'Ticket sales missing customer name or email',
      checkType: 'validation',
      severity: 'medium',
      query: `
        SELECT * 
        FROM ticket_sales 
        WHERE customer_name IS NULL 
           OR customer_name = '' 
           OR customer_email IS NULL 
           OR customer_email = ''
      `,
      expectedResult: 'empty',
    },
    {
      id: 'invalid_email_format',
      name: 'Invalid Email Formats',
      description: 'Customer emails that do not follow valid email format',
      checkType: 'validation',
      severity: 'medium',
      query: `
        SELECT * 
        FROM ticket_sales 
        WHERE customer_email IS NOT NULL 
          AND customer_email != ''
          AND customer_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
      `,
      expectedResult: 'empty',
    },

    // Consistency checks
    {
      id: 'event_totals_mismatch',
      name: 'Event Totals Mismatch',
      description: 'Events where calculated totals do not match stored totals',
      checkType: 'consistency',
      severity: 'high',
      query: `
        SELECT 
          e.id,
          e.name,
          e.total_tickets_sold as stored_tickets,
          e.total_gross_sales as stored_revenue,
          COALESCE(SUM(ts.ticket_quantity), 0) as calculated_tickets,
          COALESCE(SUM(ts.total_amount), 0) as calculated_revenue
        FROM events e
        LEFT JOIN ticket_sales ts ON e.id = ts.event_id
        GROUP BY e.id, e.name, e.total_tickets_sold, e.total_gross_sales
        HAVING 
          COALESCE(e.total_tickets_sold, 0) != COALESCE(SUM(ts.ticket_quantity), 0)
          OR ABS(COALESCE(e.total_gross_sales, 0) - COALESCE(SUM(ts.total_amount), 0)) > 0.01
      `,
      expectedResult: 'empty',
    },
    {
      id: 'platform_totals_mismatch',
      name: 'Platform Totals Mismatch',
      description: 'Ticket platforms where calculated totals do not match stored totals',
      checkType: 'consistency',
      severity: 'high',
      query: `
        SELECT 
          tp.id,
          tp.platform,
          tp.event_id,
          tp.tickets_sold as stored_tickets,
          tp.gross_sales as stored_revenue,
          COALESCE(SUM(ts.ticket_quantity), 0) as calculated_tickets,
          COALESCE(SUM(ts.total_amount), 0) as calculated_revenue
        FROM ticket_platforms tp
        LEFT JOIN ticket_sales ts ON tp.event_id = ts.event_id AND tp.platform = ts.platform
        GROUP BY tp.id, tp.platform, tp.event_id, tp.tickets_sold, tp.gross_sales
        HAVING 
          COALESCE(tp.tickets_sold, 0) != COALESCE(SUM(ts.ticket_quantity), 0)
          OR ABS(COALESCE(tp.gross_sales, 0) - COALESCE(SUM(ts.total_amount), 0)) > 0.01
      `,
      expectedResult: 'empty',
    },

    // Duplicate detection
    {
      id: 'duplicate_ticket_sales',
      name: 'Duplicate Ticket Sales',
      description: 'Potential duplicate ticket sales based on order ID and platform',
      checkType: 'duplicate',
      severity: 'medium',
      query: `
        SELECT platform_order_id, platform, COUNT(*) as count
        FROM ticket_sales 
        WHERE platform_order_id IS NOT NULL 
          AND platform_order_id != ''
        GROUP BY platform_order_id, platform
        HAVING COUNT(*) > 1
      `,
      expectedResult: 'empty',
    },
    {
      id: 'duplicate_customer_purchases',
      name: 'Duplicate Customer Purchases',
      description: 'Customers with multiple purchases within short time window',
      checkType: 'duplicate',
      severity: 'low',
      query: `
        SELECT 
          customer_email,
          event_id,
          COUNT(*) as purchase_count,
          array_agg(id) as sale_ids,
          array_agg(purchase_date) as purchase_dates
        FROM ticket_sales 
        GROUP BY customer_email, event_id, DATE_TRUNC('hour', purchase_date::timestamp)
        HAVING COUNT(*) > 1
      `,
      customValidator: (data: any[]) => {
        return data.filter(row => {
          // Check if purchases are within 10 minutes of each other
          const dates = row.purchase_dates.map((d: string) => new Date(d));
          for (let i = 1; i < dates.length; i++) {
            const timeDiff = dates[i].getTime() - dates[i - 1].getTime();
            if (timeDiff < 10 * 60 * 1000) { // 10 minutes
              return true;
            }
          }
          return false;
        });
      },
    },
  ];

  // ==================================
  // INTEGRITY CHECK EXECUTION
  // ==================================

  async runIntegrityCheck(
    checkId?: string,
    eventId?: string
  ): Promise<DataIntegrityCheck> {
    const checkResults: DataIntegrityCheck = {
      id: crypto.randomUUID(),
      eventId: eventId || 'all',
      checkType: checkId ? this.getRuleById(checkId)?.checkType || 'validation' : 'validation',
      status: 'passed',
      issues: [],
      runAt: new Date().toISOString(),
    };

    try {
      const rulesToRun = checkId 
        ? this.integrityRules.filter(rule => rule.id === checkId)
        : this.integrityRules;

      for (const rule of rulesToRun) {
        try {
          const ruleResult = await this.executeRule(rule, eventId);
          if (ruleResult.issues.length > 0) {
            checkResults.issues.push(...ruleResult.issues);
            
            // Update overall status based on severity
            const maxSeverity = this.getMaxSeverity([...checkResults.issues]);
            if (maxSeverity === 'critical' || maxSeverity === 'high') {
              checkResults.status = 'failed';
            } else if (maxSeverity === 'medium' && checkResults.status !== 'failed') {
              checkResults.status = 'warning';
            }
          }
        } catch (error) {
          console.error(`Error executing rule ${rule.id}:`, error);
          checkResults.issues.push({
            type: 'rule_execution_error',
            description: `Failed to execute rule: ${rule.name}`,
            severity: 'high',
            affectedRecords: [],
            suggestedAction: 'Check rule configuration and database connectivity',
          });
          checkResults.status = 'failed';
        }
      }

      // Save check results
      await this.saveIntegrityCheck(checkResults);

      return checkResults;
    } catch (error) {
      console.error('Error running integrity check:', error);
      checkResults.status = 'failed';
      checkResults.issues.push({
        type: 'check_execution_error',
        description: 'Failed to execute integrity check',
        severity: 'critical',
        affectedRecords: [],
        suggestedAction: 'Review system logs and database connectivity',
      });
      return checkResults;
    }
  }

  private async executeRule(rule: IntegrityRule, eventId?: string): Promise<{ issues: any[] }> {
    let query = rule.query;
    
    // Add event filter if specified
    if (eventId && eventId !== 'all') {
      // Simple event filter - would need to be more sophisticated for complex joins
      if (query.toLowerCase().includes('from ticket_sales')) {
        query = query.replace(
          'FROM ticket_sales',
          `FROM ticket_sales WHERE event_id = '${eventId}'`
        );
      } else if (query.toLowerCase().includes('from events')) {
        query = query.replace(
          'FROM events',
          `FROM events WHERE id = '${eventId}'`
        );
      }
    }

    // Execute the query
    const { data, error } = await supabase.rpc('execute_integrity_query', {
      query_text: query
    });

    if (error) {
      throw error;
    }

    const issues = [];
    
    if (rule.expectedResult === 'empty' && data && data.length > 0) {
      // Rule expects no results, but we found some
      issues.push({
        type: rule.id,
        description: rule.description,
        severity: rule.severity,
        affectedRecords: data.map((row: any) => row.id || JSON.stringify(row)),
        suggestedAction: this.getSuggestedAction(rule.id),
      });
    } else if (rule.customValidator) {
      // Use custom validation logic
      const validationResults = rule.customValidator(data);
      if (validationResults.length > 0) {
        issues.push({
          type: rule.id,
          description: rule.description,
          severity: rule.severity,
          affectedRecords: validationResults.map((row: any) => row.id || JSON.stringify(row)),
          suggestedAction: this.getSuggestedAction(rule.id),
        });
      }
    }

    return { issues };
  }

  // ==================================
  // AUTO-CORRECTION CAPABILITIES
  // ==================================

  async autoCorrectIssues(checkId: string, issueTypes: string[]): Promise<number> {
    let correctedCount = 0;

    for (const issueType of issueTypes) {
      try {
        const corrected = await this.autoCorrectIssueType(issueType);
        correctedCount += corrected;
      } catch (error) {
        console.error(`Error auto-correcting ${issueType}:`, error);
      }
    }

    // Log the auto-corrections
    await this.logAutoCorrection(checkId, issueTypes, correctedCount);

    return correctedCount;
  }

  private async autoCorrectIssueType(issueType: string): Promise<number> {
    let correctedCount = 0;

    switch (issueType) {
      case 'event_totals_mismatch':
        correctedCount = await this.correctEventTotals();
        break;
        
      case 'platform_totals_mismatch':
        correctedCount = await this.correctPlatformTotals();
        break;
        
      case 'orphaned_ticket_sales':
        // These require manual review - cannot auto-correct
        break;
        
      default:
        console.warn(`No auto-correction available for issue type: ${issueType}`);
    }

    return correctedCount;
  }

  private async correctEventTotals(): Promise<number> {
    const { data: events, error } = await supabase.rpc('recalculate_event_totals');
    
    if (error) {
      throw error;
    }

    return events?.length || 0;
  }

  private async correctPlatformTotals(): Promise<number> {
    const { data: platforms, error } = await supabase.rpc('recalculate_platform_totals');
    
    if (error) {
      throw error;
    }

    return platforms?.length || 0;
  }

  // ==================================
  // BACKUP AND RECOVERY
  // ==================================

  async createDataBackup(eventId?: string): Promise<string> {
    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    try {
      // Backup ticket sales
      const { data: ticketSales, error: salesError } = await supabase
        .from('ticket_sales')
        .select('*')
        .eq(eventId ? 'event_id' : 'id', eventId || '')
        .order('created_at');

      if (salesError && eventId) throw salesError;

      // Backup events (if specific event)
      let events = null;
      if (eventId) {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;
        events = [eventData];
      }

      // Save backup
      const { error: backupError } = await supabase
        .from('data_backups')
        .insert({
          id: backupId,
          event_id: eventId,
          backup_type: eventId ? 'event' : 'full',
          data: {
            ticket_sales: ticketSales,
            events: events,
            created_at: timestamp,
          },
          created_at: timestamp,
        });

      if (backupError) throw backupError;

      return backupId;
    } catch (error) {
      console.error('Error creating data backup:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupId: string): Promise<void> {
    try {
      // Get backup data
      const { data: backup, error: backupError } = await supabase
        .from('data_backups')
        .select('*')
        .eq('id', backupId)
        .single();

      if (backupError) throw backupError;

      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Log the restore operation
      await this.logDataOperation('restore_backup', {
        backupId,
        backupType: backup.backup_type,
        eventId: backup.event_id,
      });

      // This would be a complex operation requiring careful handling
      // For now, just log the intent
      console.log(`Restore from backup ${backupId} initiated`);
      
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw error;
    }
  }

  // ==================================
  // UTILITY METHODS
  // ==================================

  private getRuleById(ruleId: string): IntegrityRule | undefined {
    return this.integrityRules.find(rule => rule.id === ruleId);
  }

  private getMaxSeverity(issues: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    let maxSeverity = 'low';
    
    for (const issue of issues) {
      const currentIndex = severityOrder.indexOf(issue.severity);
      const maxIndex = severityOrder.indexOf(maxSeverity);
      if (currentIndex > maxIndex) {
        maxSeverity = issue.severity;
      }
    }
    
    return maxSeverity as 'low' | 'medium' | 'high' | 'critical';
  }

  private getSuggestedAction(ruleId: string): string {
    const suggestions: Record<string, string> = {
      'orphaned_ticket_sales': 'Review and reassign to correct event or remove orphaned records',
      'orphaned_applications': 'Review and reassign to correct event/comedian or remove',
      'negative_amounts': 'Review and correct negative amounts - may indicate refunds or data entry errors',
      'zero_ticket_quantity': 'Review zero quantity sales - may indicate administrative entries',
      'missing_customer_info': 'Update missing customer information from order platform',
      'invalid_email_format': 'Correct email format or verify customer information',
      'event_totals_mismatch': 'Recalculate event totals from ticket sales',
      'platform_totals_mismatch': 'Recalculate platform totals from ticket sales',
      'duplicate_ticket_sales': 'Review and remove duplicate entries',
      'duplicate_customer_purchases': 'Review for potential duplicate orders within time window',
    };
    
    return suggestions[ruleId] || 'Review and correct data inconsistency';
  }

  private async saveIntegrityCheck(check: DataIntegrityCheck): Promise<void> {
    const { error } = await supabase
      .from('data_integrity_checks')
      .insert({
        id: check.id,
        event_id: check.eventId,
        check_type: check.checkType,
        status: check.status,
        issues: check.issues,
        run_at: check.runAt,
      });

    if (error) {
      console.error('Error saving integrity check:', error);
    }
  }

  private async logAutoCorrection(
    checkId: string,
    issueTypes: string[],
    correctedCount: number
  ): Promise<void> {
    await this.logDataOperation('auto_correction', {
      checkId,
      issueTypes,
      correctedCount,
    });
  }

  private async logDataOperation(operation: string, metadata: any): Promise<void> {
    const { error } = await supabase
      .from('data_operations_log')
      .insert({
        operation,
        metadata,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error logging data operation:', error);
    }
  }

  // ==================================
  // PUBLIC QUERY METHODS
  // ==================================

  async getIntegrityCheckHistory(eventId?: string, limit: number = 10): Promise<DataIntegrityCheck[]> {
    let query = supabase
      .from('data_integrity_checks')
      .select('*')
      .order('run_at', { ascending: false })
      .limit(limit);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getAvailableRules(): Promise<IntegrityRule[]> {
    return this.integrityRules;
  }

  async getIssuesSummary(eventId?: string): Promise<any> {
    const recentChecks = await this.getIntegrityCheckHistory(eventId, 5);
    
    if (recentChecks.length === 0) {
      return {
        totalIssues: 0,
        criticalIssues: 0,
        lastCheck: null,
        statusTrend: [],
      };
    }

    const latestCheck = recentChecks[0];
    const totalIssues = latestCheck.issues.length;
    const criticalIssues = latestCheck.issues.filter(
      issue => issue.severity === 'critical' || issue.severity === 'high'
    ).length;

    return {
      totalIssues,
      criticalIssues,
      lastCheck: latestCheck.runAt,
      status: latestCheck.status,
      statusTrend: recentChecks.map(check => ({
        date: check.runAt,
        status: check.status,
        issueCount: check.issues.length,
      })),
    };
  }
}

export const dataIntegrityService = new DataIntegrityService();