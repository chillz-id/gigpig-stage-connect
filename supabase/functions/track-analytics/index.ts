import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingRequest {
  profile_id: string;
  event_type: 'view' | 'engagement';
  event_data?: {
    action_type?: string;
    action_details?: Record<string, any>;
    time_spent_seconds?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { profile_id, event_type, event_data } = await req.json() as TrackingRequest;

    // Get user info if authenticated
    const { data: { user } } = await supabaseClient.auth.getUser();

    // Get visitor info from request
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || null;

    // Get geolocation from IP (using a free service)
    let geoData = { country: null, region: null, city: null };
    if (ip !== 'unknown') {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}`);
        const geo = await geoResponse.json();
        if (geo.status === 'success') {
          geoData = {
            country: geo.country,
            region: geo.regionName,
            city: geo.city,
          };
        }
      } catch (e) {
        console.error('Failed to get geo data:', e);
      }
    }

    // Generate session ID from headers
    const sessionId = req.headers.get('x-session-id') || generateSessionId();

    // Check if this is a bot
    const isBot = /bot|crawl|spider|scraper|facebookexternalhit|WhatsApp|Slack|TwitterBot/i.test(userAgent);

    if (event_type === 'view') {
      // Track profile view
      const { error } = await supabaseClient
        .from('profile_views')
        .insert({
          profile_id,
          viewer_id: user?.id || null,
          session_id: sessionId,
          ip_address: ip !== 'unknown' ? ip : null,
          user_agent: userAgent,
          referrer: referer,
          country: geoData.country,
          region: geoData.region,
          city: geoData.city,
          device_type: getDeviceType(userAgent),
          browser: getBrowser(userAgent),
          os: getOS(userAgent),
          is_bot: isBot,
        });

      if (error) throw error;
    } else if (event_type === 'engagement' && event_data) {
      // Track engagement
      const { error } = await supabaseClient
        .from('profile_engagement')
        .insert({
          profile_id,
          viewer_id: user?.id || null,
          session_id: sessionId,
          action_type: event_data.action_type || 'unknown',
          action_details: event_data.action_details || {},
          time_spent_seconds: event_data.time_spent_seconds || null,
        });

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true, session_id: sessionId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error tracking analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'Unknown';
}

function getOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  return 'Unknown';
}