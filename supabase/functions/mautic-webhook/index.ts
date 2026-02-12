import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mautic-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const WEBHOOK_SECRET = Deno.env.get('MAUTIC_WEBHOOK_SECRET') ?? '';
const MAX_BOUNCES = 3;

interface MauticWebhookPayload {
  'mautic.email_on_open'?: MauticEmailEvent[];
  'mautic.email_on_click'?: MauticEmailClickEvent[];
  'mautic.email_on_unsubscribe'?: MauticEmailEvent[];
  'mautic.email_on_bounce'?: MauticEmailEvent[];
  timestamp: string;
}

interface MauticEmailEvent {
  id: number;
  lead: {
    id: number;
    email: string;
    fields?: Record<string, unknown>;
  };
  email: {
    id: number;
    name: string;
    subject: string;
  };
  dateSent?: string;
  dateRead?: string;
}

interface MauticEmailClickEvent extends MauticEmailEvent {
  url: string;
}

function validateSignature(body: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) return true;
  if (!signature) return false;

  try {
    const hmac = createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(body);
    const expected = hmac.digest('hex');
    return signature === expected;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.text();
    const signature = req.headers.get('x-mautic-signature');

    if (!validateSignature(body, signature)) {
      console.error('Invalid Mautic webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: MauticWebhookPayload = JSON.parse(body);
    let eventsProcessed = 0;

    // Process each event type
    for (const [eventKey, events] of Object.entries(payload)) {
      if (eventKey === 'timestamp' || !Array.isArray(events)) continue;

      const eventType = eventKey.replace('mautic.email_on_', '');
      const validEventTypes = ['open', 'click', 'unsubscribe', 'bounce'];
      if (!validEventTypes.includes(eventType)) {
        console.warn(`Unknown event type: ${eventKey} -> ${eventType}`);
        continue;
      }

      for (const event of events) {
        const mauticEmail = event.lead?.email;
        if (!mauticEmail) continue;

        // Find the customer by their Mautic contact ID
        const mauticContactId = event.lead?.id;
        let customerId: string | null = null;

        if (mauticContactId) {
          const { data: syncRecord } = await supabase
            .from('mautic_sync_status')
            .select('customer_id')
            .eq('mautic_contact_id', mauticContactId)
            .single();

          customerId = syncRecord?.customer_id ?? null;
        }

        // Fallback: look up by email
        if (!customerId) {
          const { data: emailRecord } = await supabase
            .from('customer_emails')
            .select('customer_id')
            .eq('email', mauticEmail)
            .maybeSingle();

          customerId = emailRecord?.customer_id ?? null;
        }

        if (!customerId) {
          console.warn(`No customer found for Mautic contact ${mauticContactId} (${mauticEmail})`);
          continue;
        }

        // Insert engagement event
        await supabase.from('customer_email_engagement').insert({
          customer_id: customerId,
          event_type: eventType,
          campaign_name: event.email?.name ?? null,
          email_subject: event.email?.subject ?? null,
          link_url: (event as MauticEmailClickEvent).url ?? null,
          occurred_at: event.dateRead || event.dateSent || new Date().toISOString(),
          mautic_email_id: String(event.email?.id),
          raw_payload: event,
        });

        // Side effects
        if (eventType === 'unsubscribe') {
          await supabase
            .from('customer_profiles')
            .update({ marketing_opt_in: false, updated_at: new Date().toISOString() })
            .eq('id', customerId);

          console.log(`Unsubscribed customer ${customerId} (${mauticEmail})`);
        }

        if (eventType === 'bounce') {
          // Count bounces for this customer
          const { count } = await supabase
            .from('customer_email_engagement')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', customerId)
            .eq('event_type', 'bounce');

          if (count && count >= MAX_BOUNCES) {
            await supabase
              .from('customer_emails')
              .update({ is_valid: false })
              .eq('customer_id', customerId)
              .eq('email', mauticEmail);

            console.log(`Flagged email as invalid for customer ${customerId} after ${count} bounces`);
          }
        }

        eventsProcessed++;
      }
    }

    console.log(`Mautic webhook processed: ${eventsProcessed} events`);

    return new Response(
      JSON.stringify({ success: true, events_processed: eventsProcessed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Mautic webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
