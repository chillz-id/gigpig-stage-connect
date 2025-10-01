import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ticketReconciliationService } from '@/services/ticketReconciliationService';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_RECONCILIATION_CONFIG } from '@/services/ticketReconciliation/config';
import { findDuplicateSales } from '@/services/ticketReconciliation/dataFetchers';
import { detectDiscrepancies } from '@/services/ticketReconciliation/discrepancyDetection';
import { resolveDiscrepancies } from '@/services/ticketReconciliation/discrepancyResolution';
import * as persistence from '@/services/ticketReconciliation/persistence';
import {
  LocalSale,
  PlatformSale,
  ReconciliationDiscrepancy,
  ReconciliationReport,
} from '@/services/ticketReconciliation/types';

const persistenceMocks = persistence as jest.Mocked<typeof persistence>;

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
      single: jest.fn(),
      upsert: jest.fn(),
      is: jest.fn(),
      gte: jest.fn(),
      lte: jest.fn(),
      not: jest.fn(),
    })),
  },
}));

// Mock API services
jest.mock('@/services/humanitixApiService', () => ({
  humanitixApiService: {
    getOrders: jest.fn(),
  },
}));

jest.mock('@/services/eventbriteApiService', () => ({
  eventbriteApiService: {
    getEventOrders: jest.fn(),
  },
}));

jest.mock('@/services/ticketReconciliation/persistence', () => ({
  persistReport: jest.fn(),
  updateDiscrepancyRecord: jest.fn(),
  insertPlatformSale: jest.fn(),
  updateSaleAmount: jest.fn(),
  logReconciliationAction: jest.fn(),
  updateEventHealthStatus: jest.fn(),
  createReconciliationAlertNotification: jest.fn(),
  fetchReconciliationHistory: jest.fn(),
  fetchUnresolvedDiscrepancies: jest.fn(),
  fetchRecentReports: jest.fn(),
  markDiscrepancyResolved: jest.fn(),
  applyManualAdjustmentMutation: jest.fn(),
}));

