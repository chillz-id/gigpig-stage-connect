import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Lazy initialization to catch errors properly
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !key) {
      throw new Error(`Missing env vars: SUPABASE_URL=${!!url}, SUPABASE_SERVICE_ROLE_KEY=${!!key}`);
    }

    supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabase;
}

function getSessionSecret(): string {
  const secret = Deno.env.get("FILESTASH_SESSION_SECRET");
  if (!secret) {
    throw new Error("FILESTASH_SESSION_SECRET not configured");
  }
  return secret;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const userToken = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
    if (!userToken) {
      return new Response(JSON.stringify({ error: "Missing bearer token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = getSupabaseClient();
    const { data: userData, error: userError } = await client.auth.getUser(userToken);
    if (userError || !userData?.user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Invalid user token", details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    console.log("Processing request for user:", userId);

    // Resolve scopes based on userId-based storage structure
    // Note: Files are stored by userId (not slug) because slug-based paths have
    // Supabase Storage issues. UUIDs are less readable but files work correctly.
    const scopes: string[] = [];

    // User's own folders (userId-based for reliable storage access)
    // Profile images: profile-images/{userId}/
    scopes.push(`profile-images/${userId}`);
    // Comedian media: comedian-media/{userId}/
    scopes.push(`comedian-media/${userId}`);
    // Event banners uploaded by user: event-media/banners/{userId}/
    scopes.push(`event-media/banners/${userId}`);

    // Organization folders (by org ID for reliable storage access)
    const { data: orgs, error: orgsError } = await client
      .from("organization_profiles")
      .select("id")
      .eq("owner_id", userId);

    if (orgsError) {
      console.error("Orgs query error:", orgsError);
    }

    for (const o of orgs || []) {
      const orgId = (o as { id?: string }).id;
      if (orgId) {
        // Organization media: organization-media/organization-logos/{orgId}/
        scopes.push(`organization-media/organization-logos/${orgId}`);
        // Event banners for org: event-media/banners/{orgId}/
        scopes.push(`event-media/banners/${orgId}`);
      }
    }

    const payload = {
      sub: userId,
      scopes,
      exp: getNumericDate(15 * 60),
    };

    console.log("Creating JWT with scopes:", scopes.length);
    const sessionSecret = getSessionSecret();
    const keyData = new TextEncoder().encode(sessionSecret);

    // djwt requires a CryptoKey, not a Uint8Array
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);
    console.log("JWT created successfully");

    return new Response(JSON.stringify({ token, scopes, expires_in: 900 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("filestash-token error:", err);
    return new Response(JSON.stringify({ error: String(err), stack: (err as Error).stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
