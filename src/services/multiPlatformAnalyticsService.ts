/**
 * Multi-Platform Analytics Service
 * Provides unified reporting across Humanitix and Eventbrite platforms
 */

import { supabase } from '@/integrations/supabase/client';

export interface PlatformMetrics {
  source: 'humanitix' | 'eventbrite';
  event_count: number;
  total_orders: number;
  total_tickets: number;
  total_revenue_cents: number;
  total_fees_cents: number;
  net_revenue_cents: number;
}

export interface EventMetrics {
  event_source_id: string;
  event_name: string;
  source: string;
  start_date: string;
  status: string;
  total_orders: number;
  total_tickets: number;
  total_revenue_cents: number;
  net_revenue_cents: number;
  fees_cents: number;
  venue_name: string;
  venue_city: string;
}

export interface CombinedEventMetrics {
  event_name: string;
  start_date: string;
  venue_name: string;
  venue_city: string;
  platforms: {
    source: string;
    orders: number;
    tickets: number;
    revenue_cents: number;
    net_revenue_cents: number;
  }[];
  totals: {
    orders: number;
    tickets: number;
    revenue_cents: number;
    net_revenue_cents: number;
  };
}

class MultiPlatformAnalyticsService {

  /**
   * Get overall platform performance metrics
   */
  async getPlatformMetrics(startDate?: string, endDate?: string): Promise<PlatformMetrics[]> {
    let query = supabase
      .from('orders_htx')
      .select(`
        source,
        event_source_id,
        total_cents,
        fees_cents,
        net_sales_cents
      `)
      .not('source', 'is', null);

    if (startDate) {
      query = query.gte('ordered_at', startDate);
    }
    if (endDate) {
      query = query.lte('ordered_at', endDate);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw error;
    }

    // Get ticket counts per platform
    const ticketQuery = supabase
      .from('tickets_htx')
      .select('source, order_source_id')
      .not('source', 'is', null);

    const { data: tickets, error: ticketError } = await ticketQuery;

    if (ticketError) {
      throw ticketError;
    }

    // Get event counts per platform
    const { data: events, error: eventError } = await supabase
      .from('events_htx')
      .select('source')
      .not('source', 'is', null);

    if (eventError) {
      throw eventError;
    }

    // Calculate metrics by platform
    const platformMetrics: { [key: string]: PlatformMetrics } = {};

    // Initialize platforms
    ['humanitix', 'eventbrite'].forEach(source => {
      platformMetrics[source] = {
        source: source as 'humanitix' | 'eventbrite',
        event_count: 0,
        total_orders: 0,
        total_tickets: 0,
        total_revenue_cents: 0,
        total_fees_cents: 0,
        net_revenue_cents: 0,
      };
    });

    // Count events by platform
    events?.forEach(event => {
      if (platformMetrics[event.source]) {
        platformMetrics[event.source].event_count++;
      }
    });

    // Sum order metrics by platform
    orders?.forEach(order => {
      if (platformMetrics[order.source]) {
        platformMetrics[order.source].total_orders++;
        platformMetrics[order.source].total_revenue_cents += order.total_cents || 0;
        platformMetrics[order.source].total_fees_cents += order.fees_cents || 0;
        platformMetrics[order.source].net_revenue_cents += order.net_sales_cents || 0;
      }
    });

    // Count tickets by platform
    tickets?.forEach(ticket => {
      if (platformMetrics[ticket.source]) {
        platformMetrics[ticket.source].total_tickets++;
      }
    });

    return Object.values(platformMetrics);
  }

