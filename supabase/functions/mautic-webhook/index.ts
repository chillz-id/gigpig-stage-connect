import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const WEBHOOK_SECRET = Deno.env.get('MAUTIC_WEBHOOK_SECRET') ?? '';
const MAX_BOUNCES = 3;

// Mautic 7 wraps each event as { stat: { ... }, timestamp }
interface MauticWebhookPayload {
  'mautic.email_on_open'?: MauticWrappedEvent[];
  'mautic.email_on_click'?: MauticWrappedEvent[];
  'mautic.email_on_unsubscribe'?: MauticWrappedEvent[];
  'mautic.email_on_bounce'?: MauticWrappedEvent[];
  timestamp?: string;
}

interface MauticWrappedEvent {
  stat: MauticStat;
  timestamp: string;
}

interface MauticStat {
  id: number;
  emailAddress: string;
  dateSent?: string;
  dateRead?: string;
  isRead?: boolean;
  isFailed?: boolean;
  lead: {
    id: number;
    points?: number;
    color?: string;
    fields?: Record<string, unknown>;
  };
  email: {
    id: number;
    name: string;
    subject: string;
    language?: string;
    category?: unknown;
  };
  // Click events include the URL at the stat level or as a separate field
  url?: string;
}

function validateSignature(body: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) return true;
  if (!signature) return false;

  try {
    const hmac = createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(body);
    const expected = hmac.digest('base64');
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
    const signature = req.headers.get('webhook-signature');

    if (!validateSignature(body, signature)) {
      console.error('Invalid Mautic webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: MauticWebhookPayload = JSON.parse(body);
    let eventsProcessed = 0;
    let eventsSkipped = 0;

    for (const [eventKey, wrappedEvents] of Object.entries(payload)) {
      if (eventKey === 'timestamp' || !Array.isArray(wrappedEvents)) continue;

      const eventType = eventKey.replace('mautic.email_on_', '');
      const validEventTypes = ['open', 'click', 'unsubscribe', 'bounce'];
      if (!validEventTypes.includes(eventType)) continue;

      for (const wrapped of wrappedEvents) {
        // Mautic 7: data is inside wrapped.stat
        const stat = wrapped.stat ?? wrapped;
        const mauticEmail = stat.emailAddress ?? stat.lead?.email;
        if (!mauticEmail) { eventsSkipped++; continue; }

        // Find customer by Mautic contact ID
        const mauticContactId = stat.lead?.id;
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
          eventsSkipped++;
          continue;
        }

        // Insert engagement event
        await supabase.from('customer_email_engagement').insert({
          customer_id: customerId,
          event_type: eventType,
          campaign_name: stat.email?.name ?? null,
          email_subject: stat.email?.subject ?? null,
          link_url: stat.url ?? null,
          occurred_at: stat.dateRead || stat.dateSent || new Date().toISOString(),
          mautic_email_id: String(stat.email?.id),
          raw_payload: stat,
        });

        // Side effects
        if (eventType === 'unsubscribe') {
          await supabase
            .from('customer_profiles')
            .update({ marketing_opt_in: false, updated_at: new Date().toISOString() })
            .eq('id', customerId);
        }

        if (eventType === 'bounce') {
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
          }
        }

        eventsProcessed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, events_processed: eventsProcessed, events_skipped: eventsSkipped }),
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
