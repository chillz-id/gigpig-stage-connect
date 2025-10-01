/**
 * Eventbrite API Service for ticket sales integration
 * Documentation: https://www.eventbrite.com/platform/api
 */

import { supabase } from '@/integrations/supabase/client';

export interface EventbriteEvent {
  id: string;
  name: {
    text: string;
  };
  description: {
    text: string;
  };
  start: {
    timezone: string;
    local: string;
    utc: string;
  };
  end: {
    timezone: string;
    local: string;
    utc: string;
  };
  venue?: {
    name?: string;
    address?: {
      address_1?: string;
      city?: string;
      region?: string;
      postal_code?: string;
      country?: string;
    };
  };
  online_event: boolean;
  status: string;
  capacity: number;
  capacity_is_custom: boolean;
  listed: boolean;
  shareable: boolean;
  invite_only: boolean;
  show_remaining: boolean;
  currency: string;
  is_free: boolean;
  logo?: {
    url: string;
  };
  url: string;
  created: string;
  changed: string;
}

export interface EventbriteOrder {
  id: string;
  event_id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  time_remaining_in_seconds?: number;
  event_currency: string;
  costs: {
    base_price: {
      display: string;
      currency: string;
      value: number;
    };
    eventbrite_fee: {
      display: string;
      currency: string;
      value: number;
    };
    gross: {
      display: string;
      currency: string;
      value: number;
    };
    payment_fee: {
      display: string;
      currency: string;
      value: number;
    };
    tax: {
      display: string;
      currency: string;
      value: number;
    };
  };
  created: string;
  changed: string;
}

export interface EventbriteAttendee {
  id: string;
  order_id: string;
  event_id: string;
  ticket_class_id: string;
  ticket_class_name: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  checked_in: boolean;
  cancelled: boolean;
  refunded: boolean;
  costs: {
    base_price: {
      currency: string;
      value: number;
    };
    eventbrite_fee: {
      currency: string;
      value: number;
    };
    gross: {
      currency: string;
      value: number;
    };
    payment_fee: {
      currency: string;
      value: number;
    };
    tax: {
      currency: string;
      value: number;
    };
  };
  created: string;
  changed: string;
  delivery_method: string;
  quantity: number;
}

class EventbriteApiService {
  private baseUrl = 'https://www.eventbriteapi.com/v3';
  private apiKey = process.env.EVENTBRITE_API_KEY;

  constructor() {
    if (!this.apiKey) {
      console.warn('Eventbrite API key not configured');
    }
  }

  /**
   * Make authenticated request to Eventbrite API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey) {
      throw new Error('Eventbrite API key not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Eventbrite API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Get event details from Eventbrite
   */
  async getEvent(eventId: string): Promise<EventbriteEvent> {
    return this.makeRequest(`/events/${eventId}/`);
  }

  /**
   * Get orders for an event
   */
  async getEventOrders(eventId: string, page = 1): Promise<{ orders: EventbriteOrder[]; pagination: any }> {
    const response = await this.makeRequest(`/events/${eventId}/orders/?page=${page}`);
    return response;
  }

  /**
   * Get attendees for an event
   */
  async getEventAttendees(eventId: string, page = 1): Promise<{ attendees: EventbriteAttendee[]; pagination: any }> {
    const response = await this.makeRequest(`/events/${eventId}/attendees/?page=${page}`);
    return response;
  }

  /**
   * Sync all data for an Eventbrite event to HTX tables
   */
  async syncEventToHtx(eventbriteEventId: string) {
    try {
      console.log(`Starting sync for Eventbrite event ${eventbriteEventId}`);

      // 1. Get event details
      const eventData = await this.getEvent(eventbriteEventId);

      // 2. Transform and upsert event
      await this.upsertEventToHtx(eventData);

      // 3. Get and sync all orders
      let page = 1;
      let hasMoreOrders = true;

      while (hasMoreOrders) {
        const ordersResponse = await this.getEventOrders(eventbriteEventId, page);

        for (const order of ordersResponse.orders) {
          await this.upsertOrderToHtx(order);
        }

        hasMoreOrders = ordersResponse.pagination.has_more_items;
        page++;
      }

      // 4. Get and sync all attendees
      page = 1;
      let hasMoreAttendees = true;

      while (hasMoreAttendees) {
        const attendeesResponse = await this.getEventAttendees(eventbriteEventId, page);

        for (const attendee of attendeesResponse.attendees) {
          await this.upsertTicketToHtx(attendee);
        }

        hasMoreAttendees = attendeesResponse.pagination.has_more_items;
        page++;
      }

      console.log(`Sync completed for Eventbrite event ${eventbriteEventId}`);
      return { success: true, message: 'Event synced successfully' };

    } catch (error) {
      console.error('Error syncing Eventbrite event:', error);
      throw error;
    }
  }

