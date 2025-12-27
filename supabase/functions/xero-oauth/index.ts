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

    const body = await req.json()
    const { action } = body

    if (action === 'exchange') {
      const { code, organization_id, redirect_uri } = body

      // Use redirect_uri from request (must match what was used in auth URL), fallback to PUBLIC_URL
      const redirectUri = redirect_uri || `${Deno.env.get('PUBLIC_URL') || 'https://gigpigs.app'}/auth/xero-callback`

      // Exchange authorization code for tokens
      const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: Deno.env.get('XERO_CLIENT_ID')!,
          client_secret: Deno.env.get('XERO_CLIENT_SECRET')!,
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('Token exchange failed:', errorText)
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

      if (!connections || connections.length === 0) {
        throw new Error('No Xero organizations found')
      }

      const tenant = connections[0]

      // Store in database - either for user or organization
      const integrationData: Record<string, any> = {
        tenant_id: tenant.tenantId,
        tenant_name: tenant.tenantName,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        connection_status: 'active',
      }

      if (organization_id) {
        // Organization-level connection
        integrationData.organization_id = organization_id
      } else {
        // User-level connection
        integrationData.user_id = user.id
      }

      const { error: dbError } = await supabaseClient
        .from('xero_integrations')
        .upsert(integrationData, {
          onConflict: organization_id ? 'organization_id' : 'user_id',
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

    if (action === 'refresh') {
      // Refresh access token
      const { data: integration, error: fetchError } = await supabaseClient
        .from('xero_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('connection_status', 'active')
        .single()

      if (fetchError || !integration) {
        throw new Error('No active Xero integration found')
      }

      const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: integration.refresh_token,
          client_id: Deno.env.get('XERO_CLIENT_ID')!,
          client_secret: Deno.env.get('XERO_CLIENT_SECRET')!,
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('Token refresh failed:', errorText)

        // Mark integration as disconnected if refresh fails
        await supabaseClient
          .from('xero_integrations')
          .update({ connection_status: 'disconnected' })
          .eq('id', integration.id)

        throw new Error('Token refresh failed - please reconnect to Xero')
      }

      const tokens = await tokenResponse.json()

      // Update stored tokens
      const { error: updateError } = await supabaseClient
        .from('xero_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', integration.id)

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({
          success: true,
          access_token: tokens.access_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        }),
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