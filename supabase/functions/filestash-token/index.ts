import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SESSION_SECRET = Deno.env.get("FILESTASH_SESSION_SECRET") ?? "change-me";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization") || "";
  const userToken = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
  if (!userToken) {
    return new Response(JSON.stringify({ error: "Missing bearer token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(userToken);
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid user token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = userData.user.id;

  // Get user's profile slug for their personal folder
  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_slug")
    .eq("id", userId)
    .single();

  const userSlug = profile?.profile_slug;

  // Resolve scopes based on slug-based storage structure
  const scopes: string[] = [];

  // User's own folders (slug-based for human readability in Filestash)
  if (userSlug) {
    // Profile images: profile-images/{slug}/
    scopes.push(`profile-images/${userSlug}`);
    // Comedian media: comedian-media/{slug}/
    scopes.push(`comedian-media/${userSlug}`);
    // Event banners uploaded by user: event-media/banners/{slug}/
    scopes.push(`event-media/banners/${userSlug}`);
  }

  // Organization folders (by org slug for readability)
  const { data: orgs } = await supabase
    .from("organization_profiles")
    .select("id, url_slug")
    .eq("owner_id", userId);

  for (const o of orgs || []) {
    const orgSlug = (o as { url_slug?: string }).url_slug;
    if (orgSlug) {
      // Organization media: organization-media/organization-logos/{slug}/
      scopes.push(`organization-media/organization-logos/${orgSlug}`);
      // Event banners for org: event-media/banners/{slug}/
      scopes.push(`event-media/banners/${orgSlug}`);
    }
  }

  const payload = {
    sub: userId,
    scopes,
    exp: getNumericDate(15 * 60),
  };

  const key = new TextEncoder().encode(SESSION_SECRET);
  const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

  return new Response(JSON.stringify({ token, scopes, expires_in: 900 }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
