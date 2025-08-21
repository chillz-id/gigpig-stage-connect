import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get request body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      logStep("Webhook signature verification failed", { error: error.message });
      return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    logStep("Webhook event verified", { type: event.type, id: event.id });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event, supabaseClient);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event, supabaseClient);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event, supabaseClient);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event, supabaseClient);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event, supabaseClient);
        break;
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleCheckoutSessionCompleted(event: Stripe.Event, supabaseClient: any) {
  const session = event.data.object as Stripe.Checkout.Session;
  const invoiceId = session.metadata?.invoiceId;
  
  if (!invoiceId) {
    logStep("No invoiceId in session metadata");
    return;
  }

  logStep("Processing checkout session completed", { 
    sessionId: session.id, 
    invoiceId,
    amount: session.amount_total 
  });

  try {
    // Create payment record
    const { error: paymentError } = await supabaseClient
      .from('invoice_payments')
      .insert({
        id: crypto.randomUUID(),
        invoice_id: invoiceId,
        payment_date: new Date().toISOString().split('T')[0],
        amount: (session.amount_total || 0) / 100, // Convert from cents
        payment_method: 'stripe',
        reference_number: session.payment_intent as string || session.id,
        notes: `Stripe payment via checkout session - ${session.id}`,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (paymentError) throw paymentError;

    // Get invoice and check total payments
    const { data: invoice } = await supabaseClient
      .from('invoices')
      .select('total_amount')
      .eq('id', invoiceId)
      .single();

    const { data: payments } = await supabaseClient
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoiceId)
      .eq('status', 'completed');

    if (invoice && payments) {
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const isPaid = totalPaid >= parseFloat(invoice.total_amount);
      
      // Update invoice status
      const { error: invoiceError } = await supabaseClient
        .from('invoices')
        .update({
          status: isPaid ? 'paid' : 'partially_paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (invoiceError) throw invoiceError;
    }

    if (invoiceError) throw invoiceError;

    // Update payment link status
    const { error: linkError } = await supabaseClient
      .from('invoice_payment_links')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        stripe_session_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('invoice_id', invoiceId)
      .eq('status', 'active');

    if (linkError) throw linkError;

    // Send notification
    await sendPaymentNotification(supabaseClient, invoiceId, 'payment_success');

    logStep("Checkout session processed successfully", { invoiceId });
  } catch (error) {
    logStep("Error processing checkout session", { error: error.message, invoiceId });
    throw error;
  }
}

async function handlePaymentIntentSucceeded(event: Stripe.Event, supabaseClient: any) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const invoiceId = paymentIntent.metadata?.invoiceId;
  
  if (!invoiceId) {
    logStep("No invoiceId in payment intent metadata");
    return;
  }

  logStep("Processing payment intent succeeded", { 
    paymentIntentId: paymentIntent.id, 
    invoiceId,
    amount: paymentIntent.amount 
  });

  try {
    // Check if payment already recorded
    const { data: existingPayment } = await supabaseClient
      .from('invoice_payments')
      .select('id')
      .eq('reference_number', paymentIntent.id)
      .single();

    if (existingPayment) {
      logStep("Payment already recorded, skipping");
      return;
    }

    // Create payment record
    const { error: paymentError } = await supabaseClient
      .from('invoice_payments')
      .insert({
        id: crypto.randomUUID(),
        invoice_id: invoiceId,
        payment_date: new Date().toISOString().split('T')[0],
        amount: paymentIntent.amount / 100, // Convert from cents
        payment_method: 'stripe',
        reference_number: paymentIntent.id,
        notes: `Stripe payment - ${paymentIntent.id}`,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (paymentError) throw paymentError;

    logStep("Payment intent processed successfully", { invoiceId });
  } catch (error) {
    logStep("Error processing payment intent", { error: error.message, invoiceId });
    throw error;
  }
}

async function handlePaymentIntentFailed(event: Stripe.Event, supabaseClient: any) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const invoiceId = paymentIntent.metadata?.invoiceId;
  
  if (!invoiceId) {
    logStep("No invoiceId in failed payment intent metadata");
    return;
  }

  logStep("Processing payment intent failed", { 
    paymentIntentId: paymentIntent.id, 
    invoiceId,
    error: paymentIntent.last_payment_error 
  });

  try {
    // Update payment link status if exists
    const { error: linkError } = await supabaseClient
      .from('invoice_payment_links')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('invoice_id', invoiceId)
      .eq('stripe_session_id', paymentIntent.id);

    if (linkError) {
      logStep("Error updating payment link", { error: linkError });
    }

    // Send failure notification
    await sendPaymentNotification(supabaseClient, invoiceId, 'payment_failed');

    logStep("Payment intent failure processed", { invoiceId });
  } catch (error) {
    logStep("Error processing payment intent failure", { error: error.message, invoiceId });
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event, supabaseClient: any) {
  const invoice = event.data.object as Stripe.Invoice;
  const invoiceId = invoice.metadata?.invoiceId;
  
  if (!invoiceId) {
    logStep("No invoiceId in invoice metadata");
    return;
  }

  logStep("Processing invoice payment succeeded", { 
    stripeInvoiceId: invoice.id, 
    invoiceId,
    amount: invoice.amount_paid 
  });

  // Similar to checkout session completed
  await handleCheckoutSessionCompleted(event, supabaseClient);
}

async function handleInvoicePaymentFailed(event: Stripe.Event, supabaseClient: any) {
  const invoice = event.data.object as Stripe.Invoice;
  const invoiceId = invoice.metadata?.invoiceId;
  
  if (!invoiceId) {
    logStep("No invoiceId in failed invoice metadata");
    return;
  }

  logStep("Processing invoice payment failed", { 
    stripeInvoiceId: invoice.id, 
    invoiceId 
  });

  // Similar to payment intent failed
  await handlePaymentIntentFailed(event, supabaseClient);
}

async function sendPaymentNotification(supabaseClient: any, invoiceId: string, type: 'payment_success' | 'payment_failed') {
  try {
    // Get invoice details
    const { data: invoice, error } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) throw error;

    // Create notification record
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: invoice.promoter_id || invoice.comedian_id,
        title: type === 'payment_success' 
          ? `Payment Received - Invoice ${invoice.invoice_number}`
          : `Payment Failed - Invoice ${invoice.invoice_number}`,
        message: type === 'payment_success'
          ? `Payment of ${invoice.currency} ${invoice.total_amount} has been received for invoice ${invoice.invoice_number}.`
          : `Payment attempt failed for invoice ${invoice.invoice_number}. Please check your payment method.`,
        type: type === 'payment_success' ? 'payment_success' : 'payment_failed',
        read: false,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          amount: invoice.total_amount,
          currency: invoice.currency
        }
      });

    if (notificationError) throw notificationError;
    logStep("Notification sent", { invoiceId, type });
  } catch (error) {
    logStep("Failed to send notification", { error: error.message, invoiceId, type });
    // Don't throw - notification failure shouldn't break webhook processing
  }
}