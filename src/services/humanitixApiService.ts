/**
 * Humanitix API Service for ticket sales integration
 * Documentation: https://docs.humanitix.com/
 */

import { supabase } from '@/integrations/supabase/client';

export interface HumanitixEvent {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  status: 'draft' | 'live' | 'ended' | 'cancelled';
  capacity: number;
  tickets_sold: number;
  gross_revenue: number;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface HumanitixTicketType {
  id: string;
  name: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  status: 'active' | 'inactive' | 'sold_out';
}

export interface HumanitixOrder {
  id: string;
  event_id: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  tickets: Array<{
    ticket_type_id: string;
    ticket_type_name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  total_amount: number;
  fees: number;
  net_amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface HumanitixWebhookPayload {
  event_type: 'order.created' | 'order.updated' | 'order.cancelled' | 'order.refunded';
  data: {
    order: HumanitixOrder;
    event: HumanitixEvent;
  };
  timestamp: string;
}

class HumanitixApiService {
  private apiKey: string;
  private baseUrl: string = 'https://api.humanitix.com/v1';
  private isMockMode: boolean;

  constructor() {
    // In browser environment, we check for environment variables differently
    this.apiKey = import.meta.env?.VITE_HUMANITIX_API_KEY || '';
    this.isMockMode = !this.apiKey;
    if (this.isMockMode) {
      console.warn('Humanitix API key not configured - running in mock mode');
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
      throw new Error(`Humanitix API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  private getMockData(endpoint: string, options: RequestInit = {}): any {
    console.log(`[MOCK] Humanitix API call to ${endpoint}`);
    
    // Parse event ID from endpoint
    const eventIdMatch = endpoint.match(/\/events\/([^\/]+)/);
    const eventId = eventIdMatch ? eventIdMatch[1] : 'mock-event-123';

    // Mock data based on endpoint
    if (endpoint.includes('/events/') && !endpoint.includes('/orders') && !endpoint.includes('/ticket-types')) {
      return this.getMockEvent(eventId);
    } else if (endpoint === '/events') {
      return { events: [this.getMockEvent('mock-event-123'), this.getMockEvent('mock-event-456')] };
    } else if (endpoint.includes('/ticket-types')) {
      return { ticket_types: this.getMockTicketTypes() };
    } else if (endpoint.includes('/orders')) {
      return { orders: this.getMockOrders(eventId) };
    }
    
    return {};
  }

  private getMockEvent(eventId: string): HumanitixEvent {
    const now = new Date();
    const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours later

    return {
      id: eventId,
      name: `Mock Comedy Night - ${eventId}`,
      description: 'A hilarious evening of stand-up comedy featuring the best local talent',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      venue: {
        name: 'The Comedy Club',
        address: '123 Laughter Lane',
        city: 'Sydney',
        state: 'NSW',
        postal_code: '2000',
        country: 'Australia'
      },
      status: 'live',
      capacity: 200,
      tickets_sold: Math.floor(Math.random() * 150) + 50,
      gross_revenue: Math.floor(Math.random() * 5000) + 2000,
      url: `https://events.humanitix.com/mock-event/${eventId}`,
      created_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: now.toISOString()
    };
  }

  private getMockTicketTypes(): HumanitixTicketType[] {
    return [
      {
        id: 'ticket-ga',
        name: 'General Admission',
        price: 35.00,
        quantity_available: 150,
        quantity_sold: Math.floor(Math.random() * 100) + 20,
        status: 'active'
      },
      {
        id: 'ticket-vip',
        name: 'VIP Front Row',
        price: 65.00,
        quantity_available: 30,
        quantity_sold: Math.floor(Math.random() * 25) + 5,
        status: 'active'
      },
      {
        id: 'ticket-early',
        name: 'Early Bird Special',
        price: 25.00,
        quantity_available: 20,
        quantity_sold: 20,
        status: 'sold_out'
      }
    ];
  }

  private getMockOrders(eventId: string): HumanitixOrder[] {
    const orders: HumanitixOrder[] = [];
    const ticketTypes = this.getMockTicketTypes();
    const now = new Date();

    // Generate 20-50 mock orders
    const orderCount = Math.floor(Math.random() * 30) + 20;
    
    for (let i = 0; i < orderCount; i++) {
      const purchaseDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const ticketType = ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const totalAmount = ticketType.price * quantity;
      const fees = totalAmount * 0.035; // 3.5% platform fee

      orders.push({
        id: `order-${i + 1000}`,
        event_id: eventId,
        customer: {
          first_name: this.getRandomFirstName(),
          last_name: this.getRandomLastName(),
          email: `customer${i}@example.com`,
          phone: `+61${Math.floor(Math.random() * 900000000) + 100000000}`
        },
        tickets: [{
          ticket_type_id: ticketType.id,
          ticket_type_name: ticketType.name,
          quantity: quantity,
          price: ticketType.price,
          total: totalAmount
        }],
        total_amount: totalAmount + fees,
        fees: fees,
        net_amount: totalAmount,
        status: Math.random() > 0.95 ? 'refunded' : 'paid',
        created_at: purchaseDate.toISOString(),
        updated_at: purchaseDate.toISOString()
      });
    }

    return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  private getRandomFirstName(): string {
    const names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Olivia', 'Robert', 'Sophie'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomLastName(): string {
    const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Taylor'];
    return names[Math.floor(Math.random() * names.length)];
  }

  // ==================================
  // EVENT OPERATIONS
  // ==================================

  async getEvent(eventId: string): Promise<HumanitixEvent> {
    return this.makeRequest(`/events/${eventId}`);
  }

  async getEvents(): Promise<HumanitixEvent[]> {
    const response = await this.makeRequest('/events');
    return response.events || [];
  }

  async createEvent(eventData: Partial<HumanitixEvent>): Promise<HumanitixEvent> {
    return this.makeRequest('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(eventId: string, eventData: Partial<HumanitixEvent>): Promise<HumanitixEvent> {
    return this.makeRequest(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  // ==================================
  // TICKET TYPE OPERATIONS
  // ==================================

  async getTicketTypes(eventId: string): Promise<HumanitixTicketType[]> {
    const response = await this.makeRequest(`/events/${eventId}/ticket-types`);
    return response.ticket_types || [];
  }

  async createTicketType(eventId: string, ticketTypeData: Partial<HumanitixTicketType>): Promise<HumanitixTicketType> {
    return this.makeRequest(`/events/${eventId}/ticket-types`, {
      method: 'POST',
      body: JSON.stringify(ticketTypeData),
    });
  }

  // ==================================
  // ORDER OPERATIONS
  // ==================================

  async getOrders(eventId: string): Promise<HumanitixOrder[]> {
    const response = await this.makeRequest(`/events/${eventId}/orders`);
    return response.orders || [];
  }

  async getOrder(orderId: string): Promise<HumanitixOrder> {
    return this.makeRequest(`/orders/${orderId}`);
  }

  // ==================================
  // SYNC OPERATIONS
  // ==================================

  async syncEventTicketSales(eventId: string, humanitixEventId: string): Promise<void> {
    try {
      // Get event data from Humanitix
      const humanitixEvent = await this.getEvent(humanitixEventId);
      const orders = await this.getOrders(humanitixEventId);

      // Calculate metrics
      const ticketsSold = orders.reduce((sum, order) => 
        sum + order.tickets.reduce((ticketSum, ticket) => ticketSum + ticket.quantity, 0), 0
      );
      
      const grossRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const fees = orders.reduce((sum, order) => sum + order.fees, 0);
      const netRevenue = grossRevenue - fees;

      // Update ticket platform data
      const { error } = await supabase.rpc('update_ticket_sales', {
        p_event_id: eventId,
        p_platform: 'humanitix',
        p_external_event_id: humanitixEventId,
        p_tickets_sold: ticketsSold,
        p_tickets_available: humanitixEvent.capacity - ticketsSold,
        p_gross_sales: grossRevenue,
        p_external_url: humanitixEvent.url,
        p_platform_data: {
          net_revenue: netRevenue,
          fees: fees,
          orders_count: orders.length,
          last_sync: new Date().toISOString(),
        }
      });

      if (error) {
        throw error;
      }

      // Sync individual ticket sales
      await this.syncIndividualTicketSales(eventId, orders);

      console.log(`Successfully synced Humanitix event ${humanitixEventId} for event ${eventId}`);
    } catch (error) {
      console.error('Error syncing Humanitix event:', error);
      throw error;
    }
  }

  private async syncIndividualTicketSales(eventId: string, orders: HumanitixOrder[]): Promise<void> {
    for (const order of orders) {
      if (order.status === 'paid') {
        // Check if sale already exists
        const { data: existingSale } = await supabase
          .from('ticket_sales')
          .select('id')
          .eq('platform_order_id', order.id)
          .single();

        if (!existingSale) {
          // Create new ticket sale record
          const totalQuantity = order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
          const ticketType = order.tickets.length > 0 ? order.tickets[0].ticket_type_name : 'General';

          const { error } = await supabase
            .from('ticket_sales')
            .insert({
              event_id: eventId,
              customer_name: `${order.customer.first_name} ${order.customer.last_name}`,
              customer_email: order.customer.email,
              ticket_quantity: totalQuantity,
              ticket_type: ticketType,
              total_amount: order.total_amount,
              platform: 'humanitix',
              platform_order_id: order.id,
              refund_status: 'none',
              purchase_date: order.created_at,
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

  async handleWebhook(payload: HumanitixWebhookPayload): Promise<void> {
    try {
      const { event_type, data } = payload;
      const { order, event } = data;

      console.log(`Processing Humanitix webhook: ${event_type} for order ${order.id}`);

      // Find the local event that corresponds to this Humanitix event
      const { data: ticketPlatform } = await supabase
        .from('ticket_platforms')
        .select('event_id')
        .eq('platform', 'humanitix')
        .eq('external_event_id', event.id)
        .single();

      if (!ticketPlatform) {
        console.error(`No local event found for Humanitix event ${event.id}`);
        return;
      }

      switch (event_type) {
        case 'order.created':
        case 'order.updated':
          await this.processOrderUpdate(ticketPlatform.event_id, order);
          break;
        case 'order.cancelled':
        case 'order.refunded':
          await this.processOrderRefund(ticketPlatform.event_id, order);
          break;
        default:
          console.log(`Unhandled webhook event type: ${event_type}`);
      }

      // Re-sync the event after processing webhook
      await this.syncEventTicketSales(ticketPlatform.event_id, event.id);
    } catch (error) {
      console.error('Error handling Humanitix webhook:', error);
      throw error;
    }
  }

  private async processOrderUpdate(eventId: string, order: HumanitixOrder): Promise<void> {
    if (order.status === 'paid') {
      // Update or create ticket sale
      const totalQuantity = order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
      const ticketType = order.tickets.length > 0 ? order.tickets[0].ticket_type_name : 'General';

      const { error } = await supabase
        .from('ticket_sales')
        .upsert({
          event_id: eventId,
          customer_name: `${order.customer.first_name} ${order.customer.last_name}`,
          customer_email: order.customer.email,
          ticket_quantity: totalQuantity,
          ticket_type: ticketType,
          total_amount: order.total_amount,
          platform: 'humanitix',
          platform_order_id: order.id,
          refund_status: 'none',
          purchase_date: order.created_at,
        });

      if (error) {
        console.error('Error upserting ticket sale:', error);
      }
    }
  }

  private async processOrderRefund(eventId: string, order: HumanitixOrder): Promise<void> {
    // Update the refund status
    const { error } = await supabase
      .from('ticket_sales')
      .update({
        refund_status: order.status === 'refunded' ? 'refunded' : 'cancelled',
        total_amount: order.status === 'refunded' ? -order.total_amount : order.total_amount,
      })
      .eq('platform_order_id', order.id);

    if (error) {
      console.error('Error updating refund status:', error);
    }
  }

  // ==================================
  // WEBHOOK VERIFICATION
  // ==================================

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }
}

export const humanitixApiService = new HumanitixApiService();