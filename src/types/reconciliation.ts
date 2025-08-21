import { PlatformType } from './ticketSales';

export interface ReconciliationDiscrepancy {
  id: string;
  reportId: string;
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

export interface ReconciliationStats {
  totalReports: number;
  averageDiscrepancies: number;
  resolutionRate: number;
  healthTrend: Array<{
    date: string;
    health: 'healthy' | 'warning' | 'critical';
    discrepancies: number;
  }>;
  platformBreakdown: Record<string, {
    reports: number;
    discrepancies: number;
    resolved: number;
  }>;
}

export interface DataIntegrityCheck {
  id: string;
  eventId: string;
  checkType: 'duplicate_detection' | 'data_validation' | 'orphaned_records' | 'consistency_check';
  status: 'passed' | 'failed' | 'warning';
  issues: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    affectedRecords: string[];
    suggestedAction?: string;
  }>;
  runAt: string;
}

export interface ReconciliationConfig {
  autoCorrectThreshold: number;
  duplicateTimeWindow: number;
  alertThreshold: {
    count: number;
    amount: number;
  };
  scheduleInterval: number; // in minutes
  enabledPlatforms: PlatformType[];
}

export interface ManualAdjustment {
  type: 'add_sale' | 'remove_sale' | 'update_amount';
  saleId?: string;
  data?: any;
  reason: string;
}

export interface AuditLogEntry {
  id: string;
  eventId: string;
  action: string;
  description: string;
  metadata?: any;
  createdAt: string;
  userId?: string;
}

export interface ReconciliationAlert {
  id: string;
  eventId: string;
  reportId: string;
  type: 'critical_discrepancies' | 'sync_failure' | 'data_inconsistency';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}