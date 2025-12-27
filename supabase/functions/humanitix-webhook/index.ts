import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

// Signals Gateway configuration
const SIGNALS_GATEWAY_URL = 'https://sg.standupsydney.com';
const META_PIXEL_ID = '199052578865232';

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

// SHA256 hash function for Meta user data
async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Send Purchase event to Meta Conversions API via Signals Gateway
async function sendMetaPurchaseEvent(order: {
  email: string;
  firstName: string;
  lastName: string;
  value: number;
  currency: string;
  orderId: string;
  eventName: string;
  quantity: number;
}): Promise<void> {
  try {
    const accessToken = Deno.env.get('META_ACCESS_TOKEN');
    if (!accessToken) {
      console.log('META_ACCESS_TOKEN not configured, skipping Conversions API');
      return;
    }

    // Hash user data for privacy
    const hashedEmail = await sha256Hash(order.email);
    const hashedFirstName = await sha256Hash(order.firstName);
    const hashedLastName = await sha256Hash(order.lastName);

    const eventData = {
      data: [{
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: 'https://standupsydney.com',
        user_data: {
          em: [hashedEmail],
          fn: [hashedFirstName],
          ln: [hashedLastName],
        },
        custom_data: {
          currency: order.currency || 'AUD',
          value: order.value,
          content_type: 'product',
          content_name: order.eventName,
          content_category: 'Comedy Event Ticket',
          num_items: order.quantity,
          order_id: order.orderId,
          contents: [{
            id: `humanitix_${order.orderId}`,
            quantity: order.quantity,
            item_price: order.value / order.quantity,
          }],
        },
      }],
      access_token: accessToken,
    };

    // Send to Signals Gateway Conversions API endpoint
    const response = await fetch(
      `${SIGNALS_GATEWAY_URL}/capi/${META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Meta Conversions API error:', response.status, errorText);
    } else {
      const result = await response.json();
      console.log('Meta Purchase event sent successfully:', result);
    }
  } catch (error) {
    console.error('Failed to send Meta Purchase event:', error);
    // Don't throw - we don't want to fail the webhook if Meta tracking fails
  }
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

  // Send Purchase event to Meta Conversions API via Signals Gateway
  await sendMetaPurchaseEvent({
    email: order.customer.email,
    firstName: order.customer.first_name,
    lastName: order.customer.last_name,
    value: order.total_amount,
    currency: order.currency || 'AUD',
    orderId: order.id,
    eventName: event.name,
    quantity: totalQuantity,
  });

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
