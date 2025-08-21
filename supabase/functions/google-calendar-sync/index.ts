import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { action, integration_id, event_id, event_data } = await req.json()

    if (action === 'exchange-token') {
      // Handle OAuth token exchange
      const { code, user_id } = event_data
      
      // Exchange code for tokens with Google
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${Deno.env.get('SITE_URL')}/auth/google-calendar-callback`
        })
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange token')
      }

      const tokens = await tokenResponse.json()

      // Store integration in database
      const { data, error } = await supabaseClient
        .from('calendar_integrations')
        .upsert({
          user_id,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          calendar_id: 'primary',
          is_active: true,
          settings: {},
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, integration: data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'sync-event') {
      // Get integration details
      const { data: integration, error: integrationError } = await supabaseClient
        .from('calendar_integrations')
        .select('*')
        .eq('id', integration_id)
        .single()

      if (integrationError || !integration) {
        throw new Error('Integration not found')
      }

      // Get event details
      const { data: calendarEvent, error: eventError } = await supabaseClient
        .from('calendar_events')
        .select('*')
        .eq('id', event_id)
        .single()

      if (eventError || !calendarEvent) {
        throw new Error('Event not found')
      }

      // Create Google Calendar event
      const startDate = new Date(calendarEvent.event_date)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour default

      const googleEvent = {
        summary: calendarEvent.title,
        description: `Comedy performance at ${calendarEvent.venue}`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'Australia/Sydney'
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'Australia/Sydney'
        },
        location: calendarEvent.venue
      }

      const calendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${integration.calendar_id}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(googleEvent)
        }
      )

      if (!calendarResponse.ok) {
        // Try to refresh token if expired
        if (calendarResponse.status === 401 && integration.refresh_token) {
          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
              client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
              refresh_token: integration.refresh_token,
              grant_type: 'refresh_token'
            })
          })

          if (refreshResponse.ok) {
            const newTokens = await refreshResponse.json()
            
            // Update stored token
            await supabaseClient
              .from('calendar_integrations')
              .update({ access_token: newTokens.access_token })
              .eq('id', integration_id)

            // Retry the calendar creation with new token
            const retryResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${integration.calendar_id}/events`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${newTokens.access_token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(googleEvent)
              }
            )

            if (!retryResponse.ok) {
              throw new Error('Failed to create calendar event after token refresh')
            }
          } else {
            throw new Error('Failed to refresh access token')
          }
        } else {
          throw new Error('Failed to create calendar event')
        }
      }

      // Update sync status
      await supabaseClient
        .from('calendar_events')
        .update({ calendar_sync_status: 'synced' })
        .eq('id', event_id)

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})