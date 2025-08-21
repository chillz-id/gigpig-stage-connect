import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get visitor IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';

    // Get geolocation from IP
    let geoData = {
      ip,
      country: null as string | null,
      region: null as string | null,
      city: null as string | null,
    };

    if (ip !== 'unknown') {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}`);
        const geo = await geoResponse.json();
        if (geo.status === 'success') {
          geoData = {
            ip,
            country: geo.country,
            region: geo.regionName,
            city: geo.city,
          };
        }
      } catch (e) {
        console.error('Failed to get geo data:', e);
      }
    }

    return new Response(
      JSON.stringify(geoData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error getting visitor info:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});