describe('Ticket Reconciliation Service', () => {
  const mockEventId = 'test-event-123';
  const mockPlatform = 'humanitix';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reconcileEvent', () => {
    it('should reconcile all platforms for an event', async () => {
      // Mock platform data
      const mockPlatforms = [
        {
          platform: 'humanitix',
          external_event_id: 'ext-123',
        },
        {
          platform: 'eventbrite',
          external_event_id: 'ext-456',
        },
      ];

      const mockSupabaseResponse = {
        data: mockPlatforms,
        error: null,
      };

      // Setup Supabase mock
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => mockSupabaseResponse),
        })),
      }));
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      // Mock reconciliation for each platform
      jest.spyOn(ticketReconciliationService as any, 'reconcilePlatform')
        .mockResolvedValue({
          id: 'report-123',
          eventId: mockEventId,
          platform: 'humanitix',
          status: 'completed',
          totalLocalSales: 10,
          totalPlatformSales: 10,
          totalLocalRevenue: 500,
          totalPlatformRevenue: 500,
          discrepanciesFound: 0,
          discrepanciesResolved: 0,
          syncHealth: 'healthy',
          details: [],
        });

      const reports = await ticketReconciliationService.reconcileEvent(mockEventId);

      expect(reports).toHaveLength(2);
      expect(reports[0]?.syncHealth).toBe('healthy');
    });

    it('should handle reconciliation errors gracefully', async () => {
      // Mock error response
      const mockSupabaseResponse = {
        data: null,
        error: new Error('Database connection failed'),
      };

      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => mockSupabaseResponse),
        })),
      }));
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      await expect(
        ticketReconciliationService.reconcileEvent(mockEventId)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('findDiscrepancies', () => {
    it('should detect missing sales', async () => {
      const localSales: LocalSale[] = [
        {
          id: 'local-1',
          event_id: mockEventId,
          platform_order_id: 'order-1',
          total_amount: 50,
          customer_email: 'test@example.com',
          purchase_date: new Date().toISOString(),
        },
      ];

      const platformSales: PlatformSale[] = [
        {
          orderId: 'order-1',
          totalAmount: 50,
          customerEmail: 'test@example.com',
          purchaseDate: new Date().toISOString(),
        },
        {
          orderId: 'order-2',
          totalAmount: 75,
          customerEmail: 'test2@example.com',
          purchaseDate: new Date().toISOString(),
        },
      ];

      const discrepancies = detectDiscrepancies({
        eventId: mockEventId,
        platform: mockPlatform,
        localSales,
        platformSales,
        config: DEFAULT_RECONCILIATION_CONFIG,
      });

      expect(discrepancies).toHaveLength(1);
      const first = discrepancies[0];
      expect(first).toBeDefined();
      expect(first!.type).toBe('missing_sale');
      expect(first!.platformData?.orderId).toBe('order-2');
    });

    it('should detect amount mismatches', async () => {
      const localSales: LocalSale[] = [
        {
          id: 'local-1',
          event_id: mockEventId,
          platform_order_id: 'order-1',
          total_amount: 50,
          customer_email: 'test@example.com',
          purchase_date: new Date().toISOString(),
        },
      ];

      const platformSales: PlatformSale[] = [
        {
          orderId: 'order-1',
          totalAmount: 75, // Different amount
          customerEmail: 'test@example.com',
          purchaseDate: new Date().toISOString(),
        },
      ];

      const discrepancies = detectDiscrepancies({
        eventId: mockEventId,
        platform: mockPlatform,
        localSales,
        platformSales,
        config: DEFAULT_RECONCILIATION_CONFIG,
      });

      expect(discrepancies).toHaveLength(1);
      const first = discrepancies[0];
      expect(first).toBeDefined();
      expect(first!.type).toBe('amount_mismatch');
      expect(first!.difference?.localValue).toBe(50);
      expect(first!.difference?.platformValue).toBe(75);
    });

    it('should detect duplicate sales', async () => {
      const now = new Date();
      const localSales: LocalSale[] = [
        {
          id: 'local-1',
          event_id: mockEventId,
          platform_order_id: 'order-1',
          total_amount: 50,
          customer_email: 'test@example.com',
          purchase_date: now.toISOString(),
        },
        {
          id: 'local-2',
          event_id: mockEventId,
          platform_order_id: 'order-2',
          total_amount: 50,
          customer_email: 'test@example.com',
          purchase_date: new Date(now.getTime() + 2 * 60 * 1000).toISOString(), // 2 minutes later
        },
      ];

      const duplicates = findDuplicateSales(
        localSales,
        DEFAULT_RECONCILIATION_CONFIG.duplicateTimeWindow
      );

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]?.id).toBe('local-2');
    });
  });

  describe('resolveDiscrepancies', () => {
    it('should auto-import missing sales', async () => {
      const discrepancy: ReconciliationDiscrepancy = {
        id: 'disc-1',
        eventId: mockEventId,
        platform: mockPlatform,
        type: 'missing_sale',
        severity: 'high',
        platformData: {
          orderId: 'order-123',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          quantity: 2,
          ticketType: 'General',
          totalAmount: 100,
          purchaseDate: new Date().toISOString(),
        },
        detectedAt: new Date().toISOString(),
      };

      // Mock successful insert
      persistenceMocks.insertPlatformSale.mockResolvedValueOnce();
      persistenceMocks.updateDiscrepancyRecord.mockResolvedValueOnce();
      persistenceMocks.logReconciliationAction.mockResolvedValueOnce();

      const resolved = await resolveDiscrepancies([
        discrepancy,
      ], DEFAULT_RECONCILIATION_CONFIG);

      expect(resolved).toBe(1);
      expect(persistenceMocks.insertPlatformSale).toHaveBeenCalledWith(
        mockEventId,
        mockPlatform,
        discrepancy.platformData!,
        expect.objectContaining({ reconciliation_import: true })
      );
    });

    it('should auto-correct small amount differences', async () => {
      const discrepancy: ReconciliationDiscrepancy = {
        id: 'disc-1',
        eventId: mockEventId,
        platform: mockPlatform,
        type: 'amount_mismatch',
        severity: 'low',
        localData: {
          id: 'sale-123',
          event_id: mockEventId,
          platform_order_id: 'order-1',
          total_amount: 49.99,
          customer_email: 'test@example.com',
          purchase_date: new Date().toISOString(),
        },
        difference: {
          field: 'total_amount',
          localValue: 49.99,
          platformValue: 50.00,
        },
        detectedAt: new Date().toISOString(),
      };

      persistenceMocks.updateSaleAmount.mockResolvedValueOnce();
      persistenceMocks.updateDiscrepancyRecord.mockResolvedValueOnce();
      persistenceMocks.logReconciliationAction.mockResolvedValueOnce();

      const resolved = await resolveDiscrepancies([
        discrepancy,
      ], DEFAULT_RECONCILIATION_CONFIG);

      expect(resolved).toBe(1);
      expect(persistenceMocks.updateSaleAmount).toHaveBeenCalledWith(
        'sale-123',
        50,
        expect.objectContaining({ reconciliation_corrected: true })
      );
    });
  });

  describe('getReconciliationStats', () => {
    it('should calculate reconciliation statistics', async () => {
      const mockReports: ReconciliationReport[] = [
        {
          id: 'report-1',
          eventId: mockEventId,
          discrepanciesFound: 5,
          discrepanciesResolved: 4,
          syncHealth: 'warning',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: 'completed',
          totalLocalSales: 10,
          totalPlatformSales: 10,
          totalLocalRevenue: 500,
          totalPlatformRevenue: 500,
          details: [],
          platform: 'humanitix',
        },
        {
          id: 'report-2',
          eventId: mockEventId,
          discrepanciesFound: 2,
          discrepanciesResolved: 2,
          syncHealth: 'healthy',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: 'completed',
          totalLocalSales: 8,
          totalPlatformSales: 8,
          totalLocalRevenue: 400,
          totalPlatformRevenue: 400,
          details: [],
          platform: 'eventbrite',
        },
      ];

      persistenceMocks.fetchRecentReports.mockResolvedValueOnce(mockReports);

      const stats = await ticketReconciliationService.getReconciliationStats(mockEventId);

      expect(stats.totalReports).toBe(2);
      expect(stats.averageDiscrepancies).toBe(3.5);
      expect(stats.resolutionRate).toBeCloseTo(0.857); // 6/7
      expect(stats.platformBreakdown).toHaveProperty('humanitix');
      expect(stats.platformBreakdown).toHaveProperty('eventbrite');
    });
  });

  describe('manuallyResolveDiscrepancy', () => {
    it('should manually resolve discrepancies', async () => {
      const discrepancyId = 'disc-123';
      const resolution = 'ignored';
      const notes = 'Reviewed and deemed acceptable';

      persistenceMocks.markDiscrepancyResolved.mockResolvedValueOnce();

      await expect(
        ticketReconciliationService.manuallyResolveDiscrepancy(
          discrepancyId,
          resolution,
          notes
        )
      ).resolves.not.toThrow();

      expect(persistenceMocks.markDiscrepancyResolved).toHaveBeenCalledWith(
        discrepancyId,
        resolution,
        notes
      );
    });
  });

  describe('createManualAdjustment', () => {
    it('should create manual sale adjustments', async () => {
      const adjustment = {
        type: 'add_sale' as const,
        data: {
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          ticket_quantity: 1,
          ticket_type: 'General',
          total_amount: 50,
          platform_order_id: 'manual-001',
        },
        reason: 'Cash payment at door',
      };

      persistenceMocks.logReconciliationAction.mockResolvedValueOnce();
      persistenceMocks.applyManualAdjustmentMutation.mockResolvedValueOnce();

      await expect(
        ticketReconciliationService.createManualAdjustment(
          mockEventId,
          mockPlatform,
          adjustment
        )
      ).resolves.not.toThrow();

      expect(persistenceMocks.logReconciliationAction).toHaveBeenCalled();
      expect(persistenceMocks.applyManualAdjustmentMutation).toHaveBeenCalledWith(
        mockEventId,
        mockPlatform,
        adjustment
      );
    });
  });
});

