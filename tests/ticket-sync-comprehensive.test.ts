/**
 * Comprehensive Test Suite for Ticket Sync Functionality
 * Tests manual sync, webhook processing, analytics, and error handling
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ticketSyncService } from '@/services/ticketSyncService';
import { humanitixApiService } from '@/services/humanitixApiService';
import { eventbriteApiService } from '@/services/eventbriteApiService';
import { supabase } from '@/integrations/supabase/client';
import type { PlatformType } from '@/types/ticketSales';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Test data
const mockEventId = 'test-event-123';
const mockHumanitixEventId = 'humanitix-event-456';
const mockEventbriteEventId = '789012345';

const mockTicketPlatforms = [
  {
    id: 'platform-1',
    event_id: mockEventId,
    platform: 'humanitix' as PlatformType,
    external_event_id: mockHumanitixEventId,
    external_event_url: 'https://events.humanitix.com/test-event',
    is_primary: true,
    tickets_sold: 0,
    gross_sales: 0,
  },
  {
    id: 'platform-2',
    event_id: mockEventId,
    platform: 'eventbrite' as PlatformType,
    external_event_id: mockEventbriteEventId,
    external_event_url: 'https://www.eventbrite.com/e/test-event',
    is_primary: false,
    tickets_sold: 0,
    gross_sales: 0,
  },
];

const mockHumanitixWebhookPayload = {
  event_type: 'order.created' as const,
  data: {
    order: {
      id: 'order-123',
      event_id: mockHumanitixEventId,
      customer: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
      tickets: [
        {
          ticket_type_id: 'ticket-ga',
          ticket_type_name: 'General Admission',
          quantity: 2,
          price: 35.00,
          total: 70.00,
        },
      ],
      total_amount: 72.45,
      fees: 2.45,
      net_amount: 70.00,
      status: 'paid' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    event: {
      id: mockHumanitixEventId,
      name: 'Test Comedy Night',
      tickets_sold: 50,
      gross_revenue: 1750,
    },
  },
  timestamp: new Date().toISOString(),
};

const mockEventbriteWebhookPayload = {
  api_url: 'https://www.eventbriteapi.com/v3/orders/12345/',
  config: {
    action: 'order.placed',
    user_id: '123456789',
    webhook_id: '9876543',
  },
};

describe('Ticket Sync Service - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock returns
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  afterEach(() => {
    ticketSyncService.stopAllScheduledSyncs();
  });

  describe('Manual Sync Functionality', () => {
    test('should sync all platforms for an event', async () => {
      // Mock ticket platforms query
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        data: mockTicketPlatforms,
        error: null,
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);
      
      // Mock RPC call for update_ticket_sales
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

      // Mock API responses
      jest.spyOn(humanitixApiService, 'syncEventTicketSales').mockResolvedValue();
      jest.spyOn(eventbriteApiService, 'syncEventTicketSales').mockResolvedValue();

      // Execute sync
      const results = await ticketSyncService.syncAllPlatforms(mockEventId);

      // Verify results
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        success: true,
        platform: 'humanitix',
        eventId: mockEventId,
        externalEventId: mockHumanitixEventId,
      });
      expect(results[1]).toMatchObject({
        success: true,
        platform: 'eventbrite',
        eventId: mockEventId,
        externalEventId: mockEventbriteEventId,
      });

      // Verify API calls
      expect(humanitixApiService.syncEventTicketSales).toHaveBeenCalledWith(
        mockEventId,
        mockHumanitixEventId
      );
      expect(eventbriteApiService.syncEventTicketSales).toHaveBeenCalledWith(
        mockEventId,
        mockEventbriteEventId
      );
    });

    test('should handle sync errors gracefully', async () => {
      // Mock ticket platforms query
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [mockTicketPlatforms[0]],
          error: null,
        }),
      });

      // Mock API error
      const mockError = new Error('API connection failed');
      jest.spyOn(humanitixApiService, 'syncEventTicketSales').mockRejectedValue(mockError);

      // Execute sync
      const results = await ticketSyncService.syncAllPlatforms(mockEventId);

      // Verify error handling
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        success: false,
        platform: 'humanitix',
        eventId: mockEventId,
        error: 'API connection failed',
      });
    });

    test('should create demo platforms in mock mode', async () => {
      // Mock empty platforms initially
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      
      // First call returns empty, second call returns created platforms
      mockChain.select.mockReturnValueOnce({
        ...mockChain,
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }).mockReturnValueOnce({
        ...mockChain,
        eq: jest.fn().mockResolvedValue({ data: mockTicketPlatforms, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue(mockChain);
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

      // Mock API services
      jest.spyOn(humanitixApiService, 'syncEventTicketSales').mockResolvedValue();
      jest.spyOn(eventbriteApiService, 'syncEventTicketSales').mockResolvedValue();

      // Execute sync (should create demo platforms)
      const results = await ticketSyncService.syncAllPlatforms(mockEventId);

      // Verify platforms were created
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_id: mockEventId,
          platform: 'humanitix',
          external_event_id: 'mock-event-123',
        })
      );
    });
  });

  describe('Webhook Processing', () => {
    test('should process Humanitix webhook successfully', async () => {
      // Mock finding the ticket platform
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { event_id: mockEventId },
          error: null,
        }),
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Mock webhook handler
      jest.spyOn(humanitixApiService, 'handleWebhook').mockResolvedValue();

      // Process webhook
      await ticketSyncService.handleWebhook({
        platform: 'humanitix',
        eventType: 'order.created',
        payload: mockHumanitixWebhookPayload,
        timestamp: new Date().toISOString(),
      });

      // Verify webhook was processed
      expect(humanitixApiService.handleWebhook).toHaveBeenCalledWith(mockHumanitixWebhookPayload);
    });

    test('should verify webhook signatures', async () => {
      const mockSignature = 'valid-signature';
      const mockSecret = 'webhook-secret';

      // Mock signature verification
      jest.spyOn(humanitixApiService, 'verifyWebhookSignature').mockReturnValue(true);

      // Process webhook with signature
      await ticketSyncService.handleWebhook({
        platform: 'humanitix',
        eventType: 'order.created',
        payload: mockHumanitixWebhookPayload,
        signature: mockSignature,
        timestamp: new Date().toISOString(),
      });

      // Verify signature was checked
      expect(humanitixApiService.verifyWebhookSignature).toHaveBeenCalledWith(
        JSON.stringify(mockHumanitixWebhookPayload),
        mockSignature,
        expect.any(String)
      );
    });

    test('should reject webhooks with invalid signatures', async () => {
      const mockSignature = 'invalid-signature';

      // Mock signature verification failure
      jest.spyOn(humanitixApiService, 'verifyWebhookSignature').mockReturnValue(false);

      // Attempt to process webhook
      await expect(
        ticketSyncService.handleWebhook({
          platform: 'humanitix',
          eventType: 'order.created',
          payload: mockHumanitixWebhookPayload,
          signature: mockSignature,
          timestamp: new Date().toISOString(),
        })
      ).rejects.toThrow('Invalid webhook signature');
    });

    test('should log webhook events', async () => {
      const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'webhook_logs') {
          return { insert: insertMock };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      // Mock webhook handler
      jest.spyOn(humanitixApiService, 'handleWebhook').mockResolvedValue();

      // Process webhook
      await ticketSyncService.handleWebhook({
        platform: 'humanitix',
        eventType: 'order.created',
        payload: mockHumanitixWebhookPayload,
        timestamp: new Date().toISOString(),
      });

      // Verify webhook was logged
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'humanitix',
          event_type: 'order.created',
          payload: mockHumanitixWebhookPayload,
          processed: true,
        })
      );
    });
  });

  describe('Scheduled Sync', () => {
    test('should start scheduled sync for event', () => {
      jest.useFakeTimers();

      // Mock sync method
      const syncSpy = jest.spyOn(ticketSyncService, 'syncAllPlatforms').mockResolvedValue([]);

      // Start scheduled sync with 1 minute interval for testing
      ticketSyncService.startScheduledSync({
        eventId: mockEventId,
        platforms: mockTicketPlatforms.map(p => ({
          platform: p.platform,
          externalEventId: p.external_event_id,
        })),
        syncInterval: 1, // 1 minute
      });

      // Fast forward time
      jest.advanceTimersByTime(60 * 1000); // 1 minute

      // Verify sync was called
      expect(syncSpy).toHaveBeenCalledWith(mockEventId);

      jest.useRealTimers();
    });

    test('should stop scheduled sync', () => {
      jest.useFakeTimers();

      // Start sync
      ticketSyncService.startScheduledSync({
        eventId: mockEventId,
        platforms: [],
        syncInterval: 1,
      });

      // Mock sync method
      const syncSpy = jest.spyOn(ticketSyncService, 'syncAllPlatforms').mockResolvedValue([]);

      // Stop sync
      ticketSyncService.stopScheduledSync(mockEventId);

      // Fast forward time
      jest.advanceTimersByTime(60 * 1000); // 1 minute

      // Verify sync was NOT called after stopping
      expect(syncSpy).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Analytics and Reporting', () => {
    test('should get sync status with analytics', async () => {
      const mockAnalytics = {
        id: mockEventId,
        total_tickets_sold: 150,
        total_gross_sales: 5250.00,
        platforms_count: 2,
        platform_breakdown: [
          { platform: 'humanitix', tickets_sold: 100, gross_sales: 3500 },
          { platform: 'eventbrite', tickets_sold: 50, gross_sales: 1750 },
        ],
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockAnalytics,
          error: null,
        }),
      });

      // Get sync status
      const status = await ticketSyncService.getSyncStatus(mockEventId);

      // Verify analytics
      expect(status).toMatchObject({
        eventId: mockEventId,
        totalTicketsSold: 150,
        totalGrossRevenue: 5250.00,
        platformCount: 2,
        platforms: expect.arrayContaining([
          expect.objectContaining({ platform: 'humanitix' }),
          expect.objectContaining({ platform: 'eventbrite' }),
        ]),
      });
    });

    test('should get sync history', async () => {
      const mockHistory = [
        {
          id: 'log-1',
          sync_timestamp: new Date().toISOString(),
          tickets_sold_delta: 5,
          gross_sales_delta: 175.00,
          ticket_platforms: {
            platform: 'humanitix',
            external_event_id: mockHumanitixEventId,
          },
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockHistory,
          error: null,
        }),
      });

      // Get sync history
      const history = await ticketSyncService.getSyncHistory(mockEventId);

      // Verify history
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        tickets_sold_delta: 5,
        gross_sales_delta: 175.00,
      });
    });
  });

  describe('Platform Management', () => {
    test('should add new platform and perform initial sync', async () => {
      const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        insert: insertMock,
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: { ...mockTicketPlatforms[0] },
          error: null,
        }),
      });

      // Mock sync
      jest.spyOn(humanitixApiService, 'syncEventTicketSales').mockResolvedValue();

      // Add platform
      await ticketSyncService.addPlatform(
        mockEventId,
        'humanitix',
        mockHumanitixEventId,
        'https://events.humanitix.com/test-event',
        true
      );

      // Verify platform was added
      expect(insertMock).toHaveBeenCalledWith({
        event_id: mockEventId,
        platform: 'humanitix',
        external_event_id: mockHumanitixEventId,
        external_event_url: 'https://events.humanitix.com/test-event',
        is_primary: true,
      });

      // Verify initial sync was performed
      expect(humanitixApiService.syncEventTicketSales).toHaveBeenCalledWith(
        mockEventId,
        mockHumanitixEventId
      );
    });

    test('should remove platform', async () => {
      const deleteMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ data: null, error: null });
      
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'ticket_platforms') {
          return {
            delete: deleteMock,
            eq: eqMock,
            select: jest.fn().mockReturnThis(),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      // Remove platform
      await ticketSyncService.removePlatform(mockEventId, 'humanitix');

      // Verify platform was removed
      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('event_id', mockEventId);
      expect(eqMock).toHaveBeenCalledWith('platform', 'humanitix');
    });

    test('should update platform configuration', async () => {
      const updateMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockResolvedValue({ data: null, error: null });
      
      (supabase.from as jest.Mock).mockReturnValue({
        update: updateMock,
        eq: eqMock,
        select: jest.fn().mockReturnThis(),
      });

      // Mock sync
      jest.spyOn(humanitixApiService, 'syncEventTicketSales').mockResolvedValue();

      // Update platform
      await ticketSyncService.updatePlatform(mockEventId, 'humanitix', {
        externalEventId: 'new-humanitix-id',
        externalUrl: 'https://events.humanitix.com/new-event',
        isPrimary: false,
      });

      // Verify update
      expect(updateMock).toHaveBeenCalledWith({
        external_event_id: 'new-humanitix-id',
        external_event_url: 'https://events.humanitix.com/new-event',
        is_primary: false,
      });

      // Verify re-sync was triggered
      expect(humanitixApiService.syncEventTicketSales).toHaveBeenCalledWith(
        mockEventId,
        'new-humanitix-id'
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: dbError,
        }),
      });

      // Attempt sync
      await expect(ticketSyncService.syncAllPlatforms(mockEventId)).rejects.toThrow(
        'Database connection failed'
      );
    });

    test('should handle missing platform configuration', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      // Sync with no platforms configured (and not in mock mode)
      const originalEnv = import.meta.env.VITE_HUMANITIX_API_KEY;
      import.meta.env.VITE_HUMANITIX_API_KEY = 'test-key';

      const results = await ticketSyncService.syncAllPlatforms(mockEventId);

      // Should return empty results
      expect(results).toHaveLength(0);

      // Restore env
      import.meta.env.VITE_HUMANITIX_API_KEY = originalEnv;
    });

    test('should handle concurrent sync requests', async () => {
      // Mock platforms
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockTicketPlatforms,
          error: null,
        }),
      });

      // Mock slow sync to test concurrency
      let syncCount = 0;
      jest.spyOn(humanitixApiService, 'syncEventTicketSales').mockImplementation(async () => {
        syncCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      jest.spyOn(eventbriteApiService, 'syncEventTicketSales').mockImplementation(async () => {
        syncCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Start multiple concurrent syncs
      const syncPromises = [
        ticketSyncService.syncAllPlatforms(mockEventId),
        ticketSyncService.syncAllPlatforms(mockEventId),
        ticketSyncService.syncAllPlatforms(mockEventId),
      ];

      // Wait for all to complete
      await Promise.all(syncPromises);

      // Verify all syncs completed
      expect(syncCount).toBe(6); // 2 platforms × 3 concurrent requests
    });
  });

  describe('Individual Ticket Sales Sync', () => {
    test('should sync individual ticket sales from Humanitix', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          customer: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
          tickets: [{ ticket_type_name: 'GA', quantity: 2 }],
          total_amount: 70.00,
          status: 'paid' as const,
          created_at: new Date().toISOString(),
        },
        {
          id: 'order-2',
          customer: { first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
          tickets: [{ ticket_type_name: 'VIP', quantity: 1 }],
          total_amount: 65.00,
          status: 'paid' as const,
          created_at: new Date().toISOString(),
        },
      ];

      // Mock checking for existing sales
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({ data: null, error: null });
      const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'ticket_sales') {
          return {
            select: selectMock,
            eq: eqMock,
            single: singleMock,
            insert: insertMock,
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      // Mock Humanitix API responses
      jest.spyOn(humanitixApiService, 'getEvent').mockResolvedValue({
        id: mockHumanitixEventId,
        name: 'Test Event',
        capacity: 200,
        tickets_sold: 3,
        gross_revenue: 135.00,
        url: 'https://events.humanitix.com/test',
      } as any);

      jest.spyOn(humanitixApiService, 'getOrders').mockResolvedValue(mockOrders as any);

      // Sync event
      await humanitixApiService.syncEventTicketSales(mockEventId, mockHumanitixEventId);

      // Verify individual sales were created
      expect(insertMock).toHaveBeenCalledTimes(2);
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          event_id: mockEventId,
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          ticket_quantity: 2,
          ticket_type: 'GA',
          total_amount: 70.00,
          platform: 'humanitix',
          platform_order_id: 'order-1',
        })
      );
    });
  });
});

describe('Ticket Sync Service - Integration Tests', () => {
  test('should perform end-to-end sync with real-like data', async () => {
    // This test simulates a complete sync flow
    const mockEvent = {
      id: 'event-e2e-test',
      name: 'Comedy Night E2E Test',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Setup comprehensive mocks
    const fromMock = jest.fn();
    const selectMock = jest.fn().mockReturnThis();
    const insertMock = jest.fn().mockReturnThis();
    const eqMock = jest.fn().mockReturnThis();
    const singleMock = jest.fn();
    const rpcMock = jest.fn().mockResolvedValue({ data: null, error: null });

    // Configure mock chain
    fromMock.mockImplementation((table: string) => {
      const baseMethods = {
        select: selectMock,
        insert: insertMock,
        eq: eqMock,
        single: singleMock,
      };

      if (table === 'ticket_platforms') {
        selectMock.mockReturnValueOnce({
          ...baseMethods,
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                event_id: mockEvent.id,
                platform: 'humanitix',
                external_event_id: 'humanitix-e2e',
                is_primary: true,
              },
            ],
            error: null,
          }),
        });
      } else if (table === 'event_ticket_summary') {
        singleMock.mockResolvedValue({
          data: {
            id: mockEvent.id,
            total_tickets_sold: 75,
            total_gross_sales: 2625.00,
            platforms_count: 1,
            platform_breakdown: [
              { platform: 'humanitix', tickets_sold: 75, gross_sales: 2625.00 },
            ],
          },
          error: null,
        });
      }

      return baseMethods;
    });

    (supabase.from as jest.Mock) = fromMock;
    (supabase.rpc as jest.Mock) = rpcMock;

    // Mock API services
    jest.spyOn(humanitixApiService, 'syncEventTicketSales').mockResolvedValue();

    // Initialize event sync (includes initial sync + scheduled sync setup)
    await ticketSyncService.initializeEventSync(mockEvent.id);

    // Verify complete flow
    expect(humanitixApiService.syncEventTicketSales).toHaveBeenCalled();
    expect(rpcMock).toHaveBeenCalled();

    // Get final status
    const status = await ticketSyncService.getSyncStatus(mockEvent.id);
    expect(status.totalTicketsSold).toBe(75);
    expect(status.totalGrossRevenue).toBe(2625.00);
  });
});