  /**
   * Get detailed metrics for all events across platforms
   */
  async getEventMetrics(startDate?: string, endDate?: string): Promise<EventMetrics[]> {
    const query = `
      SELECT
        e.source_id as event_source_id,
        e.name as event_name,
        e.source,
        e.start_date,
        e.status,
        e.venue_name,
        e.venue_city,
        COALESCE(order_stats.total_orders, 0) as total_orders,
        COALESCE(ticket_stats.total_tickets, 0) as total_tickets,
        COALESCE(order_stats.total_revenue_cents, 0) as total_revenue_cents,
        COALESCE(order_stats.net_revenue_cents, 0) as net_revenue_cents,
        COALESCE(order_stats.fees_cents, 0) as fees_cents
      FROM events_htx e
      LEFT JOIN (
        SELECT
          event_source_id,
          COUNT(*) as total_orders,
          SUM(total_cents) as total_revenue_cents,
          SUM(net_sales_cents) as net_revenue_cents,
          SUM(fees_cents) as fees_cents
        FROM orders_htx
        WHERE source IS NOT NULL
        ${startDate ? `AND ordered_at >= '${startDate}'` : ''}
        ${endDate ? `AND ordered_at <= '${endDate}'` : ''}
        GROUP BY event_source_id
      ) order_stats ON e.source_id = order_stats.event_source_id
      LEFT JOIN (
        SELECT
          session_source_id,
          COUNT(*) as total_tickets
        FROM tickets_htx
        WHERE source IS NOT NULL
        GROUP BY session_source_id
      ) ticket_stats ON e.source_id = ticket_stats.session_source_id
      WHERE e.source IS NOT NULL
      ORDER BY e.start_date DESC;
    `;

    const { data, error } = await supabase.rpc('execute_raw_sql', { query });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get combined metrics for events that exist on multiple platforms
   */
  async getCombinedEventMetrics(startDate?: string, endDate?: string): Promise<CombinedEventMetrics[]> {
    // First, get all event metrics
    const eventMetrics = await this.getEventMetrics(startDate, endDate);

    // Group by event name and date to find events on multiple platforms
    const eventGroups: { [key: string]: EventMetrics[] } = {};

    eventMetrics.forEach(event => {
      // Create a key based on event name and date for matching
      const key = `${event.event_name?.toLowerCase().trim()}_${event.start_date?.split('T')[0]}`;

      if (!eventGroups[key]) {
        eventGroups[key] = [];
      }
      eventGroups[key].push(event);
    });

    // Convert to combined metrics format
    const combinedMetrics: CombinedEventMetrics[] = [];

    Object.values(eventGroups).forEach(events => {
      if (events.length === 0) return;

      // Use the first event as the base info
      const baseEvent = events[0];

      // Calculate platform-specific and total metrics
      const platforms = events.map(event => ({
        source: event.source,
        orders: event.total_orders,
        tickets: event.total_tickets,
        revenue_cents: event.total_revenue_cents,
        net_revenue_cents: event.net_revenue_cents,
      }));

      const totals = {
        orders: events.reduce((sum, e) => sum + e.total_orders, 0),
        tickets: events.reduce((sum, e) => sum + e.total_tickets, 0),
        revenue_cents: events.reduce((sum, e) => sum + e.total_revenue_cents, 0),
        net_revenue_cents: events.reduce((sum, e) => sum + e.net_revenue_cents, 0),
      };

      combinedMetrics.push({
        event_name: baseEvent.event_name,
        start_date: baseEvent.start_date,
        venue_name: baseEvent.venue_name,
        venue_city: baseEvent.venue_city,
        platforms,
        totals,
      });
    });

    // Sort by total revenue descending
    return combinedMetrics.sort((a, b) => b.totals.revenue_cents - a.totals.revenue_cents);
  }

  /**
   * Get revenue comparison between platforms
   */
  async getRevenueComparison(startDate?: string, endDate?: string) {
    const platformMetrics = await this.getPlatformMetrics(startDate, endDate);

    const total = platformMetrics.reduce((sum, platform) => ({
      orders: sum.orders + platform.total_orders,
      tickets: sum.tickets + platform.total_tickets,
      revenue: sum.revenue + platform.total_revenue_cents,
      net_revenue: sum.net_revenue + platform.net_revenue_cents,
    }), { orders: 0, tickets: 0, revenue: 0, net_revenue: 0 });

    return {
      platforms: platformMetrics.map(platform => ({
        source: platform.source,
        orders: platform.total_orders,
        tickets: platform.total_tickets,
        revenue_cents: platform.total_revenue_cents,
        net_revenue_cents: platform.net_revenue_cents,
        fees_cents: platform.total_fees_cents,
        revenue_percentage: total.revenue > 0 ? (platform.total_revenue_cents / total.revenue * 100) : 0,
        orders_percentage: total.orders > 0 ? (platform.total_orders / total.orders * 100) : 0,
      })),
      totals: {
        orders: total.orders,
        tickets: total.tickets,
        revenue_cents: total.revenue,
        net_revenue_cents: total.net_revenue,
      },
    };
  }

  /**
   * Get recent sales activity across both platforms
   */
  async getRecentSalesActivity(limit = 50) {
    const { data: recentOrders, error } = await supabase
      .from('orders_htx')
      .select(`
        source,
        source_id,
        event_source_id,
        order_reference,
        status,
        total_cents,
        net_sales_cents,
        purchaser_name,
        purchaser_email,
        ordered_at,
        events_htx!inner(name, start_date, venue_name)
      `)
      .not('source', 'is', null)
      .order('ordered_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return recentOrders?.map(order => ({
      platform: order.source,
      order_id: order.source_id,
      order_reference: order.order_reference,
      event_name: order.events_htx.name,
      event_date: order.events_htx.start_date,
      venue_name: order.events_htx.venue_name,
      purchaser_name: order.purchaser_name,
      purchaser_email: order.purchaser_email,
      total_amount: (order.total_cents / 100).toFixed(2),
      net_amount: (order.net_sales_cents / 100).toFixed(2),
      ordered_at: order.ordered_at,
      status: order.status,
    })) || [];
  }

  /**
   * Get platform health check - recent sync status
   */
  async getPlatformHealthCheck() {
    // Get recent orders by platform
    const { data: recentActivity, error } = await supabase
      .from('orders_htx')
      .select('source, ordered_at, updated_at_api')
      .not('source', 'is', null)
      .order('updated_at_api', { ascending: false });

    if (error) {
      throw error;
    }

    const platformHealth = {
      humanitix: {
        last_order_at: null,
        last_api_update: null,
        status: 'unknown',
      },
      eventbrite: {
        last_order_at: null,
        last_api_update: null,
        status: 'unknown',
      },
    };

    recentActivity?.forEach(order => {
      if (order.source && platformHealth[order.source]) {
        if (!platformHealth[order.source].last_order_at || order.ordered_at > platformHealth[order.source].last_order_at) {
          platformHealth[order.source].last_order_at = order.ordered_at;
        }
        if (!platformHealth[order.source].last_api_update || order.updated_at_api > platformHealth[order.source].last_api_update) {
          platformHealth[order.source].last_api_update = order.updated_at_api;
        }
      }
    });

    // Determine status based on recent activity
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    Object.keys(platformHealth).forEach(platform => {
      const health = platformHealth[platform];
      if (health.last_api_update && new Date(health.last_api_update) > oneDayAgo) {
        health.status = 'healthy';
      } else if (health.last_api_update) {
        health.status = 'stale';
      } else {
        health.status = 'no_data';
      }
    });

    return platformHealth;
  }
}

export const multiPlatformAnalyticsService = new MultiPlatformAnalyticsService();
