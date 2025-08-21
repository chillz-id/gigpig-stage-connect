import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-LINK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { 
      invoiceId, 
      amount, 
      currency, 
      description, 
      metadata, 
      successUrl, 
      cancelUrl 
    } = await req.json();
    
    logStep("Request data received", { invoiceId, amount, currency, description });

    // Validate required fields
    if (!invoiceId || !amount || !currency) {
      throw new Error("Missing required fields: invoiceId, amount, currency");
    }

    // Verify invoice exists and user has access
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .or(`promoter_id.eq.${user.id},comedian_id.eq.${user.id}`)
      .single();

    if (invoiceError) throw new Error(`Invoice not found or access denied: ${invoiceError.message}`);
    logStep("Invoice verified", { invoiceId, invoiceNumber: invoice.invoice_number });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
          invoiceId: invoiceId
        }
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description,
              description: `Invoice ${invoice.invoice_number} - ${description}`
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceId: invoiceId,
        userId: user.id,
        invoiceNumber: invoice.invoice_number,
        ...metadata
      },
      after_completion: {
        type: "redirect",
        redirect: {
          url: successUrl || `${req.headers.get("origin")}/invoices/${invoiceId}/payment-success`
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: ["AU", "NZ", "US", "CA", "GB"] // Adjust as needed
      }
    });

    logStep("Payment link created", { 
      paymentLinkId: paymentLink.id, 
      url: paymentLink.url 
    });

    // Store payment link in database
    const { error: dbError } = await supabaseClient
      .from('invoice_payment_links')
      .upsert({
        id: crypto.randomUUID(),
        invoice_id: invoiceId,
        payment_link_id: paymentLink.id,
        url: paymentLink.url,
        status: 'active',
        amount: amount / 100, // Convert from cents to dollars
        currency: currency.toUpperCase(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (dbError) throw new Error(`Database error: ${dbError.message}`);
    logStep("Payment link stored in database");

    return new Response(JSON.stringify({
      paymentLinkId: paymentLink.id,
      url: paymentLink.url,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment-link", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});