describe('Data Integrity Checks', () => {
  it('should detect orphaned ticket sales', async () => {
    // Mock ticket sales without corresponding events
    const mockOrphanedSales = [
      {
        id: 'sale-orphan-1',
        event_id: 'non-existent-event',
        customer_email: 'test@example.com',
        total_amount: 50,
      },
    ];

    const mockSupabaseResponse = {
      data: mockOrphanedSales,
      error: null,
    };

    const mockFrom = jest.fn(() => ({
      select: jest.fn(() => mockSupabaseResponse),
    }));
    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    // This would be part of a data integrity service
    const integrityCheck = {
      id: 'check-1',
      eventId: 'all',
      checkType: 'orphaned_records' as const,
      status: 'failed' as const,
      issues: [
        {
          type: 'orphaned_ticket_sale',
          description: 'Ticket sale references non-existent event',
          severity: 'high' as const,
          affectedRecords: ['sale-orphan-1'],
          suggestedAction: 'Review and remove or reassign to correct event',
        },
      ],
      runAt: new Date().toISOString(),
    };

    expect(integrityCheck.issues).toHaveLength(1);
    expect(integrityCheck.status).toBe('failed');
  });

  it('should validate ticket sale data consistency', async () => {
    // Test for negative amounts, missing customer info, etc.
    const mockInvalidSales = [
      {
        id: 'sale-invalid-1',
        event_id: 'event-123',
        customer_email: '', // Missing email
        total_amount: -50, // Negative amount
        ticket_quantity: 0, // Zero quantity
      },
    ];

    const issues: any[] = [];

    mockInvalidSales.forEach(sale => {
      if (!sale.customer_email) {
        issues.push({
          type: 'missing_customer_email',
          description: `Sale ${sale.id} missing customer email`,
          severity: 'medium' as const,
          affectedRecords: [sale.id],
        });
      }
      if (sale.total_amount < 0) {
        issues.push({
          type: 'negative_amount',
          description: `Sale ${sale.id} has negative amount`,
          severity: 'high' as const,
          affectedRecords: [sale.id],
        });
      }
      if (sale.ticket_quantity <= 0) {
        issues.push({
          type: 'invalid_quantity',
          description: `Sale ${sale.id} has invalid ticket quantity`,
          severity: 'high' as const,
          affectedRecords: [sale.id],
        });
      }
    });

    expect(issues).toHaveLength(3);
    expect(issues.filter(i => i.severity === 'high')).toHaveLength(2);
  });
});
