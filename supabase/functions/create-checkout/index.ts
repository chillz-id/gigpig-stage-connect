
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planType, discountCode } = await req.json();
    logStep("Request data received", { planType, discountCode });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Define pricing for new plan structure
    const isAnnual = planType.includes('_annual');
    const basePlanType = planType.replace('_annual', '');
    
    const monthlyPrices = {
      comedian_pro: { amount: 2000, name: "Comedian Pro" }, // $20 AUD
      promoter_pro: { amount: 2500, name: "Promoter Pro" }, // $25 AUD
      dual_pro: { amount: 4000, name: "Comedian Pro + Promoter Pro" } // $40 AUD (saving $5)
    };

    const selectedPrice = monthlyPrices[basePlanType as keyof typeof monthlyPrices];
    if (!selectedPrice) throw new Error("Invalid plan type");

    // Calculate annual pricing (25% discount)
    const finalAmount = isAnnual ? Math.round(selectedPrice.amount * 12 * 0.75) : selectedPrice.amount;
    const interval = isAnnual ? "year" : "month";
    const planName = isAnnual ? `${selectedPrice.name} (Annual - 25% Off)` : selectedPrice.name;

    // Handle discount codes if provided
    let couponId;
    if (discountCode) {
      try {
        const coupon = await stripe.coupons.retrieve(discountCode);
        couponId = coupon.id;
        logStep("Discount code validated", { discountCode, couponId });
      } catch (error) {
        logStep("Invalid discount code", { discountCode, error: error.message });
        // Continue without discount rather than failing
      }
    }

    const sessionData: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: { 
              name: `${planName} Subscription`,
              description: `${interval.charAt(0).toUpperCase() + interval.slice(1)}ly subscription for ${selectedPrice.name} access`
            },
            unit_amount: finalAmount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
      },
      success_url: `${req.headers.get("origin")}/dashboard?success=true&plan=${planType}`,
      cancel_url: `${req.headers.get("origin")}/pricing?cancelled=true`,
      metadata: {
        user_id: user.id,
        plan_type: basePlanType,
        billing_interval: interval,
      },
    };

    // Add discount if valid
    if (couponId) {
      sessionData.discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
