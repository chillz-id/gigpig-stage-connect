import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface SyncJob {
  eventId: string;
  platforms: Array<{
    platform: string;
    externalEventId: string;
    lastSync: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting scheduled ticket sync...');

    // Get all events with active ticket platforms
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        event_date,
        status,
        ticket_platforms (
          platform,
          external_event_id,
          last_sync_at
        )
      `)
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString())
      .not('ticket_platforms', 'is', null);

    if (eventsError) {
      throw eventsError;
    }

    if (!events || events.length === 0) {
      console.log('No events with ticket platforms found');
      return new Response(
        JSON.stringify({ success: true, message: 'No events to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const syncResults = [];

    // Process each event
    for (const event of events) {
      if (!event.ticket_platforms || event.ticket_platforms.length === 0) {
        continue;
      }

      console.log(`Syncing event: ${event.title} (${event.id})`);

      const eventResults = {
        eventId: event.id,
        eventTitle: event.title,
        platforms: [],
        success: true,
        error: null,
      };

      // Sync each platform for this event
      for (const platform of event.ticket_platforms) {
        try {
          const platformResult = await syncPlatform(
            supabase,
            event.id,
            platform.platform,
            platform.external_event_id
          );
          
          eventResults.platforms.push(platformResult);
        } catch (error) {
          console.error(`Error syncing platform ${platform.platform} for event ${event.id}:`, error);
          eventResults.success = false;
          eventResults.error = error.message;
          eventResults.platforms.push({
            platform: platform.platform,
            externalEventId: platform.external_event_id,
            success: false,
            error: error.message,
          });
        }
      }

      syncResults.push(eventResults);
    }

    // Update sync summary
    const successCount = syncResults.filter(r => r.success).length;
    const totalCount = syncResults.length;

    console.log(`Scheduled sync completed: ${successCount}/${totalCount} events synced successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduled sync completed: ${successCount}/${totalCount} events synced successfully`,
        results: syncResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scheduled sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function syncPlatform(
  supabase: any,
  eventId: string,
  platform: string,
  externalEventId: string
): Promise<any> {
  const startTime = new Date().toISOString();
  
  try {
    let ticketData;
    
    // Fetch data from external platform
    switch (platform) {
      case 'humanitix':
        ticketData = await syncHumanitixEvent(supabase, eventId, externalEventId);
        break;
      case 'eventbrite':
        ticketData = await syncEventbriteEvent(supabase, eventId, externalEventId);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Update platform data in database
    const { error: updateError } = await supabase.rpc('update_ticket_sales', {
      p_event_id: eventId,
      p_platform: platform,
      p_external_event_id: externalEventId,
      p_tickets_sold: ticketData.ticketsSold,
      p_tickets_available: ticketData.ticketsAvailable,
      p_gross_sales: ticketData.grossRevenue,
      p_external_url: ticketData.url,
      p_platform_data: {
        net_revenue: ticketData.netRevenue,
        fees: ticketData.fees,
        orders_count: ticketData.ordersCount,
        last_sync: startTime,
      }
    });

    if (updateError) {
      throw updateError;
    }

    return {
      platform,
      externalEventId,
      success: true,
      ticketsSold: ticketData.ticketsSold,
      grossRevenue: ticketData.grossRevenue,
      lastSync: startTime,
    };
  } catch (error) {
    console.error(`Error syncing ${platform} platform:`, error);
    return {
      platform,
      externalEventId,
      success: false,
      error: error.message,
      lastSync: startTime,
    };
  }
}

async function syncHumanitixEvent(supabase: any, eventId: string, externalEventId: string): Promise<any> {
  const apiKey = Deno.env.get('HUMANITIX_API_KEY');
  if (!apiKey) {
    throw new Error('Humanitix API key not configured');
  }

  const baseUrl = 'https://api.humanitix.com/v1';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // Fetch event details
  const eventResponse = await fetch(`${baseUrl}/events/${externalEventId}`, { headers });
  if (!eventResponse.ok) {
    throw new Error(`Humanitix API error: ${eventResponse.status}`);
  }
  const eventData = await eventResponse.json();

  // Fetch orders
  const ordersResponse = await fetch(`${baseUrl}/events/${externalEventId}/orders`, { headers });
  if (!ordersResponse.ok) {
    throw new Error(`Humanitix API error: ${ordersResponse.status}`);
  }
  const ordersData = await ordersResponse.json();
  const orders = ordersData.orders || [];

  // Calculate metrics
  const ticketsSold = orders.reduce((sum: number, order: any) => 
    sum + order.tickets.reduce((ticketSum: number, ticket: any) => ticketSum + ticket.quantity, 0), 0
  );
  
  const grossRevenue = orders.reduce((sum: number, order: any) => sum + order.total_amount, 0);
  const fees = orders.reduce((sum: number, order: any) => sum + order.fees, 0);
  const netRevenue = grossRevenue - fees;

  return {
    ticketsSold,
    ticketsAvailable: eventData.capacity - ticketsSold,
    grossRevenue,
    netRevenue,
    fees,
    ordersCount: orders.length,
    url: eventData.url,
  };
}

async function syncEventbriteEvent(supabase: any, eventId: string, externalEventId: string): Promise<any> {
  const apiKey = Deno.env.get('EVENTBRITE_API_KEY');
  if (!apiKey) {
    throw new Error('Eventbrite API key not configured');
  }

  const baseUrl = 'https://www.eventbriteapi.com/v3';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // Fetch event details
  const eventResponse = await fetch(`${baseUrl}/events/${externalEventId}/`, { headers });
  if (!eventResponse.ok) {
    throw new Error(`Eventbrite API error: ${eventResponse.status}`);
  }
  const eventData = await eventResponse.json();

  // Fetch ticket classes
  const ticketClassesResponse = await fetch(`${baseUrl}/events/${externalEventId}/ticket_classes/`, { headers });
  if (!ticketClassesResponse.ok) {
    throw new Error(`Eventbrite API error: ${ticketClassesResponse.status}`);
  }
  const ticketClassesData = await ticketClassesResponse.json();
  const ticketClasses = ticketClassesData.ticket_classes || [];

  // Fetch orders
  const ordersResponse = await fetch(`${baseUrl}/events/${externalEventId}/orders/`, { headers });
  if (!ordersResponse.ok) {
    throw new Error(`Eventbrite API error: ${ordersResponse.status}`);
  }
  const ordersData = await ordersResponse.json();
  const orders = ordersData.orders || [];

  // Calculate metrics
  const ticketsSold = ticketClasses.reduce((sum: number, tc: any) => sum + tc.quantity_sold, 0);
  const ticketsAvailable = ticketClasses.reduce((sum: number, tc: any) => sum + (tc.quantity_total - tc.quantity_sold), 0);
  
  const grossRevenue = orders.reduce((sum: number, order: any) => {
    if (order.status === 'placed') {
      return sum + order.costs.gross.value;
    }
    return sum;
  }, 0);

  const fees = orders.reduce((sum: number, order: any) => {
    if (order.status === 'placed') {
      return sum + order.costs.eventbrite_fee.value;
    }
    return sum;
  }, 0);

  const netRevenue = grossRevenue - fees;

  return {
    ticketsSold,
    ticketsAvailable,
    grossRevenue,
    netRevenue,
    fees,
    ordersCount: orders.length,
    url: eventData.url,
  };
}