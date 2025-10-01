import { PlatformType } from '@/types/ticketSales';

export type SyncHealthStatus = 'healthy' | 'warning' | 'critical';

export interface ReconciliationDifference {
  field: string;
  localValue: number;
  platformValue: number;
}

export interface ReconciliationDiscrepancy {
  id: string;
  eventId: string;
  platform: PlatformType;
  type: 'missing_sale' | 'amount_mismatch' | 'duplicate_sale' | 'data_inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  localData?: LocalSale;
  platformData?: PlatformSale;
  difference?: ReconciliationDifference;
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
  syncHealth: SyncHealthStatus;
  details: ReconciliationDiscrepancy[];
  error?: string;
}

export interface ReconciliationConfig {
  autoCorrectThreshold: number;
  duplicateTimeWindow: number;
  alertThreshold: {
    count: number;
    amount: number;
  };
}

export interface ManualAdjustment {
  type: 'add_sale' | 'remove_sale' | 'update_amount';
  saleId?: string;
  data?: Partial<LocalSale> & { total_amount?: number };
  reason: string;
}

export interface LocalSale {
  id: string;
  event_id: string;
  platform_order_id: string;
  total_amount: number;
  purchase_date: string;
  customer_email: string;
  customer_name?: string;
  ticket_type?: string;
  ticket_quantity?: number;
  [key: string]: unknown;
}

export interface PlatformSale {
  orderId: string;
  totalAmount: number;
  purchaseDate: string;
  customerEmail: string;
  customerName?: string;
  ticketType?: string;
  quantity?: number;
  [key: string]: unknown;
}

export interface ReconciliationStats {
  totalReports: number;
  averageDiscrepancies: number;
  resolutionRate: number;
  healthTrend: Array<{ date: string; health: SyncHealthStatus; discrepancies: number }>;
  platformBreakdown: Record<string, {
    reports: number;
    discrepancies: number;
    resolved: number;
  }>;
}