  /**
   * Transform Eventbrite event to HTX format and upsert
   */
  private async upsertEventToHtx(eventData: EventbriteEvent) {
    const transformedEvent = {
      source: 'eventbrite',
      source_id: eventData.id,
      name: eventData.name.text,
      title: eventData.name.text,
      description: eventData.description?.text || '',
      status: eventData.status,
      public: eventData.listed,
      published: eventData.listed,
      start_date: eventData.start.utc,
      end_date: eventData.end.utc,
      timezone: eventData.start.timezone,
      total_capacity: eventData.capacity,
      currency: eventData.currency,
      url: eventData.url,
      hero_image_url: eventData.logo?.url || null,
      venue_name: eventData.venue?.name || null,
      venue_address: eventData.venue?.address ?
        `${eventData.venue.address.address_1 || ''}, ${eventData.venue.address.city || ''}, ${eventData.venue.address.region || ''}`.trim() : null,
      venue_city: eventData.venue?.address?.city || null,
      venue_country: eventData.venue?.address?.country || null,
      location_type: eventData.online_event ? 'online' : 'venue',
      raw: eventData,
      updated_at: new Date().toISOString(),
      updated_at_api: eventData.changed,
      created_at: eventData.created,
    };

    const { error } = await supabase
      .from('events_htx')
      .upsert(transformedEvent, {
        onConflict: 'source,source_id'
      });

    if (error) {
      console.error('Error upserting Eventbrite event:', error);
      throw error;
    }
  }

  /**
   * Transform Eventbrite order to HTX format and upsert
   */
  private async upsertOrderToHtx(orderData: EventbriteOrder) {
    const transformedOrder = {
      source: 'eventbrite',
      source_id: orderData.id,
      event_source_id: orderData.event_id,
      order_reference: orderData.id,
      status: orderData.status,
      total_cents: Math.round(orderData.costs.gross.value * 100), // Convert to cents
      net_sales_cents: Math.round(orderData.costs.base_price.value * 100),
      fees_cents: Math.round((orderData.costs.eventbrite_fee.value + orderData.costs.payment_fee.value) * 100),
      tax_cents: Math.round(orderData.costs.tax.value * 100),
      discount_cents: 0, // Eventbrite doesn't provide discount in this format
      purchaser_email: orderData.email,
      purchaser_name: orderData.name || `${orderData.first_name} ${orderData.last_name}`.trim(),
      ordered_at: orderData.created,
      updated_at: new Date().toISOString(),
      updated_at_api: orderData.changed,
      raw: orderData,
      ingested_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('orders_htx')
      .upsert(transformedOrder, {
        onConflict: 'source,source_id'
      });

    if (error) {
      console.error('Error upserting Eventbrite order:', error);
      throw error;
    }
  }

  /**
   * Transform Eventbrite attendee to HTX ticket format and upsert
   */
  private async upsertTicketToHtx(attendeeData: EventbriteAttendee) {
    const transformedTicket = {
      source: 'eventbrite',
      source_id: attendeeData.id,
      order_source_id: attendeeData.order_id,
      session_source_id: attendeeData.event_id,
      ticket_type_name: attendeeData.ticket_class_name,
      price_cents: Math.round(attendeeData.costs.base_price.value * 100),
      status: attendeeData.status,
      checked_in: attendeeData.checked_in,
      check_in_status: attendeeData.checked_in ? 'checked_in' : 'not_checked_in',
      barcode: attendeeData.id, // Use attendee ID as barcode reference
      updated_at: new Date().toISOString(),
      updated_at_api: attendeeData.changed,
      raw: attendeeData,
      ingested_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('tickets_htx')
      .upsert(transformedTicket, {
        onConflict: 'source,source_id'
      });

    if (error) {
      console.error('Error upserting Eventbrite ticket:', error);
      throw error;
    }
  }

  /**
   * Process Eventbrite webhook payload
   */
  async processWebhook(webhookData: any) {
    console.log('Processing Eventbrite webhook:', webhookData);

    const { config } = webhookData;
    if (!config?.action || !config?.endpoint_url) {
      throw new Error('Invalid Eventbrite webhook payload');
    }

    // Extract event ID from the API URL
    const eventIdMatch = config.endpoint_url.match(/\/events\/(\d+)\//);
    if (!eventIdMatch) {
      throw new Error('Could not extract event ID from Eventbrite webhook');
    }

    const eventId = eventIdMatch[1];
    console.log(`Processing Eventbrite webhook: ${config.action} for event ${eventId}`);

    try {
      // For most webhook types, sync the entire event data
      switch (config.action) {
        case 'order.placed':
        case 'order.updated':
        case 'attendee.updated':
        case 'attendee.checked_in':
        case 'attendee.checked_out':
          // Sync the event to get latest data
          await this.syncEventToHtx(eventId);
          break;

        default:
          console.log(`Webhook action ${config.action} not handled, but event synced`);
          await this.syncEventToHtx(eventId);
      }

      return {
        success: true,
        message: `Processed ${config.action} webhook for event ${eventId}`
      };

    } catch (error) {
      console.error('Error processing Eventbrite webhook:', error);
      throw error;
    }
  }
}

export const eventbriteApiService = new EventbriteApiService();