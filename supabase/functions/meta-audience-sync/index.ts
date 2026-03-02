import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const META_API_VERSION = 'v21.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;
const BATCH_SIZE = 10_000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('META_ACCESS_TOKEN');
    const adAccountId = Deno.env.get('META_AD_ACCOUNT_ID');

    if (!accessToken || !adAccountId) {
      return new Response(
        JSON.stringify({ error: 'Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get or create Custom Audience ID
    let audienceId = Deno.env.get('META_CUSTOM_AUDIENCE_ID') ?? '';

    if (!audienceId) {
      const { data: setting } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'meta_custom_audience_id')
        .single();
      audienceId = setting?.value ?? '';
    }

    if (!audienceId) {
      const createResp = await fetch(`${META_BASE_URL}/act_${adAccountId}/customaudiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          name: 'GigPigs - All Customers',
          description: 'Auto-synced customer list from GigPigs platform',
          subtype: 'CUSTOM',
          customer_file_source: 'USER_PROVIDED_ONLY',
        }),
      });
      const createData = await createResp.json();
      if (createData.error) {
        return new Response(
          JSON.stringify({ error: 'Failed to create audience', meta_error: createData.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      audienceId = createData.id;
      await supabase.from('app_settings').upsert(
        { key: 'meta_custom_audience_id', value: audienceId },
        { onConflict: 'key' }
      );
    }

    // Claim a batch using batch_id via RPC
    const batchId = crypto.randomUUID();
    await supabase.rpc('exec_sql', {
      sql: `UPDATE meta_audience_customers SET sync_batch_id = '${batchId}' WHERE id IN (SELECT id FROM meta_audience_customers WHERE synced_at IS NULL AND (sync_status IS NULL OR sync_status = 'pending') ORDER BY created_at ASC LIMIT ${BATCH_SIZE})`
    });

    // Fetch the claimed batch
    const { data: customers, error: fetchError } = await supabase
      .from('meta_audience_customers')
      .select('id, email_hash, phone_hash, first_name_hash, last_name_hash, city_hash, state_hash, postcode_hash, country_hash, dob_hash, gender_hash')
      .eq('sync_batch_id', batchId);

    if (fetchError || !customers || customers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No customers to sync', synced: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build and send to Meta
    const schema = ['EMAIL', 'PHONE', 'FN', 'LN', 'CT', 'ST', 'ZIP', 'COUNTRY', 'DOB', 'GEN'];
    const data = customers.map((c) => [
      c.email_hash ?? '', c.phone_hash ?? '', c.first_name_hash ?? '',
      c.last_name_hash ?? '', c.city_hash ?? '', c.state_hash ?? '',
      c.postcode_hash ?? '', c.country_hash ?? '', c.dob_hash ?? '',
      c.gender_hash ?? '',
    ]);

    const metaResp = await fetch(`${META_BASE_URL}/${audienceId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: { schema, data },
        access_token: accessToken,
      }),
    });

    const metaResult = await metaResp.json();

    if (metaResult.error) {
      await supabase.rpc('exec_sql', {
        sql: `UPDATE meta_audience_customers SET sync_status = 'failed', error_message = '${metaResult.error.message.replace(/'/g, "''")}' WHERE sync_batch_id = '${batchId}'`
      });
      return new Response(
        JSON.stringify({ error: 'Meta API error', meta_error: metaResult.error, attempted: customers.length }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark batch as synced
    await supabase.rpc('exec_sql', {
      sql: `UPDATE meta_audience_customers SET sync_status = 'synced', synced_at = NOW(), error_message = NULL, meta_response = '${JSON.stringify(metaResult).replace(/'/g, "''")}'::jsonb WHERE sync_batch_id = '${batchId}'`
    });

    // Log
    await supabase.from('meta_sync_log').insert({
      sync_type: 'audience',
      status: 'success',
      meta_response: {
        audience_id: audienceId,
        num_received: metaResult.num_received,
        num_invalid_entries: metaResult.num_invalid_entries,
        batch_size: customers.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        audience_id: audienceId,
        synced: customers.length,
        num_received: metaResult.num_received,
        num_invalid_entries: metaResult.num_invalid_entries ?? 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
