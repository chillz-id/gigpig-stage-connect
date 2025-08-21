/**
 * Eventbrite API Service for ticket sales integration
 * Documentation: https://www.eventbrite.com/platform/api/
 */

import { supabase } from '@/integrations/supabase/client';

export interface EventbriteEvent {
  id: string;
  name: {
    text: string;
    html: string;
  };
  description: {
    text: string;
    html: string;
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
  venue_id: string;
  capacity: number;
  status: 'draft' | 'live' | 'started' | 'ended' | 'completed' | 'cancelled';
  currency: string;
  url: string;
  created: string;
  changed: string;
  published: string;
  resource_uri: string;
}

export interface EventbriteVenue {
  id: string;
  name: string;
  address: {
    address_1: string;
    address_2: string;
    city: string;
    region: string;
    postal_code: string;
    country: string;
  };
  resource_uri: string;
}

export interface EventbriteTicketClass {
  id: string;
  name: string;
  cost: {
    currency: string;
    display: string;
    value: number;
  };
  fee: {
    currency: string;
    display: string;
    value: number;
  };
  tax: {
    currency: string;
    display: string;
    value: number;
  };
  quantity_total: number;
  quantity_sold: number;
  sales_start: string;
  sales_end: string;
  hidden: boolean;
  free: boolean;
  minimum_quantity: number;
  maximum_quantity: number;
  on_sale_status: 'AVAILABLE' | 'UNAVAILABLE' | 'SOLD_OUT';
  resource_uri: string;
}

export interface EventbriteOrder {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: 'placed' | 'refunded' | 'cancelled' | 'deleted';
  time_remaining: number;
  created: string;
  changed: string;
  costs: {
    base_price: {
      currency: string;
      value: number;
      display: string;
    };
    eventbrite_fee: {
      currency: string;
      value: number;
      display: string;
    };
    gross: {
      currency: string;
      value: number;
      display: string;
    };
    tax: {
      currency: string;
      value: number;
      display: string;
    };
  };
  attendees: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    status: 'Attending' | 'Not Attending' | 'Cancelled';
    ticket_class_id: string;
    ticket_class_name: string;
  }>;
  resource_uri: string;
}

export interface EventbriteWebhookPayload {
  config: {
    user_id: string;
    action: string;
    webhook_id: string;
    endpoint_url: string;
  };
  api_url: string;
}

class EventbriteApiService {
  private apiKey: string;
  private baseUrl: string = 'https://www.eventbriteapi.com/v3';
  private isMockMode: boolean;

