import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-xero-signature',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    const webhookKey = Deno.env.get('XERO_WEBHOOK_KEY')

    // Get request body as text for signature verification
    const body = await req.text()

    // Get webhook signature from Xero
    const signature = req.headers.get('x-xero-signature')

    console.log('Webhook received, verifying signature...')
    console.log('Body length:', body.length)
    console.log('Webhook key exists:', !!webhookKey)

    if (!webhookKey) {
      console.error('XERO_WEBHOOK_KEY not configured')
      return new Response('', { status: 401 })
    }

    if (!signature) {
      console.error('No x-xero-signature header')
      return new Response('', { status: 401 })
    }

    // Compute expected signature using HMAC-SHA256
    // Try both: key as base64-decoded bytes AND as raw UTF-8 string
    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(body)

    // First try: base64 decode the key (Xero docs say key is base64 encoded)
    let keyBytes: Uint8Array
    try {
      keyBytes = Uint8Array.from(atob(webhookKey), c => c.charCodeAt(0))
    } catch {
      // If base64 decode fails, use as raw string
      keyBytes = encoder.encode(webhookKey)
    }

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes)
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

    console.log('Expected (base64 key):', expectedSignature)
    console.log('Received signature:', signature)

    // If base64-decoded key doesn't match, try raw UTF-8 key
    if (signature !== expectedSignature) {
      console.log('Base64 key failed, trying raw UTF-8 key...')
      const rawKeyBytes = encoder.encode(webhookKey)
      const rawCryptoKey = await crypto.subtle.importKey(
        'raw',
        rawKeyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const rawSignatureBuffer = await crypto.subtle.sign('HMAC', rawCryptoKey, dataBytes)
      const rawExpectedSignature = btoa(String.fromCharCode(...new Uint8Array(rawSignatureBuffer)))

      console.log('Expected (raw key):', rawExpectedSignature)

      if (signature !== rawExpectedSignature) {
        console.log('Both signature methods failed - returning 401')
        return new Response('', { status: 401 })
      }
      console.log('Raw key signature matched!')
    } else {
      console.log('Base64 key signature matched!')
    }

    console.log('Signature valid!')

    // Parse webhook payload
    const payload = JSON.parse(body)
    console.log('Xero webhook received:', JSON.stringify(payload, null, 2))

    // Handle Intent to Receive validation
    // Xero sends this when you first set up the webhook
    // We must respond with 200 and empty body if signature is valid
    if (!payload.events || payload.events.length === 0) {
      console.log('Intent to Receive validation - responding with 200')
      return new Response('', { status: 200 })
    }

    // Process each event
    for (const event of payload.events) {
      console.log(`Processing event: ${event.eventType} ${event.resourceType} ${event.resourceId}`)

      const tenantId = event.tenantId
      if (!tenantId) {
        console.error('No tenantId in event')
        continue
      }

      // Find the integration for this tenant
      const { data: integration, error: integrationError } = await supabase
        .from('xero_integrations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('connection_status', 'active')
        .single()

      if (integrationError || !integration) {
        console.error('No active integration found for tenant:', tenantId)
        continue
      }

      // Get valid access token (refresh if needed)
      const accessToken = await getValidAccessToken(supabase, integration)
      if (!accessToken) {
        console.error('Failed to get valid access token for tenant:', tenantId)
        continue
      }

      // Handle different event types
      if (event.resourceType === 'INVOICE') {
        await handleInvoiceEvent(supabase, event, accessToken, tenantId, integration.organization_id || integration.user_id)
      }
    }

    // Xero expects 200 for successful processing
    return new Response('', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    // Return 500 - Xero will retry
    return new Response('', { status: 500 })
  }
})

