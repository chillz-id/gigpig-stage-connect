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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get webhook signature
    const signature = req.headers.get('x-xero-signature')
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const body = await req.text()
    
    // Verify webhook signature
    const webhookKey = Deno.env.get('XERO_WEBHOOK_KEY')
    if (webhookKey) {
      const hmac = createHmac('sha256', webhookKey)
      hmac.update(body)
      const expectedSignature = hmac.digest('base64')
      
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Parse webhook payload
    const payload = JSON.parse(body)
    console.log('Xero webhook received:', payload)

    // Store webhook event
    const { error: eventError } = await supabase
      .from('xero_webhook_events')
      .insert({
        event_type: payload.eventType,
        resource_type: payload.resourceType,
        resource_id: payload.resourceId,
        event_data: payload,
        processed: false
      })

    if (eventError) {
      throw eventError
    }

    // Process events based on type
    for (const event of payload.events || []) {
      switch (event.eventType) {
        case 'CREATE':
          if (event.resourceType === 'INVOICE') {
            await handleInvoiceCreated(supabase, event.resourceId)
          } else if (event.resourceType === 'CONTACT') {
            await handleContactCreated(supabase, event.resourceId)
          }
          break
          
        case 'UPDATE':
          if (event.resourceType === 'INVOICE') {
            await handleInvoiceUpdated(supabase, event.resourceId)
          } else if (event.resourceType === 'CONTACT') {
            await handleContactUpdated(supabase, event.resourceId)
          }
          break
          
        case 'DELETE':
          if (event.resourceType === 'INVOICE') {
            await handleInvoiceDeleted(supabase, event.resourceId)
          }
          break
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Handler functions
async function handleInvoiceCreated(supabase: any, xeroInvoiceId: string) {
  console.log('Handling invoice created:', xeroInvoiceId)
  
  // Check if we already have this invoice
  const { data: existing } = await supabase
    .from('xero_invoices')
    .select('invoice_id')
    .eq('xero_invoice_id', xeroInvoiceId)
    .single()
  
  if (!existing) {
    // Mark for sync - will be handled by sync service
    await supabase
      .from('xero_invoices')
      .insert({
        xero_invoice_id: xeroInvoiceId,
        sync_status: 'pending',
        sync_direction: 'from_xero'
      })
  }
}

async function handleInvoiceUpdated(supabase: any, xeroInvoiceId: string) {
  console.log('Handling invoice updated:', xeroInvoiceId)
  
  // Find our invoice
  const { data: xeroInvoice } = await supabase
    .from('xero_invoices')
    .select('invoice_id')
    .eq('xero_invoice_id', xeroInvoiceId)
    .single()
  
  if (xeroInvoice) {
    // Mark for sync
    await supabase
      .from('xero_invoices')
      .update({
        sync_status: 'pending',
        sync_direction: 'from_xero',
        last_sync_at: new Date().toISOString()
      })
      .eq('xero_invoice_id', xeroInvoiceId)
    
    // Update our invoice status if needed
    // This would be handled by a separate sync process
  }
}

async function handleInvoiceDeleted(supabase: any, xeroInvoiceId: string) {
  console.log('Handling invoice deleted:', xeroInvoiceId)
  
  // Find and update our invoice
  const { data: xeroInvoice } = await supabase
    .from('xero_invoices')
    .select('invoice_id')
    .eq('xero_invoice_id', xeroInvoiceId)
    .single()
  
  if (xeroInvoice) {
    // Mark invoice as cancelled
    await supabase
      .from('invoices')
      .update({ status: 'cancelled' })
      .eq('id', xeroInvoice.invoice_id)
    
    // Update sync record
    await supabase
      .from('xero_invoices')
      .update({
        sync_status: 'deleted',
        invoice_status: 'VOIDED'
      })
      .eq('xero_invoice_id', xeroInvoiceId)
  }
}

async function handleContactCreated(supabase: any, xeroContactId: string) {
  console.log('Handling contact created:', xeroContactId)
  // Contact sync would be implemented here
}

async function handleContactUpdated(supabase: any, xeroContactId: string) {
  console.log('Handling contact updated:', xeroContactId)
  // Contact sync would be implemented here
}