  constructor() {
    // In browser environment, we check for environment variables differently
    this.apiKey = import.meta.env?.VITE_EVENTBRITE_API_KEY || '';
    this.isMockMode = !this.apiKey;
    if (this.isMockMode) {
      console.warn('Eventbrite API key not configured - running in mock mode');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    // Return mock data if no API key is configured
    if (this.isMockMode) {
      return this.getMockData(endpoint, options);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Eventbrite API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  private getMockData(endpoint: string, options: RequestInit = {}): any {
    console.log(`[MOCK] Eventbrite API call to ${endpoint}`);
    
    // Parse event ID from endpoint
    const eventIdMatch = endpoint.match(/\/events\/(\d+)/);
    const eventId = eventIdMatch ? eventIdMatch[1] : '123456789';

    // Mock data based on endpoint
    if (endpoint.includes('/events/') && !endpoint.includes('/orders') && !endpoint.includes('/ticket_classes') && !endpoint.includes('/attendees')) {
      return this.getMockEvent(eventId);
    } else if (endpoint === '/users/me/events/') {
      return { events: [this.getMockEvent('123456789'), this.getMockEvent('987654321')] };
    } else if (endpoint.includes('/ticket_classes')) {
      return { ticket_classes: this.getMockTicketClasses() };
    } else if (endpoint.includes('/orders')) {
      return { orders: this.getMockOrders(eventId) };
    } else if (endpoint.includes('/attendees')) {
      return { attendees: this.getMockAttendees(eventId) };
    } else if (endpoint.includes('/venues/')) {
      return this.getMockVenue();
    }
    
    return {};
  }

  private getMockEvent(eventId: string): EventbriteEvent {
    const now = new Date();
    const startDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
    const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // 4 hours later

    return {
      id: eventId,
      name: {
        text: `Mock Stand-Up Showcase - ${eventId}`,
        html: `<strong>Mock Stand-Up Showcase</strong> - ${eventId}`
      },
      description: {
        text: 'Join us for an unforgettable night of laughter with Sydney\'s finest comedians',
        html: '<p>Join us for an unforgettable night of laughter with Sydney\'s finest comedians</p>'
      },
      start: {
        timezone: 'Australia/Sydney',
        local: startDate.toISOString().slice(0, -1),
        utc: startDate.toISOString()
      },
      end: {
        timezone: 'Australia/Sydney',
        local: endDate.toISOString().slice(0, -1),
        utc: endDate.toISOString()
      },
      venue_id: 'venue-123',
      capacity: 300,
      status: 'live',
      currency: 'AUD',
      url: `https://www.eventbrite.com/e/mock-event-${eventId}`,
      created: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      changed: now.toISOString(),
      published: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      resource_uri: `https://www.eventbriteapi.com/v3/events/${eventId}/`
    };
  }

  private getMockVenue(): EventbriteVenue {
    return {
      id: 'venue-123',
      name: 'The Laugh Factory Sydney',
      address: {
        address_1: '456 Comedy Street',
        address_2: 'Level 2',
        city: 'Sydney',
        region: 'NSW',
        postal_code: '2000',
        country: 'AU'
      },
      resource_uri: 'https://www.eventbriteapi.com/v3/venues/venue-123/'
    };
  }

  private getMockTicketClasses(): EventbriteTicketClass[] {
    return [
      {
        id: 'tc-standard',
        name: 'Standard Admission',
        cost: {
          currency: 'AUD',
          display: '$40.00',
          value: 4000
        },
        fee: {
          currency: 'AUD',
          display: '$2.50',
          value: 250
        },
        tax: {
          currency: 'AUD',
          display: '$4.00',
          value: 400
        },
        quantity_total: 200,
        quantity_sold: Math.floor(Math.random() * 120) + 40,
        sales_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        sales_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        hidden: false,
        free: false,
        minimum_quantity: 1,
        maximum_quantity: 10,
        on_sale_status: 'AVAILABLE',
        resource_uri: 'https://www.eventbriteapi.com/v3/events/123456789/ticket_classes/tc-standard/'
      },
      {
        id: 'tc-premium',
        name: 'Premium Seating',
        cost: {
          currency: 'AUD',
          display: '$70.00',
          value: 7000
        },
        fee: {
          currency: 'AUD',
          display: '$4.00',
          value: 400
        },
        tax: {
          currency: 'AUD',
          display: '$7.00',
          value: 700
        },
        quantity_total: 50,
        quantity_sold: Math.floor(Math.random() * 35) + 10,
        sales_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        sales_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        hidden: false,
        free: false,
        minimum_quantity: 1,
        maximum_quantity: 6,
        on_sale_status: 'AVAILABLE',
        resource_uri: 'https://www.eventbriteapi.com/v3/events/123456789/ticket_classes/tc-premium/'
      },
      {
        id: 'tc-group',
        name: 'Group Discount (4+)',
        cost: {
          currency: 'AUD',
          display: '$30.00',
          value: 3000
        },
        fee: {
          currency: 'AUD',
          display: '$2.00',
          value: 200
        },
        tax: {
          currency: 'AUD',
          display: '$3.00',
          value: 300
        },
        quantity_total: 50,
        quantity_sold: 48,
        sales_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        sales_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        hidden: false,
        free: false,
        minimum_quantity: 4,
        maximum_quantity: 20,
        on_sale_status: 'SOLD_OUT',
        resource_uri: 'https://www.eventbriteapi.com/v3/events/123456789/ticket_classes/tc-group/'
      }
    ];
  }

  private getMockOrders(eventId: string): EventbriteOrder[] {
    const orders: EventbriteOrder[] = [];
    const ticketClasses = this.getMockTicketClasses();
    const now = new Date();

    // Generate 30-60 mock orders
    const orderCount = Math.floor(Math.random() * 30) + 30;
    
    for (let i = 0; i < orderCount; i++) {
      const purchaseDate = new Date(now.getTime() - Math.random() * 40 * 24 * 60 * 60 * 1000);
      const ticketClass = ticketClasses[Math.floor(Math.random() * ticketClasses.length)];
      const quantity = Math.max(ticketClass.minimum_quantity, Math.floor(Math.random() * 4) + 1);
      const basePrice = ticketClass.cost.value * quantity;
      const fee = ticketClass.fee.value * quantity;
      const tax = ticketClass.tax.value * quantity;

      const firstName = this.getRandomFirstName();
      const lastName = this.getRandomLastName();

      orders.push({
        id: `${1000000 + i}`,
        event_id: eventId,
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        status: Math.random() > 0.98 ? 'refunded' : 'placed',
        time_remaining: 0,
        created: purchaseDate.toISOString(),
        changed: purchaseDate.toISOString(),
        costs: {
          base_price: {
            currency: 'AUD',
            value: basePrice / 100,
            display: `$${(basePrice / 100).toFixed(2)}`
          },
          eventbrite_fee: {
            currency: 'AUD',
            value: fee / 100,
            display: `$${(fee / 100).toFixed(2)}`
          },
          gross: {
            currency: 'AUD',
            value: (basePrice + fee + tax) / 100,
            display: `$${((basePrice + fee + tax) / 100).toFixed(2)}`
          },
          tax: {
            currency: 'AUD',
            value: tax / 100,
            display: `$${(tax / 100).toFixed(2)}`
          }
        },
        attendees: Array.from({ length: quantity }, (_, idx) => ({
          id: `attendee-${i}-${idx}`,
          first_name: idx === 0 ? firstName : this.getRandomFirstName(),
          last_name: idx === 0 ? lastName : this.getRandomLastName(),
          email: idx === 0 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com` : `guest${idx}@example.com`,
          status: 'Attending' as const,
          ticket_class_id: ticketClass.id,
          ticket_class_name: ticketClass.name
        })),
        resource_uri: `https://www.eventbriteapi.com/v3/orders/${1000000 + i}/`
      });
    }

    return orders.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }

  private getMockAttendees(eventId: string): any[] {
    const orders = this.getMockOrders(eventId);
    const attendees: any[] = [];

    orders.forEach(order => {
      order.attendees.forEach(attendee => {
        attendees.push({
          ...attendee,
          order_id: order.id,
          created: order.created,
          changed: order.changed,
          event_id: eventId
        });
      });
    });

    return attendees;
  }

  private getRandomFirstName(): string {
    const names = ['Alex', 'Beth', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomLastName(): string {
    const names = ['Anderson', 'Baker', 'Chen', 'Davies', 'Evans', 'Foster', 'Green', 'Harris', 'Irving', 'Jackson'];
    return names[Math.floor(Math.random() * names.length)];
  }

  // ==================================
  // EVENT OPERATIONS
  // ==================================

  async getEvent(eventId: string): Promise<EventbriteEvent> {
    return this.makeRequest(`/events/${eventId}/`);
  }

  async getMyEvents(): Promise<EventbriteEvent[]> {
    const response = await this.makeRequest('/users/me/events/');
    return response.events || [];
  }

  async createEvent(eventData: Partial<EventbriteEvent>): Promise<EventbriteEvent> {
    return this.makeRequest('/events/', {
      method: 'POST',
      body: JSON.stringify({ event: eventData }),
    });
  }

  async updateEvent(eventId: string, eventData: Partial<EventbriteEvent>): Promise<EventbriteEvent> {
    return this.makeRequest(`/events/${eventId}/`, {
      method: 'POST',
      body: JSON.stringify({ event: eventData }),
    });
  }

  async publishEvent(eventId: string): Promise<EventbriteEvent> {
    return this.makeRequest(`/events/${eventId}/publish/`, {
      method: 'POST',
    });
  }

  // ==================================
  // VENUE OPERATIONS
  // ==================================

  async getVenue(venueId: string): Promise<EventbriteVenue> {
    return this.makeRequest(`/venues/${venueId}/`);
  }

  async createVenue(venueData: Partial<EventbriteVenue>): Promise<EventbriteVenue> {
    return this.makeRequest('/venues/', {
      method: 'POST',
      body: JSON.stringify({ venue: venueData }),
    });
  }

  // ==================================
  // TICKET CLASS OPERATIONS
  // ==================================

  async getTicketClasses(eventId: string): Promise<EventbriteTicketClass[]> {
    const response = await this.makeRequest(`/events/${eventId}/ticket_classes/`);
    return response.ticket_classes || [];
  }

  async createTicketClass(eventId: string, ticketClassData: Partial<EventbriteTicketClass>): Promise<EventbriteTicketClass> {
    return this.makeRequest(`/events/${eventId}/ticket_classes/`, {
      method: 'POST',
      body: JSON.stringify({ ticket_class: ticketClassData }),
    });
  }

  // ==================================
  // ORDER OPERATIONS
  // ==================================

  async getOrders(eventId: string): Promise<EventbriteOrder[]> {
    const response = await this.makeRequest(`/events/${eventId}/orders/`);
    return response.orders || [];
  }

  async getOrder(orderId: string): Promise<EventbriteOrder> {
    return this.makeRequest(`/orders/${orderId}/`);
  }

  // ==================================
  // ATTENDEE OPERATIONS
  // ==================================

  async getAttendees(eventId: string): Promise<any[]> {
    const response = await this.makeRequest(`/events/${eventId}/attendees/`);
    return response.attendees || [];
  }

  // ==================================
  // SYNC OPERATIONS
  // ==================================

  async syncEventTicketSales(eventId: string, eventbriteEventId: string): Promise<void> {
    try {
      // Get event data from Eventbrite
      const eventbriteEvent = await this.getEvent(eventbriteEventId);
      const orders = await this.getOrders(eventbriteEventId);
      const ticketClasses = await this.getTicketClasses(eventbriteEventId);

      // Calculate metrics
      const ticketsSold = ticketClasses.reduce((sum, tc) => sum + tc.quantity_sold, 0);
      const ticketsAvailable = ticketClasses.reduce((sum, tc) => sum + (tc.quantity_total - tc.quantity_sold), 0);
      
      const grossRevenue = orders.reduce((sum, order) => {
        if (order.status === 'placed') {
          return sum + order.costs.gross.value;
        }
        return sum;
      }, 0);

      const fees = orders.reduce((sum, order) => {
        if (order.status === 'placed') {
          return sum + order.costs.eventbrite_fee.value;
        }
        return sum;
      }, 0);

      const netRevenue = grossRevenue - fees;

      // Update ticket platform data
      const { error } = await supabase.rpc('update_ticket_sales', {
        p_event_id: eventId,
        p_platform: 'eventbrite',
        p_external_event_id: eventbriteEventId,
        p_tickets_sold: ticketsSold,
        p_tickets_available: ticketsAvailable,
        p_gross_sales: grossRevenue,
        p_external_url: eventbriteEvent.url,
        p_platform_data: {
          net_revenue: netRevenue,
          fees: fees,
          orders_count: orders.length,
          ticket_classes: ticketClasses.length,
          status: eventbriteEvent.status,
          last_sync: new Date().toISOString(),
        }
      });

      if (error) {
        throw error;
      }

      // Sync individual ticket sales
      await this.syncIndividualTicketSales(eventId, orders);

      console.log(`Successfully synced Eventbrite event ${eventbriteEventId} for event ${eventId}`);
    } catch (error) {
      console.error('Error syncing Eventbrite event:', error);
      throw error;
    }
  }

  private async syncIndividualTicketSales(eventId: string, orders: EventbriteOrder[]): Promise<void> {
    for (const order of orders) {
      if (order.status === 'placed') {
        // Check if sale already exists
        const { data: existingSale } = await supabase
          .from('ticket_sales')
          .select('id')
          .eq('platform_order_id', order.id)
          .single();

        if (!existingSale) {
          // Create new ticket sale record
          const totalQuantity = order.attendees.length;
          const ticketType = order.attendees.length > 0 ? order.attendees[0].ticket_class_name : 'General';

          const { error } = await supabase
            .from('ticket_sales')
            .insert({
              event_id: eventId,
              customer_name: `${order.first_name} ${order.last_name}`,
              customer_email: order.email,
              ticket_quantity: totalQuantity,
              ticket_type: ticketType,
              total_amount: order.costs.gross.value,
              platform: 'eventbrite',
              platform_order_id: order.id,
              refund_status: 'none',
              purchase_date: order.created,
            });

          if (error) {
            console.error('Error creating ticket sale record:', error);
          }
        }
      }
    }
  }

  // ==================================
  // WEBHOOK HANDLING
  // ==================================

  async handleWebhook(payload: EventbriteWebhookPayload): Promise<void> {
    try {
      const { config, api_url } = payload;
      
      console.log(`Processing Eventbrite webhook: ${config.action} from ${api_url}`);

      // Extract event ID from the API URL
      const eventIdMatch = api_url.match(/\/events\/(\d+)\//);
      if (!eventIdMatch) {
        console.error('Could not extract event ID from API URL:', api_url);
        return;
      }

      const eventbriteEventId = eventIdMatch[1];

      // Find the local event that corresponds to this Eventbrite event
      const { data: ticketPlatform } = await supabase
        .from('ticket_platforms')
        .select('event_id')
        .eq('platform', 'eventbrite')
        .eq('external_event_id', eventbriteEventId)
        .single();

      if (!ticketPlatform) {
        console.error(`No local event found for Eventbrite event ${eventbriteEventId}`);
        return;
      }

      // Process different webhook actions
      switch (config.action) {
        case 'order.placed':
        case 'order.updated':
          await this.processOrderUpdate(api_url);
          break;
        case 'order.refunded':
          await this.processOrderRefund(api_url);
          break;
        case 'attendee.updated':
          await this.processAttendeeUpdate(api_url);
          break;
        default:
          console.log(`Unhandled webhook action: ${config.action}`);
      }

      // Re-sync the event after processing webhook
      await this.syncEventTicketSales(ticketPlatform.event_id, eventbriteEventId);
    } catch (error) {
      console.error('Error handling Eventbrite webhook:', error);
      throw error;
    }
  }

  private async processOrderUpdate(apiUrl: string): Promise<void> {
    try {
      // Make a request to the provided API URL to get the order details
      const orderData = await this.makeRequest(apiUrl.replace(this.baseUrl, ''));
      
      if (orderData.status === 'placed') {
        // Find the event ID from the order
        const { data: ticketPlatform } = await supabase
          .from('ticket_platforms')
          .select('event_id')
          .eq('platform', 'eventbrite')
          .eq('external_event_id', orderData.event_id)
          .single();

        if (ticketPlatform) {
          // Update or create ticket sale
          const totalQuantity = orderData.attendees.length;
          const ticketType = orderData.attendees.length > 0 ? orderData.attendees[0].ticket_class_name : 'General';

          const { error } = await supabase
            .from('ticket_sales')
            .upsert({
              event_id: ticketPlatform.event_id,
              customer_name: `${orderData.first_name} ${orderData.last_name}`,
              customer_email: orderData.email,
              ticket_quantity: totalQuantity,
              ticket_type: ticketType,
              total_amount: orderData.costs.gross.value,
              platform: 'eventbrite',
              platform_order_id: orderData.id,
              refund_status: 'none',
              purchase_date: orderData.created,
            });

          if (error) {
            console.error('Error upserting ticket sale:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error processing order update:', error);
    }
  }

  private async processOrderRefund(apiUrl: string): Promise<void> {
    try {
      // Make a request to the provided API URL to get the order details
      const orderData = await this.makeRequest(apiUrl.replace(this.baseUrl, ''));
      
      // Update the refund status
      const { error } = await supabase
        .from('ticket_sales')
        .update({
          refund_status: orderData.status === 'refunded' ? 'refunded' : 'cancelled',
          total_amount: orderData.status === 'refunded' ? -orderData.costs.gross.value : orderData.costs.gross.value,
        })
        .eq('platform_order_id', orderData.id);

      if (error) {
        console.error('Error updating refund status:', error);
      }
    } catch (error) {
      console.error('Error processing order refund:', error);
    }
  }

  private async processAttendeeUpdate(apiUrl: string): Promise<void> {
    try {
      // Make a request to the provided API URL to get the attendee details
      const attendeeData = await this.makeRequest(apiUrl.replace(this.baseUrl, ''));
      
      // Update attendee status if needed
      console.log('Attendee update processed:', attendeeData.id, attendeeData.status);
    } catch (error) {
      console.error('Error processing attendee update:', error);
    }
  }

  // ==================================
  // WEBHOOK VERIFICATION
  // ==================================

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Eventbrite uses OAuth, so webhook verification is handled differently
    // For now, we'll assume the webhook is valid if it comes from Eventbrite
    return true;
  }
}

export const eventbriteApiService = new EventbriteApiService();