// Get valid access token, refreshing if needed
async function getValidAccessToken(supabase: any, integration: any): Promise<string | null> {
  const expiresAt = new Date(integration.token_expires_at).getTime()

  // If token is still valid (with 1 min buffer), return it
  if (Date.now() < expiresAt - 60000) {
    return integration.access_token
  }

  console.log('Access token expired, refreshing...')

  // Refresh the token
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
    console.error('Token refresh failed:', await tokenResponse.text())

    // Mark integration as disconnected
    await supabase
      .from('xero_integrations')
      .update({ connection_status: 'disconnected' })
      .eq('id', integration.id)

    return null
  }

  const tokens = await tokenResponse.json()

  // Update stored tokens
  await supabase
    .from('xero_integrations')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('id', integration.id)

  return tokens.access_token
}

// Handle invoice events
async function handleInvoiceEvent(
  supabase: any,
  event: any,
  accessToken: string,
  tenantId: string,
  ownerId: string
) {
  const xeroInvoiceId = event.resourceId

  if (event.eventType === 'UPDATE' || event.eventType === 'CREATE') {
    // Fetch the invoice from Xero to get current status
    const invoiceResponse = await fetch(`https://api.xero.com/api.xro/2.0/Invoices/${xeroInvoiceId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Xero-tenant-id': tenantId,
        'Accept': 'application/json',
      },
    })

    if (!invoiceResponse.ok) {
      console.error('Failed to fetch invoice from Xero:', await invoiceResponse.text())
      return
    }

    const invoiceData = await invoiceResponse.json()
    const xeroInvoice = invoiceData.Invoices?.[0]

    if (!xeroInvoice) {
      console.error('No invoice data returned from Xero')
      return
    }

    console.log('Xero invoice status:', xeroInvoice.Status, 'AmountPaid:', xeroInvoice.AmountPaid)

    // Find our linked invoice
    const { data: xeroLink } = await supabase
      .from('xero_invoices')
      .select('invoice_id')
      .eq('xero_invoice_id', xeroInvoiceId)
      .single()

    if (xeroLink?.invoice_id) {
      // Map Xero status to our status
      const newStatus = mapXeroStatus(xeroInvoice.Status)

      // Update our invoice
      await supabase
        .from('invoices')
        .update({
          status: newStatus,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', xeroLink.invoice_id)

      // Update the xero_invoices sync record
      await supabase
        .from('xero_invoices')
        .update({
          invoice_status: xeroInvoice.Status,
          total_amount: xeroInvoice.Total,
          amount_paid: xeroInvoice.AmountPaid,
          amount_due: xeroInvoice.AmountDue,
          sync_status: 'synced',
          last_sync_at: new Date().toISOString(),
        })
        .eq('xero_invoice_id', xeroInvoiceId)

      // If payment was made, record it
      if (xeroInvoice.AmountPaid > 0 && xeroInvoice.Payments?.length > 0) {
        for (const payment of xeroInvoice.Payments) {
          // Check if we already recorded this payment
          const { data: existingPayment } = await supabase
            .from('invoice_payments')
            .select('id')
            .eq('reference', `XERO-${payment.PaymentID}`)
            .single()

          if (!existingPayment) {
            await supabase
              .from('invoice_payments')
              .insert({
                invoice_id: xeroLink.invoice_id,
                amount: payment.Amount,
                payment_date: payment.Date,
                payment_method: 'xero',
                reference: `XERO-${payment.PaymentID}`,
                gateway: 'xero',
              })

            console.log('Recorded payment:', payment.PaymentID, payment.Amount)
          }
        }
      }

      console.log('Updated invoice', xeroLink.invoice_id, 'to status:', newStatus)
    } else {
      console.log('No linked invoice found for Xero invoice:', xeroInvoiceId)
      // This invoice was created in Xero, not in GigPigs
      // Could create a placeholder record for tracking
    }
  }
}

function mapXeroStatus(xeroStatus: string): string {
  switch (xeroStatus) {
    case 'DRAFT':
      return 'draft'
    case 'SUBMITTED':
    case 'AUTHORISED':
      return 'sent'
    case 'PAID':
      return 'paid'
    case 'VOIDED':
    case 'DELETED':
      return 'cancelled'
    default:
      return 'draft'
  }
}
