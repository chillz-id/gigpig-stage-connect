import { supabase } from '@/integrations/supabase/client';
import { humanitixApiService } from './humanitixApiService';

interface WebhookPayload {
  platform: string;
  event_type: string;
  data: any;
  signature?: string;
  timestamp: string;
}

class WebhookProcessorService {
  /**
   * Process incoming webhook from any platform
   */
  async processWebhook(payload: WebhookPayload): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Log the webhook
      await this.logWebhook(payload);

      // Process based on platform
      switch (payload.platform) {
        case 'humanitix':
          return await this.processHumanitixWebhook(payload);
        case 'eventbrite':
          return await this.processEventbriteWebhook(payload);
        default:
          return { success: false, message: 'Unknown platform', error: `Platform ${payload.platform} not supported` };
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      await this.logWebhook(payload, false, error.message);
      return { success: false, message: 'Processing failed', error: error.message };
    }
  }

  /**
   * Process Humanitix webhook
   */
  private async processHumanitixWebhook(payload: WebhookPayload) {
    const { event_type, data } = payload;
    
    // Validate required data
    if (!data?.event?.id || !data?.order?.id) {
      throw new Error('Invalid Humanitix webhook payload');
    }

    // Find the local event
    const { data: ticketPlatform, error: platformError } = await supabase
      .from('ticket_platforms')
      .select('event_id')
      .eq('platform', 'humanitix')
      .eq('external_event_id', data.event.id)
      .single();

    if (platformError || !ticketPlatform) {
      throw new Error(`No local event found for Humanitix event ${data.event.id}`);
    }

    switch (event_type) {
      case 'order.created':
      case 'order.updated':
        return await this.processHumanitixOrder(ticketPlatform.event_id, data.order);
      case 'order.cancelled':
        return await this.processHumanitixCancellation(data.order);
      case 'order.refunded':
        return await this.processHumanitixRefund(data.order);
      default:
        return { success: true, message: `Event type ${event_type} not processed` };
    }
  }

  /**
   * Process Eventbrite webhook
   */
  private async processEventbriteWebhook(payload: WebhookPayload) {
    const { data } = payload;
    
    // Validate required data
    if (!data?.api_url) {
      throw new Error('Invalid Eventbrite webhook payload');
    }

    // Extract event ID from API URL
    const eventIdMatch = data.api_url.match(/\/events\/(\d+)\//);
    if (!eventIdMatch) {
      throw new Error('Could not extract event ID from Eventbrite API URL');
    }

    const eventbriteEventId = eventIdMatch[1];

    // Find the local event
    const { data: ticketPlatform, error: platformError } = await supabase
      .from('ticket_platforms')
      .select('event_id, platform_config')
      .eq('platform', 'eventbrite')
      .eq('external_event_id', eventbriteEventId)
      .single();

    if (platformError || !ticketPlatform) {
      throw new Error(`No local event found for Eventbrite event ${eventbriteEventId}`);
    }

    // For Eventbrite, we would need to fetch the order details from their API
    // This is a simplified version
    return { 
      success: true, 
      message: 'Eventbrite webhook received. Full processing requires API integration.' 
    };
  }

  /**
   * Process Humanitix order (created or updated)
   */
  private async processHumanitixOrder(eventId: string, order: any) {
    // Only process paid orders
    if (order.status !== 'paid') {
      return { success: true, message: 'Order not paid, skipping processing' };
    }

    // Calculate totals
    const totalQuantity = order.tickets.reduce((sum: number, ticket: any) => sum + ticket.quantity, 0);
    const ticketTypes = [...new Set(order.tickets.map((t: any) => t.ticket_type_name))].join(', ');

    // Upsert ticket sale
    const { data: ticketSale, error: upsertError } = await supabase
      .from('ticket_sales')
      .upsert({
        event_id: eventId,
        customer_name: `${order.customer.first_name} ${order.customer.last_name}`.trim(),
        customer_email: order.customer.email,
        ticket_quantity: totalQuantity,
        ticket_type: ticketTypes,
        total_amount: order.total_amount,
        currency: order.currency || 'AUD',
        platform: 'humanitix',
        platform_order_id: order.id,
        refund_status: 'none',
        purchase_date: order.created_at,
        raw_data: order,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'platform,platform_order_id',
      })
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    // Process attendees if we have the function
    if (order.attendees && Array.isArray(order.attendees)) {
      await this.processAttendees(ticketSale.id, eventId, order.attendees, 'humanitix');
    }

    // Update platform sync timestamp
    await this.updateSyncTimestamp(eventId, 'humanitix', order.event_id);

    return { success: true, message: 'Order processed successfully' };
  }

  /**
   * Process Humanitix cancellation
   */
  private async processHumanitixCancellation(order: any) {
    const { error } = await supabase
      .from('ticket_sales')
      .update({
        refund_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('platform', 'humanitix')
      .eq('platform_order_id', order.id);

    if (error) {
      throw error;
    }

    return { success: true, message: 'Order cancellation processed' };
  }

  /**
   * Process Humanitix refund
   */
  private async processHumanitixRefund(order: any) {
    const { error } = await supabase
      .from('ticket_sales')
      .update({
        refund_status: 'refunded',
        refund_amount: order.total_amount,
        refund_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('platform', 'humanitix')
      .eq('platform_order_id', order.id);

    if (error) {
      throw error;
    }

    return { success: true, message: 'Order refund processed' };
  }

  /**
   * Process attendees for a ticket sale
   */
  private async processAttendees(
    ticketSaleId: string, 
    eventId: string, 
    attendees: any[], 
    platform: string
  ) {
    // Delete existing attendees for this ticket sale
    await supabase
      .from('attendees')
      .delete()
      .eq('ticket_sale_id', ticketSaleId);

    // Insert new attendees
    const attendeeRecords = attendees.map(attendee => ({
      ticket_sale_id: ticketSaleId,
      event_id: eventId,
      first_name: attendee.first_name,
      last_name: attendee.last_name,
      email: attendee.email,
      ticket_type: attendee.ticket_type || attendee.ticket_type_name,
      ticket_price: attendee.price,
      platform: platform,
      platform_attendee_id: attendee.id,
      platform_data: attendee,
    }));

    if (attendeeRecords.length > 0) {
      const { error } = await supabase
        .from('attendees')
        .insert(attendeeRecords);

      if (error) {
        console.error('Error inserting attendees:', error);
      }
    }
  }

  /**
   * Update sync timestamp for a platform
   */
  private async updateSyncTimestamp(eventId: string, platform: string, externalEventId: string) {
    const { error } = await supabase
      .from('ticket_platforms')
      .update({ 
        last_sync_at: new Date().toISOString(),
        webhook_last_received: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('platform', platform)
      .eq('external_event_id', externalEventId);

    if (error) {
      console.error('Error updating sync timestamp:', error);
    }
  }

  /**
   * Log webhook event
   */
  private async logWebhook(
    payload: WebhookPayload, 
    processed: boolean = true, 
    errorMessage?: string
  ) {
    try {
      const { error } = await supabase
        .from('webhook_logs')
        .insert({
          platform: payload.platform,
          event_type: payload.event_type,
          payload: payload.data,
          signature: payload.signature,
          timestamp: payload.timestamp,
          processed: processed,
          error_message: errorMessage,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error logging webhook:', error);
      }
    } catch (err) {
      console.error('Failed to log webhook:', err);
    }
  }

  /**
   * Manually sync ticket sales for an event
   */
  async syncEventTicketSales(eventId: string, platform: string, externalEventId: string) {
    try {
      switch (platform) {
        case 'humanitix':
          await humanitixApiService.syncEventTicketSales(eventId, externalEventId);
          break;
        case 'eventbrite':
          // Eventbrite sync would go here
          console.log('Eventbrite sync not yet implemented');
          break;
        default:
          throw new Error(`Unknown platform: ${platform}`);
      }

      return { success: true, message: 'Event synchronized successfully' };
    } catch (error) {
      console.error('Error syncing event:', error);
      return { success: false, message: 'Sync failed', error: error.message };
    }
  }

  /**
   * Test webhook processing with sample data
   */
  async testWebhookProcessing(platform: string, eventType: string) {
    // Sample test payloads
    const testPayloads = {
      humanitix: {
        'order.created': {
          event: {
            id: 'evt_test123',
            name: 'Test Comedy Show',
            date: '2024-02-01T19:00:00Z',
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
      },
    };

    const testData = testPayloads[platform]?.[eventType];
    if (!testData) {
      return { success: false, message: 'No test data available for this combination' };
    }

    const payload: WebhookPayload = {
      platform,
      event_type: eventType,
      data: testData,
      timestamp: new Date().toISOString(),
    };

    return await this.processWebhook(payload);
  }
}

export const webhookProcessorService = new WebhookProcessorService();