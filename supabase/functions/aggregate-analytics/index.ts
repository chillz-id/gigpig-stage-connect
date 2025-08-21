import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get target date from request or default to yesterday
    const { target_date } = await req.json().catch(() => ({}));
    const dateToProcess = target_date || 
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Call the aggregate function
    const { error } = await supabaseClient.rpc('aggregate_profile_analytics', {
      target_date: dateToProcess,
    });

    if (error) throw error;

    // Also cleanup old data
    const { error: cleanupError } = await supabaseClient.rpc('cleanup_old_analytics');
    if (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_date: dateToProcess,
        message: 'Analytics aggregated successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error aggregating analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});