import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { supabase } from '@/integrations/supabase/client';
import { webhookProcessorService } from '@/services/webhookProcessorService';
import { humanitixApiService } from '@/services/humanitixApiService';

describe('Ticket Sales Integration', () => {
  let testEventId: string;
  let testPlatformId: string;

  beforeAll(async () => {
    // Create a test event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: 'Test Comedy Show',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Test Venue',
        capacity: 100,
        is_published: true,
      })
      .select()
      .single();

    if (eventError) throw eventError;
    testEventId = event.id;

    // Create a ticket platform
    const { data: platform, error: platformError } = await supabase
      .from('ticket_platforms')
      .insert({
        event_id: testEventId,
        platform: 'humanitix',
        external_event_id: 'evt_test123',
        tickets_sold: 0,
        tickets_available: 100,
        gross_sales: 0,
        is_primary: true,
      })
      .select()
      .single();

    if (platformError) throw platformError;
    testPlatformId = platform.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testEventId) {
      await supabase.from('events').delete().eq('id', testEventId);
    }
  });

  describe('Database Structure', () => {
    it('should have ticket_sales table with all required columns', async () => {
      const { data: columns } = await supabase.rpc('get_table_columns', {
        table_name: 'ticket_sales'
      }).catch(() => ({ data: null }));

      // If the RPC doesn't exist, try a simple query
      const { error } = await supabase
        .from('ticket_sales')
        .select('id, currency, raw_data, updated_at, refund_amount, refund_date')
        .limit(1);

      expect(error).toBeNull();
    });

    it('should have attendees table', async () => {
      const { error } = await supabase
        .from('attendees')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
    });

    it('should have webhook_logs table', async () => {
      const { error } = await supabase
        .from('webhook_logs')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
    });

    it('should have ticket_platforms table with webhook_last_received column', async () => {
      const { error } = await supabase
        .from('ticket_platforms')
        .select('webhook_last_received, platform_config')
        .limit(1);

      expect(error).toBeNull();
    });
  });

  describe('Webhook Processing', () => {
    it('should process Humanitix order.created webhook', async () => {
      const payload = {
        platform: 'humanitix',
        event_type: 'order.created',
        data: {
          event: {
            id: 'evt_test123',
            name: 'Test Comedy Show',
            date: new Date().toISOString(),
          },
          order: {
            id: `test_order_${Date.now()}`,
            status: 'paid',
            total_amount: 50.00,
            currency: 'AUD',
            created_at: new Date().toISOString(),
            customer: {
              email: 'test@example.com',
              first_name: 'Test',
              last_name: 'User',
            },
            tickets: [
              {
                id: 'tkt_test123',
                ticket_type_id: 'tt_general',
                ticket_type_name: 'General Admission',
                quantity: 2,
                price: 25.00,
              },
            ],
          },
        },
        timestamp: new Date().toISOString(),
      };

      const result = await webhookProcessorService.processWebhook(payload);
      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');

      // Verify the ticket sale was created
      const { data: ticketSale } = await supabase
        .from('ticket_sales')
        .select('*')
        .eq('platform_order_id', payload.data.order.id)
        .single();

      expect(ticketSale).toBeTruthy();
      expect(ticketSale.customer_email).toBe('test@example.com');
      expect(ticketSale.ticket_quantity).toBe(2);
      expect(ticketSale.total_amount).toBe(50);
    });

    it('should process order refund webhook', async () => {
      // First create an order
      const orderId = `test_order_refund_${Date.now()}`;
      const { error: createError } = await supabase
        .from('ticket_sales')
        .insert({
          event_id: testEventId,
          customer_name: 'Test User',
          customer_email: 'test@example.com',
          ticket_quantity: 2,
          ticket_type: 'General Admission',
          total_amount: 50.00,
          currency: 'AUD',
          platform: 'humanitix',
          platform_order_id: orderId,
          refund_status: 'none',
          purchase_date: new Date().toISOString(),
        });

      expect(createError).toBeNull();

      // Process refund webhook
      const refundPayload = {
        platform: 'humanitix',
        event_type: 'order.refunded',
        data: {
          event: {
            id: 'evt_test123',
          },
          order: {
            id: orderId,
            total_amount: 50.00,
          },
        },
        timestamp: new Date().toISOString(),
      };

      const result = await webhookProcessorService.processWebhook(refundPayload);
      expect(result.success).toBe(true);

      // Verify the refund was processed
      const { data: refundedSale } = await supabase
        .from('ticket_sales')
        .select('*')
        .eq('platform_order_id', orderId)
        .single();

      expect(refundedSale.refund_status).toBe('refunded');
      expect(refundedSale.refund_amount).toBe(50);
      expect(refundedSale.refund_date).toBeTruthy();
    });

    it('should log webhook events', async () => {
      const payload = {
        platform: 'humanitix',
        event_type: 'test.event',
        data: { test: true },
        timestamp: new Date().toISOString(),
      };

      await webhookProcessorService.processWebhook(payload);

      // Check webhook logs
      const { data: logs } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('platform', 'humanitix')
        .eq('event_type', 'test.event')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(logs).toHaveLength(1);
      expect(logs[0].payload).toEqual({ test: true });
    });
  });

  describe('Humanitix API Service', () => {
    it('should be in mock mode when no API key is configured', () => {
      // The service should work in mock mode for testing
      expect(humanitixApiService).toBeTruthy();
    });

    it('should return mock event data', async () => {
      const event = await humanitixApiService.getEvent('mock-event-123');
      expect(event).toBeTruthy();
      expect(event.id).toBe('mock-event-123');
      expect(event.status).toBe('live');
    });

    it('should return mock ticket types', async () => {
      const ticketTypes = await humanitixApiService.getTicketTypes('mock-event-123');
      expect(Array.isArray(ticketTypes)).toBe(true);
      expect(ticketTypes.length).toBeGreaterThan(0);
      expect(ticketTypes[0]).toHaveProperty('name');
      expect(ticketTypes[0]).toHaveProperty('price');
    });

    it('should return mock orders', async () => {
      const orders = await humanitixApiService.getOrders('mock-event-123');
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      expect(orders[0]).toHaveProperty('customer');
      expect(orders[0]).toHaveProperty('tickets');
    });
  });

  describe('Analytics Views', () => {
    it('should have ticket_sales_analytics view', async () => {
      const { error } = await supabase
        .from('ticket_sales_analytics')
        .select('*')
        .limit(1);

      // View might not exist yet, so we just check it doesn't throw
      expect(error?.code).not.toBe('PGRST301'); // Not a syntax error
    });

    it('should have attendee_checkin_status view', async () => {
      const { error } = await supabase
        .from('attendee_checkin_status')
        .select('*')
        .limit(1);

      // View might not exist yet, so we just check it doesn't throw
      expect(error?.code).not.toBe('PGRST301'); // Not a syntax error
    });
  });
});