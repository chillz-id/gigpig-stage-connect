import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-humanitix-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface HumanitixWebhookPayload {
  event_type: string;
  data: {
    event: {
      id: string;
      name: string;
      date: string;
    };
    order: {
      id: string;
      status: string;
      total_amount: number;
      currency: string;
      created_at: string;
      customer: {
        email: string;
        first_name: string;
        last_name: string;
      };
      tickets: Array<{
        id: string;
        ticket_type_id: string;
        ticket_type_name: string;
        quantity: number;
        price: number;
      }>;
    };
  };
  timestamp: string;
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
    const signature = req.headers.get('x-humanitix-signature');
    const webhookSecret = Deno.env.get('HUMANITIX_WEBHOOK_SECRET');

    // Parse request body
    const body = await req.text();
    const payload: HumanitixWebhookPayload = JSON.parse(body);

    // Validate webhook signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = validateHumanitixSignature(body, signature, webhookSecret);
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

    console.log(`Processing Humanitix webhook: ${payload.event_type}`);

    // Log the webhook event
    await logWebhookEvent(supabase, {
      platform: 'humanitix',
      event_type: payload.event_type,
      payload: payload,
      signature: signature,
      timestamp: new Date().toISOString(),
    });

    // Process the webhook based on event type
    let result;
    switch (payload.event_type) {
      case 'order.created':
      case 'order.updated':
        result = await processOrderEvent(supabase, payload);
        break;
      case 'order.cancelled':
        result = await processOrderCancellation(supabase, payload);
        break;
      case 'order.refunded':
        result = await processOrderRefund(supabase, payload);
        break;
      default:
        console.log(`Unhandled event type: ${payload.event_type}`);
        result = { success: true, message: 'Event type not processed' };
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
        platform: 'humanitix',
        event_type: 'error',
        payload: { error: error.message },
        signature: req.headers.get('x-humanitix-signature'),
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

function validateHumanitixSignature(body: string, signature: string, secret: string): boolean {
  try {
    // Humanitix uses HMAC-SHA256 for webhook signatures
    const hmac = createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

async function processOrderEvent(supabase: any, payload: HumanitixWebhookPayload) {
  const { data } = payload;
  const { order, event } = data;

  // Only process paid orders
  if (order.status !== 'paid') {
    return { success: true, message: 'Order not paid, skipping processing' };
  }

  // Find the local event
  const { data: ticketPlatform, error: platformError } = await supabase
    .from('ticket_platforms')
    .select('event_id')
    .eq('platform', 'humanitix')
    .eq('external_event_id', event.id)
    .single();

  if (platformError || !ticketPlatform) {
    console.error(`No local event found for Humanitix event ${event.id}`);
    return { success: false, error: 'Event not found' };
  }

  // Calculate total quantity and get ticket details
  const totalQuantity = order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  const ticketTypes = [...new Set(order.tickets.map(t => t.ticket_type_name))].join(', ');
  
  // Upsert ticket sale record
  const { error: upsertError } = await supabase
    .from('ticket_sales')
    .upsert({
      event_id: ticketPlatform.event_id,
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
    });

  if (upsertError) {
    console.error('Error upserting ticket sale:', upsertError);
    throw upsertError;
  }

  // Update sync timestamp
  await updateSyncTimestamp(supabase, ticketPlatform.event_id, 'humanitix', event.id);

  return { success: true, message: 'Order processed successfully' };
}

async function processOrderCancellation(supabase: any, payload: HumanitixWebhookPayload) {
  const { data } = payload;
  const { order } = data;

  // Update the ticket sale record
  const { error } = await supabase
    .from('ticket_sales')
    .update({
      refund_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('platform', 'humanitix')
    .eq('platform_order_id', order.id);

  if (error) {
    console.error('Error updating cancelled order:', error);
    throw error;
  }

  return { success: true, message: 'Order cancellation processed' };
}

async function processOrderRefund(supabase: any, payload: HumanitixWebhookPayload) {
  const { data } = payload;
  const { order } = data;

  // Update the ticket sale record
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