import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    )

    // Get user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { action, code, state } = await req.json()

    if (action === 'exchange') {
      // Exchange authorization code for tokens
      const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${Deno.env.get('PUBLIC_URL')}/auth/xero-callback`,
          client_id: Deno.env.get('XERO_CLIENT_ID')!,
          client_secret: Deno.env.get('XERO_CLIENT_SECRET')!,
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error('Token exchange failed')
      }

      const tokens = await tokenResponse.json()

      // Get tenant info
      const connectionsResponse = await fetch('https://api.xero.com/connections', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      })

      const connections = await connectionsResponse.json()
      const tenant = connections[0]

      // Store in database
      const { error: dbError } = await supabaseClient
        .from('xero_integrations')
        .upsert({
          user_id: user.id,
          tenant_id: tenant.tenantId,
          tenant_name: tenant.tenantName,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          scopes: tokens.scope?.split(' ') || [],
          is_active: true,
        })

      if (dbError) throw dbError

      return new Response(
        JSON.stringify({ success: true, tenant: tenant.tenantName }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error('Invalid action')
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})