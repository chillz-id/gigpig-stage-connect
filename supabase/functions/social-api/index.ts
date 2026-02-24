import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const METRICOOL_BASE_URL = 'https://app.metricool.com/api';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Metricool credentials from secrets
    const userToken = Deno.env.get('METRICOOL_USER_TOKEN');
    const userId = Deno.env.get('METRICOOL_USER_ID');
    const blogId = Deno.env.get('METRICOOL_BLOG_ID');

    if (!userToken || !userId || !blogId) {
      return new Response(
        JSON.stringify({ error: 'Metricool API not configured. Set METRICOOL_USER_TOKEN, METRICOOL_USER_ID, METRICOOL_BLOG_ID secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse proxy request
    const { endpoint, method, body, queryParams, blogId: requestBlogId } = await req.json() as {
      endpoint: string;
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: unknown;
      queryParams?: Record<string, string>;
      blogId?: string;
    };

    if (!endpoint || !method) {
      return new Response(
        JSON.stringify({ error: 'endpoint and method are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build URL with auth params and optional query params
    // Use blogId from request body if provided (multi-brand support), else fall back to env var
    const activeBlogId = requestBlogId ?? blogId;
    const url = new URL(`${METRICOOL_BASE_URL}${endpoint}`);
    url.searchParams.set('userToken', userToken);
    url.searchParams.set('userId', userId);
    url.searchParams.set('blogId', activeBlogId);

    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        url.searchParams.set(key, value);
      }
    }

    // Forward request to Metricool
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Mc-Auth': userToken,
      },
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const metricoolResponse = await fetch(url.toString(), fetchOptions);
    const responseText = await metricoolResponse.text();

    // Try to parse as JSON, fall back to text
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    return new Response(
      JSON.stringify({
        ok: metricoolResponse.ok,
        status: metricoolResponse.status,
        data: responseData,
      }),
      {
        status: metricoolResponse.ok ? 200 : metricoolResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Social API proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to proxy request to Metricool' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
