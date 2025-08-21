import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-platform, x-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface WebhookEvent {
  platform: string;
  eventType: string;
  payload: any;
  signature?: string;
  timestamp: string;
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

    const platform = req.headers.get('x-platform') || 'unknown';
    const signature = req.headers.get('x-signature');
    const payload = await req.json();
    
    console.log(`Received webhook for platform: ${platform}`);

    // Create webhook event record
    const webhookEvent: WebhookEvent = {
      platform,
      eventType: extractEventType(platform, payload),
      payload,
      signature,
      timestamp: new Date().toISOString(),
    };

    // Process the webhook based on platform
    let processedSuccessfully = false;
    let errorMessage = '';

    try {
      switch (platform) {
        case 'humanitix':
          await processHumanitixWebhook(supabase, webhookEvent);
          processedSuccessfully = true;
          break;
        case 'eventbrite':
          await processEventbriteWebhook(supabase, webhookEvent);
          processedSuccessfully = true;
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      errorMessage = error.message;
    }

    // Log webhook event
    await logWebhookEvent(supabase, webhookEvent, processedSuccessfully, errorMessage);

    if (processedSuccessfully) {
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function extractEventType(platform: string, payload: any): string {
  switch (platform) {
    case 'humanitix':
      return payload.event_type || 'unknown';
    case 'eventbrite':
      return payload.config?.action || 'unknown';
    default:
      return 'unknown';
  }
}

async function processHumanitixWebhook(supabase: any, webhookEvent: WebhookEvent): Promise<void> {
  const { payload } = webhookEvent;
  const { event_type, data } = payload;
  
  if (!data || !data.order || !data.event) {
    throw new Error('Invalid Humanitix webhook payload');
  }

  const { order, event } = data;

  // Find the local event that corresponds to this Humanitix event
  const { data: ticketPlatform, error: platformError } = await supabase
    .from('ticket_platforms')
    .select('event_id')
    .eq('platform', 'humanitix')
    .eq('external_event_id', event.id)
    .single();

  if (platformError || !ticketPlatform) {
    console.error(`No local event found for Humanitix event ${event.id}`);
    return;
  }

  const eventId = ticketPlatform.event_id;

  // Process different event types
  switch (event_type) {
    case 'order.created':
    case 'order.updated':
      if (order.status === 'paid') {
        await upsertTicketSale(supabase, eventId, order, 'humanitix');
      }
      break;
    case 'order.cancelled':
    case 'order.refunded':
      await updateTicketSaleRefund(supabase, order, event_type === 'order.refunded');
      break;
  }

  // Trigger a sync for this event
  await triggerEventSync(supabase, eventId, 'humanitix', event.id);
}

async function processEventbriteWebhook(supabase: any, webhookEvent: WebhookEvent): Promise<void> {
  const { payload } = webhookEvent;
  const { config, api_url } = payload;
  
  if (!config || !api_url) {
    throw new Error('Invalid Eventbrite webhook payload');
  }

  // Extract event ID from the API URL
  const eventIdMatch = api_url.match(/\/events\/(\d+)\//);
  if (!eventIdMatch) {
    throw new Error('Could not extract event ID from API URL');
  }

  const eventbriteEventId = eventIdMatch[1];

  // Find the local event that corresponds to this Eventbrite event
  const { data: ticketPlatform, error: platformError } = await supabase
    .from('ticket_platforms')
    .select('event_id')
    .eq('platform', 'eventbrite')
    .eq('external_event_id', eventbriteEventId)
    .single();

  if (platformError || !ticketPlatform) {
    console.error(`No local event found for Eventbrite event ${eventbriteEventId}`);
    return;
  }

  const eventId = ticketPlatform.event_id;

  // Process different actions
  switch (config.action) {
    case 'order.placed':
    case 'order.updated':
      // We would need to fetch the order details from the API URL
      // For now, just trigger a sync
      await triggerEventSync(supabase, eventId, 'eventbrite', eventbriteEventId);
      break;
    case 'order.refunded':
      await triggerEventSync(supabase, eventId, 'eventbrite', eventbriteEventId);
      break;
  }
}

async function upsertTicketSale(supabase: any, eventId: string, order: any, platform: string): Promise<void> {
  const totalQuantity = order.tickets?.reduce((sum: number, ticket: any) => sum + ticket.quantity, 0) || 1;
  const ticketType = order.tickets?.length > 0 ? order.tickets[0].ticket_type_name : 'General';
  const customerName = platform === 'humanitix' 
    ? `${order.customer.first_name} ${order.customer.last_name}`
    : `${order.first_name} ${order.last_name}`;
  const customerEmail = platform === 'humanitix' 
    ? order.customer.email 
    : order.email;

  const { error } = await supabase
    .from('ticket_sales')
    .upsert({
      event_id: eventId,
      customer_name: customerName,
      customer_email: customerEmail,
      ticket_quantity: totalQuantity,
      ticket_type: ticketType,
      total_amount: order.total_amount || order.costs?.gross?.value || 0,
      platform: platform,
      platform_order_id: order.id,
      refund_status: 'none',
      purchase_date: order.created_at || order.created || new Date().toISOString(),
    });

  if (error) {
    console.error('Error upserting ticket sale:', error);
    throw error;
  }
}

async function updateTicketSaleRefund(supabase: any, order: any, isRefunded: boolean): Promise<void> {
  const { error } = await supabase
    .from('ticket_sales')
    .update({
      refund_status: isRefunded ? 'refunded' : 'cancelled',
      total_amount: isRefunded ? -(order.total_amount || order.costs?.gross?.value || 0) : (order.total_amount || order.costs?.gross?.value || 0),
    })
    .eq('platform_order_id', order.id);

  if (error) {
    console.error('Error updating refund status:', error);
    throw error;
  }
}

async function triggerEventSync(supabase: any, eventId: string, platform: string, externalEventId: string): Promise<void> {
  // Update the last_sync_at timestamp to trigger any watching processes
  const { error } = await supabase
    .from('ticket_platforms')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('platform', platform)
    .eq('external_event_id', externalEventId);

  if (error) {
    console.error('Error triggering sync:', error);
  }
}

async function logWebhookEvent(
  supabase: any, 
  webhookEvent: WebhookEvent, 
  success: boolean, 
  errorMessage?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('webhook_logs')
      .insert({
        platform: webhookEvent.platform,
        event_type: webhookEvent.eventType,
        payload: webhookEvent.payload,
        signature: webhookEvent.signature,
        timestamp: webhookEvent.timestamp,
        processed: success,
        error_message: errorMessage,
      });

    if (error) {
      console.error('Error logging webhook event:', error);
    }
  } catch (err) {
    console.error('Error logging webhook event:', err);
  }
}