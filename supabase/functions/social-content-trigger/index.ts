/**
 * Social Content Trigger Edge Function
 *
 * Called via database webhook or HTTP to queue content generation
 * when events are created/updated or lineup changes occur.
 *
 * This function does NOT generate AI content — it only creates
 * entries in social_content_queue. The user then runs the
 * /social-content Claude Code skill to process the queue.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TriggerPayload {
  trigger_type: 'event_created' | 'lineup_changed' | 'ticket_milestone' | 'manual';
  entity_id?: string;       // Event ID
  organization_id: string;
  data?: Record<string, unknown>;
  priority?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Check if this is a DB webhook (no auth header) or HTTP call (has auth)
    const authHeader = req.headers.get('authorization');
    let payload: TriggerPayload;

    if (authHeader) {
      // HTTP call from frontend — verify user auth
      const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      payload = await req.json() as TriggerPayload;
    } else {
      // DB webhook — use the webhook payload format
      const body = await req.json() as {
        type: string;
        table: string;
        record: Record<string, unknown>;
        old_record?: Record<string, unknown>;
      };

      // Determine trigger type from the webhook event
      const triggerType = body.type === 'INSERT' ? 'event_created' : 'lineup_changed';
      const record = body.record;

      payload = {
        trigger_type: triggerType,
        entity_id: record.id as string,
        organization_id: record.organization_id as string,
        data: record,
      };
    }

    if (!payload.organization_id) {
      return new Response(
        JSON.stringify({ error: 'organization_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Use service role to insert into queue (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if there's already a pending queue item for this entity
    if (payload.entity_id) {
      const { data: existing } = await supabase
        .from('social_content_queue')
        .select('id')
        .eq('trigger_entity_id', payload.entity_id)
        .eq('trigger_type', payload.trigger_type)
        .in('status', ['pending', 'generating'])
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({
            ok: true,
            message: 'Queue item already exists for this entity',
            queue_id: existing[0]!.id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // Enrich trigger data with event details if we have an entity ID
    let triggerData = payload.data ?? {};
    if (payload.entity_id && !payload.data) {
      const { data: event } = await supabase
        .from('events')
        .select('id, name, title, venue, event_date, start_time, description, ticket_url, hero_image_url, organization_id, tickets_sold, capacity')
        .eq('id', payload.entity_id)
        .single();

      if (event) {
        triggerData = event as Record<string, unknown>;
      }
    }

    // Insert into queue
    const { data: queueItem, error: insertError } = await supabase
      .from('social_content_queue')
      .insert({
        organization_id: payload.organization_id,
        trigger_type: payload.trigger_type,
        trigger_entity_id: payload.entity_id ?? null,
        trigger_data: triggerData,
        priority: payload.priority ?? 5,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert queue item:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create queue entry', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, queue_id: queueItem.id, trigger_type: payload.trigger_type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Social content trigger error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
