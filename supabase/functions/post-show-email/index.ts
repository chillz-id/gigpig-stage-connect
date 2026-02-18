import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAUTIC_URL = Deno.env.get('MAUTIC_URL') ?? 'https://mautic.gigpigs.app';
const MAUTIC_CLIENT_ID = Deno.env.get('MAUTIC_CLIENT_ID') ?? '';
const MAUTIC_CLIENT_SECRET = Deno.env.get('MAUTIC_CLIENT_SECRET') ?? '';
const PUBLIC_COMEDIAN_BASE_URL = Deno.env.get('PUBLIC_COMEDIAN_BASE_URL') ?? 'https://gigpigs.app/comedian';
const SEND_CONCURRENCY = 5;

// --- OAuth2 Token Management ---

interface OAuthToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: OAuthToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken.access_token;
  }

  const response = await fetch(`${MAUTIC_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: MAUTIC_CLIENT_ID,
      client_secret: MAUTIC_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth2 token request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.access_token || !data.expires_in) {
    throw new Error('Invalid OAuth2 response: missing access_token or expires_in');
  }

  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in * 1000),
  };

  return cachedToken.access_token;
}

async function mauticFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const response = await fetch(`${MAUTIC_URL}/api${path}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // If 401, refresh token and retry once
  if (response.status === 401) {
    cachedToken = null;
    const newToken = await getAccessToken();
    return fetch(`${MAUTIC_URL}/api${path}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  return response;
}

// --- Data Types ---

interface LineupAct {
  spot_order: number;
  spot_name: string;
  stage_name: string;
  bio: string | null;
  headshot_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  website: string | null;
  slug: string | null;
}

interface RequestBody {
  event_id: string;
  mautic_email_id: number;
  dry_run?: boolean;
  test_email?: string | null;
}

// --- HTML Generation ---

function encodeImageUrl(url: string): string {
  // Split URL into base and path, encode spaces and special chars in path segments
  try {
    const u = new URL(url);
    u.pathname = u.pathname.split('/').map(segment => encodeURIComponent(decodeURIComponent(segment))).join('/');
    return u.toString();
  } catch {
    return url.replace(/ /g, '%20');
  }
}

function truncateBio(bio: string | null): string {
  if (!bio) return '';
  const sentences = bio.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length <= 2) return bio.trim();
  return sentences.slice(0, 2).join('').trim();
}

const ICON_BASE = 'https://pdikjpfulhhpqpxzpgtu.supabase.co/storage/v1/object/public/directory-media/social-icons';

function socialIcon(url: string, iconFile: string, alt: string): string {
  return `<a href="${url}" style="text-decoration:none;display:inline-block;margin-right:8px;"><img src="${ICON_BASE}/${iconFile}" alt="${alt}" width="24" height="24" style="width:24px;height:24px;display:block;border:0;" /></a>`;
}

function generateSocialLinksHTML(act: LineupAct): string {
  const icons: string[] = [];

  if (act.instagram_url) icons.push(socialIcon(act.instagram_url, 'instagram.png', 'Instagram'));
  if (act.tiktok_url) icons.push(socialIcon(act.tiktok_url, 'tiktok.png', 'TikTok'));
  if (act.youtube_url) icons.push(socialIcon(act.youtube_url, 'youtube.png', 'YouTube'));
  if (act.facebook_url) icons.push(socialIcon(act.facebook_url, 'facebook.png', 'Facebook'));
  if (act.twitter_url) icons.push(socialIcon(act.twitter_url, 'twitter.png', 'X'));

  if (icons.length === 0) return '';

  return `<div style="margin-top:8px;">${icons.join('')}</div>`;
}

function generateLineupHTML(lineup: LineupAct[]): string {
  if (lineup.length === 0) {
    return '';
  }

  const actBlocks = lineup.map((act, index) => {
    const encodedHeadshotUrl = act.headshot_url ? encodeImageUrl(act.headshot_url) : null;
    const headshot = encodedHeadshotUrl
      ? `<img src="${encodedHeadshotUrl}" alt="${act.stage_name}" width="80" height="80" style="border-radius:50%;width:80px;height:80px;display:block;object-fit:cover;" />`
      : `<div style="width:80px;height:80px;border-radius:50%;background-color:#E5E7EB;display:block;"></div>`;

    const truncatedBio = truncateBio(act.bio);
    const socialLinks = generateSocialLinksHTML(act);
    const profileUrl = act.slug ? `${PUBLIC_COMEDIAN_BASE_URL}/${act.slug}` : null;

    const divider = index < lineup.length - 1
      ? '<tr><td colspan="2" style="padding:16px 0;"><hr style="border:none;border-top:1px solid #E5E7EB;margin:0;"></td></tr>'
      : '';

    return `
      <tr>
        <td style="padding:16px 0;vertical-align:top;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="width:80px;vertical-align:top;padding-right:16px;">
                ${headshot}
              </td>
              <td style="vertical-align:top;font-family:Arial,Helvetica,sans-serif;">
                <div style="font-size:18px;font-weight:bold;color:#111827;margin-bottom:4px;">
                  ${act.stage_name}
                </div>
                ${truncatedBio ? `<div style="font-size:14px;color:#4B5563;margin-bottom:8px;line-height:1.5;">${truncatedBio}</div>` : ''}
                ${socialLinks}
                ${profileUrl ? `<div style="margin-top:12px;"><a href="${profileUrl}" style="color:#3B82F6;text-decoration:none;font-size:14px;">See upcoming shows &rarr;</a></div>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${divider}`;
  }).join('');

  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;">${actBlocks}</table>`;
}

function formatShowDate(eventDate: string | null): string {
  if (!eventDate) return 'Date TBA';
  try {
    const date = new Date(eventDate);
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return eventDate;
  }
}

// --- Main Handler ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Admin route: proxy arbitrary Mautic API calls
    if (body.action === 'mautic_admin') {
      const { method = 'GET', api_path, email_id, patch_data } = body;
      let path: string;
      if (api_path) {
        path = api_path;
      } else {
        path = method === 'PATCH' ? `/emails/${email_id}/edit` : `/emails/${email_id}`;
      }
      const fetchOptions: RequestInit = {};
      if (method !== 'GET') {
        fetchOptions.method = method;
        if (patch_data) fetchOptions.body = JSON.stringify(patch_data);
      }
      const response = await mauticFetch(path, fetchOptions);
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { event_id, mautic_email_id, dry_run = false, test_email = null } = body as RequestBody;

    if (!event_id || !mautic_email_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event_id, mautic_email_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, name, venue, event_date, organization_id, discount_code')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      console.error('Event fetch error:', eventError);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const showName = event.title || event.name || 'Comedy Show';
    const venueName = event.venue || 'Venue TBA';

    // 2. Fetch organization
    let orgName = 'Stand Up Sydney';
    let orgLogoUrl: string | null = null;
    let googleReviewUrl: string | null = null;

    if (event.organization_id) {
      const { data: org } = await supabase
        .from('organization_profiles')
        .select('organization_name, logo_url, google_review_url')
        .eq('id', event.organization_id)
        .single();

      if (org) {
        orgName = org.organization_name || orgName;
        orgLogoUrl = org.logo_url;
        googleReviewUrl = org.google_review_url;
      }
    }

    // 3. Fetch lineup from event_spots → directory_profiles
    //    Primary path: directory_profile_id → directory_profiles
    //    Spots without a linked profile are skipped (unfilled slots)
    const { data: spotsData, error: spotsError } = await supabase
      .from('event_spots')
      .select(`
        spot_order,
        spot_name,
        spot_category,
        directory_profile_id,
        directory_profiles:directory_profile_id (
          stage_name,
          slug,
          short_bio,
          long_bio,
          primary_headshot_url,
          instagram_url,
          tiktok_url,
          youtube_url,
          facebook_url,
          twitter_url,
          website
        )
      `)
      .eq('event_id', event_id)
      .eq('spot_type', 'act')
      .not('spot_category', 'in', '("doors","intermission")')
      .not('directory_profile_id', 'is', null)
      .order('spot_order', { ascending: true });

    if (spotsError) {
      console.warn('Lineup fetch error:', spotsError);
    }

    const lineup: LineupAct[] = (spotsData || [])
      .filter((spot: Record<string, unknown>) => spot.directory_profiles)
      .map((spot: Record<string, unknown>) => {
        const dp = spot.directory_profiles as {
          stage_name: string;
          slug: string | null;
          short_bio: string | null;
          long_bio: string | null;
          primary_headshot_url: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          youtube_url: string | null;
          facebook_url: string | null;
          twitter_url: string | null;
          website: string | null;
        };
        return {
          spot_order: spot.spot_order as number,
          spot_name: spot.spot_name as string,
          stage_name: dp.stage_name,
          bio: dp.short_bio || dp.long_bio || null,
          headshot_url: dp.primary_headshot_url,
          instagram_url: dp.instagram_url,
          tiktok_url: dp.tiktok_url,
          twitter_url: dp.twitter_url,
          youtube_url: dp.youtube_url,
          facebook_url: dp.facebook_url,
          website: dp.website,
          slug: dp.slug,
        };
      });

    console.log(`Lineup: ${lineup.length} acts with directory profiles`);

    // 4. Generate lineup HTML
    const lineupHTML = generateLineupHTML(lineup);

    // 5. Prepare tokens for Mautic template
    const showDate = formatShowDate(event.event_date);

    const discountCode = event.discount_code || null;
    const discountExpiry = discountCode
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';

    const tokens: Record<string, string> = {
      '{lineup_html}': lineupHTML,
      '{show_name}': showName,
      '{show_date}': showDate,
      '{venue_name}': venueName,
      '{org_name}': orgName,
      '{google_review_url}': googleReviewUrl || '',
      '{google_review_button}': googleReviewUrl
        ? `<table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:16px auto 0;"><tr><td align="center" bgcolor="#111827" style="border-radius:6px;"><a href="${googleReviewUrl}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,Helvetica,sans-serif;">Leave a Google Review</a></td></tr></table>`
        : '',
      '{org_logo_url}': orgLogoUrl || '',
      '{discount_section}': discountCode
        ? `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ECFDF5;border-radius:8px;margin-top:8px;"><tr><td style="padding:24px;text-align:center;font-family:Arial,Helvetica,sans-serif;"><h2 style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111827;">50% off your next show!</h2><p style="margin:0 0 16px;font-size:14px;color:#4B5563;">Use this code at checkout — expires ${discountExpiry}</p><table cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="background-color:#ffffff;border:2px dashed #10B981;border-radius:8px;padding:12px 32px;"><span style="font-size:22px;font-weight:bold;color:#059669;letter-spacing:2px;font-family:monospace;">${discountCode}</span></td></tr></table></td></tr></table>`
        : '',
    };

    // If dry run, return preview without sending
    if (dry_run) {
      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          event: `${showName} at ${venueName}`,
          date: showDate,
          lineup_acts: lineup.length,
          google_review_url: googleReviewUrl,
          tokens,
          lineup_html: lineupHTML,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Fetch attendees
    const { data: attendeesData, error: attendeesError } = await supabase
      .from('attendees')
      .select('email')
      .eq('event_id', event_id)
      .not('email', 'is', null);

    if (attendeesError) {
      console.error('Attendees fetch error:', attendeesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch attendees' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduplicate by email (one person may have multiple tickets)
    const uniqueEmails = [...new Set(
      (attendeesData || []).map((a: { email: string }) => a.email.toLowerCase())
    )];

    const emailsToProcess = test_email ? [test_email.toLowerCase()] : uniqueEmails;

    if (emailsToProcess.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          event: `${showName} at ${venueName}`,
          lineup_acts: lineup.length,
          attendees_found: 0,
          emails_sent: 0,
          message: 'No attendees found for this event',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Match attendee emails to Mautic contact IDs
    //    Path: customer_emails.email → customer_emails.customer_id → mautic_sync_status.customer_id
    const { data: emailMatches, error: emailMatchError } = await supabase
      .from('customer_emails')
      .select('email, customer_id')
      .in('email', emailsToProcess);

    if (emailMatchError) {
      console.error('Customer email lookup error:', emailMatchError);
    }

    // Get unique customer IDs
    const customerIdMap = new Map<string, string>(); // customer_id → email
    for (const match of (emailMatches || [])) {
      const m = match as { email: string; customer_id: string };
      if (!customerIdMap.has(m.customer_id)) {
        customerIdMap.set(m.customer_id, m.email.toLowerCase());
      }
    }

    const customerIds = [...customerIdMap.keys()];
    const mauticContactMap = new Map<string, number>(); // email → mautic_contact_id

    if (customerIds.length > 0) {
      const { data: syncData, error: syncError } = await supabase
        .from('mautic_sync_status')
        .select('customer_id, mautic_contact_id')
        .in('customer_id', customerIds)
        .not('mautic_contact_id', 'is', null);

      if (syncError) {
        console.error('Mautic sync lookup error:', syncError);
      }

      for (const row of (syncData || [])) {
        const r = row as { customer_id: string; mautic_contact_id: number };
        const email = customerIdMap.get(r.customer_id);
        if (email) {
          mauticContactMap.set(email, r.mautic_contact_id);
        }
      }
    }

    console.log(`Matched ${mauticContactMap.size} Mautic contacts out of ${emailsToProcess.length} attendee emails`);

    const contactsToSend = [...mauticContactMap.entries()].map(([email, contactId]) => ({
      email,
      mautic_contact_id: contactId,
    }));

    if (contactsToSend.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          event: `${showName} at ${venueName}`,
          lineup_acts: lineup.length,
          attendees_found: emailsToProcess.length,
          mautic_contacts_matched: 0,
          emails_sent: 0,
          message: 'No attendees matched to Mautic contacts',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Send emails via Mautic (with concurrency)
    let emailsSent = 0;
    let emailsFailed = 0;
    const errors: Array<{ email: string; error: string }> = [];

    async function sendToContact(contact: { email: string; mautic_contact_id: number }) {
      try {
        const response = await mauticFetch(
          `/emails/${mautic_email_id}/contact/${contact.mautic_contact_id}/send`,
          {
            method: 'POST',
            body: JSON.stringify({ tokens }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Mautic send failed (${response.status}): ${errorText}`);
        }

        emailsSent++;
        console.log(`Sent to ${contact.email} (contact ${contact.mautic_contact_id})`);
      } catch (error) {
        emailsFailed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({ email: contact.email, error: errorMsg });
        console.error(`Failed to send to ${contact.email}:`, errorMsg);
      }
    }

    // Process in batches for concurrency
    for (let i = 0; i < contactsToSend.length; i += SEND_CONCURRENCY) {
      const batch = contactsToSend.slice(i, i + SEND_CONCURRENCY);
      await Promise.all(batch.map(sendToContact));
    }

    return new Response(
      JSON.stringify({
        success: true,
        event: `${showName} at ${venueName}`,
        date: showDate,
        lineup_acts: lineup.length,
        attendees_found: emailsToProcess.length,
        mautic_contacts_matched: contactsToSend.length,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        ...(errors.length > 0 && { errors }),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Post-show email error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
