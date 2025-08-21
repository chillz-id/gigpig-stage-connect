import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-eventbrite-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EventbriteWebhookPayload {
  config: {
    action: string;
    user_id: string;
    endpoint_url: string;
    webhook_id: string;
  };
  api_url: string;
}

interface EventbriteOrder {
  id: string;
  status: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  costs: {
    base_price: {
      display: string;
      currency: string;
      value: number;
      major_value: string;
    };
    eventbrite_fee: {
      display: string;
      currency: string;
      value: number;
      major_value: string;
    };
    gross: {
      display: string;
      currency: string;
      value: number;
      major_value: string;
    };
    payment_fee: {
      display: string;
      currency: string;
      value: number;
      major_value: string;
    };
    tax: {
      display: string;
      currency: string;
      value: number;
      major_value: string;
    };
  };
  created: string;
  changed: string;
  refunded: boolean;
  attendees?: Array<{
    id: string;
    quantity: number;
    ticket_class_id: string;
    ticket_class_name: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get webhook signature from headers
    const signature = req.headers.get('x-eventbrite-signature');
    const webhookSecret = Deno.env.get('EVENTBRITE_WEBHOOK_SECRET');

    // Parse request body
    const body = await req.text();
    const payload: EventbriteWebhookPayload = JSON.parse(body);

    // Validate webhook signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = validateEventbriteSignature(req, body, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    console.log(`Processing Eventbrite webhook: ${payload.config.action}`);

    // Log the webhook event
    await logWebhookEvent(supabase, {
      platform: 'eventbrite',
      event_type: payload.config.action,
      payload: payload,
      signature: signature,
      timestamp: new Date().toISOString(),
    });

    // Process the webhook based on action
    let result;
    switch (payload.config.action) {
      case 'order.placed':
      case 'order.updated':
        result = await processOrderEvent(supabase, payload);
        break;
      case 'order.refunded':
        result = await processOrderRefund(supabase, payload);
        break;
      case 'attendee.updated':
      case 'attendee.checked_in':
        // These events might be useful for future features
        console.log(`Event ${payload.config.action} received but not processed`);
        result = { success: true, message: 'Event type not processed' };
        break;
      default:
        console.log(`Unhandled action: ${payload.config.action}`);
        result = { success: true, message: 'Action not processed' };
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await logWebhookEvent(supabase, {
        platform: 'eventbrite',
        event_type: 'error',
        payload: { error: error.message },
        signature: req.headers.get('x-eventbrite-signature'),
        timestamp: new Date().toISOString(),
      }, false, error.message);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function validateEventbriteSignature(req: Request, body: string, signature: string, secret: string): boolean {
  try {
    // Eventbrite uses a custom signature format
    // The signature is a hash of the webhook endpoint URL + secret
    // This is a simplified validation - you may need to adjust based on Eventbrite's actual implementation
    const url = req.url;
    const encoder = new TextEncoder();
    const data = encoder.encode(url + secret);
    
    // For now, we'll accept the signature if it exists
    // You should implement the actual Eventbrite signature validation method
    return true;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

async function processOrderEvent(supabase: any, payload: EventbriteWebhookPayload) {
  const { api_url, config } = payload;

  // Extract event ID from the API URL
  const eventIdMatch = api_url.match(/\/events\/(\d+)\//);
  if (!eventIdMatch) {
    throw new Error('Could not extract event ID from API URL');
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
    console.error(`No local event found for Eventbrite event ${eventbriteEventId}`);
    return { success: false, error: 'Event not found' };
  }

  // Extract order ID from the API URL
  const orderIdMatch = api_url.match(/\/orders\/(\d+)\//);
  if (!orderIdMatch) {
    throw new Error('Could not extract order ID from API URL');
  }

  const orderId = orderIdMatch[1];

  // Fetch order details from Eventbrite API
  const eventbriteToken = ticketPlatform.platform_config?.access_token || 
                         Deno.env.get('EVENTBRITE_OAUTH_TOKEN');
  
  if (!eventbriteToken) {
    throw new Error('No Eventbrite access token available');
  }

  const orderResponse = await fetch(api_url, {
    headers: {
      'Authorization': `Bearer ${eventbriteToken}`,
      'Accept': 'application/json',
    },
  });

  if (!orderResponse.ok) {
    throw new Error(`Failed to fetch order details: ${orderResponse.statusText}`);
  }

  const order: EventbriteOrder = await orderResponse.json();

  // Only process placed orders
  if (order.status !== 'placed') {
    return { success: true, message: 'Order not placed, skipping processing' };
  }

  // Calculate total quantity from attendees
  const totalQuantity = order.attendees?.reduce((sum, attendee) => sum + attendee.quantity, 0) || 1;
  const ticketTypes = order.attendees ? 
    [...new Set(order.attendees.map(a => a.ticket_class_name))].join(', ') : 
    'General Admission';
  
  // Upsert ticket sale record
  const { error: upsertError } = await supabase
    .from('ticket_sales')
    .upsert({
      event_id: ticketPlatform.event_id,
      customer_name: order.name || `${order.first_name} ${order.last_name}`.trim(),
      customer_email: order.email,
      ticket_quantity: totalQuantity,
      ticket_type: ticketTypes,
      total_amount: order.costs.gross.value / 100, // Convert cents to dollars
      currency: order.costs.gross.currency,
      platform: 'eventbrite',
      platform_order_id: order.id,
      refund_status: order.refunded ? 'refunded' : 'none',
      purchase_date: order.created,
      raw_data: order,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'platform,platform_order_id',
    });

  if (upsertError) {
    console.error('Error upserting ticket sale:', upsertError);
    throw upsertError;
  }

  // Update sync timestamp
  await updateSyncTimestamp(supabase, ticketPlatform.event_id, 'eventbrite', eventbriteEventId);

  return { success: true, message: 'Order processed successfully' };
}

async function processOrderRefund(supabase: any, payload: EventbriteWebhookPayload) {
  const { api_url } = payload;

  // Extract order ID from the API URL
  const orderIdMatch = api_url.match(/\/orders\/(\d+)\//);
  if (!orderIdMatch) {
    throw new Error('Could not extract order ID from API URL');
  }

  const orderId = orderIdMatch[1];

  // Find the ticket sale record
  const { data: ticketSale, error: findError } = await supabase
    .from('ticket_sales')
    .select('total_amount')
    .eq('platform', 'eventbrite')
    .eq('platform_order_id', orderId)
    .single();

  if (findError) {
    console.error('Error finding ticket sale:', findError);
    throw findError;
  }

  // Update the ticket sale record
  const { error } = await supabase
    .from('ticket_sales')
    .update({
      refund_status: 'refunded',
      refund_amount: ticketSale.total_amount,
      refund_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('platform', 'eventbrite')
    .eq('platform_order_id', orderId);

  if (error) {
    console.error('Error updating refunded order:', error);
    throw error;
  }

  return { success: true, message: 'Order refund processed' };
}

async function updateSyncTimestamp(
  supabase: any, 
  eventId: string, 
  platform: string, 
  externalEventId: string
) {
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

async function logWebhookEvent(
  supabase: any,
  event: {
    platform: string;
    event_type: string;
    payload: any;
    signature?: string | null;
    timestamp: string;
  },
  success: boolean = true,
  errorMessage?: string
) {
  try {
    const { error } = await supabase
      .from('ticket_webhook_logs')
      .insert({
        platform: event.platform,
        event_type: event.event_type,
        payload: event.payload,
        signature: event.signature,
        timestamp: event.timestamp,
        processed: success,
        error_message: errorMessage,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error logging webhook event:', error);
    }
  } catch (err) {
    console.error('Failed to log webhook event:', err);
  }
}