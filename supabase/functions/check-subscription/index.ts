
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      
      // Update both subscriptions and profiles tables
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: null,
        status: 'inactive',
        has_comedian_pro: false,
        has_promoter_pro: false,
        plan_type: 'free',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      await supabaseClient.from("profiles").update({
        has_comedian_pro_badge: false,
        has_promoter_pro_badge: false,
        membership: 'free',
      }).eq('id', user.id);

      return new Response(JSON.stringify({ 
        subscribed: false, 
        has_comedian_pro: false,
        has_promoter_pro: false,
        status: 'inactive'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    let hasComedianPro = false;
    let hasPromoterPro = false;
    let subscriptionStatus = 'inactive';
    let currentPeriodEnd: string | null = null;

    // Check all active/trialing subscriptions for plan types
    for (const subscription of subscriptions.data) {
      if (['active', 'trialing'].includes(subscription.status)) {
        subscriptionStatus = subscription.status;
        currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        for (const item of subscription.items.data) {
          const price = await stripe.prices.retrieve(item.price.id);
          const productName = price.nickname || '';
          
          // Determine plan type based on product name or metadata
          if (productName.toLowerCase().includes('comedian') || 
              subscription.metadata?.plan_type?.includes('comedian')) {
            hasComedianPro = true;
          }
          if (productName.toLowerCase().includes('promoter') || 
              subscription.metadata?.plan_type?.includes('promoter')) {
            hasPromoterPro = true;
          }
          if (subscription.metadata?.plan_type === 'dual_pro') {
            hasComedianPro = true;
            hasPromoterPro = true;
          }
        }
      }
    }

    const subscribed = hasComedianPro || hasPromoterPro;
    logStep("Subscription analysis complete", { 
      subscribed, 
      hasComedianPro, 
      hasPromoterPro, 
      subscriptionStatus 
    });

    // Update database with current subscription state
    await supabaseClient.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      status: subscriptionStatus,
      has_comedian_pro: hasComedianPro,
      has_promoter_pro: hasPromoterPro,
      plan_type: subscribed ? (hasComedianPro && hasPromoterPro ? 'dual_pro' : 
                              hasComedianPro ? 'comedian_pro' : 'promoter_pro') : 'free',
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Update profile badges
    await supabaseClient.from("profiles").update({
      has_comedian_pro_badge: hasComedianPro,
      has_promoter_pro_badge: hasPromoterPro,
      membership: subscribed ? 'pro' : 'free',
    }).eq('id', user.id);

    logStep("Updated database with subscription info", { 
      subscribed, 
      hasComedianPro, 
      hasPromoterPro 
    });

    return new Response(JSON.stringify({
      subscribed,
      has_comedian_pro: hasComedianPro,
      has_promoter_pro: hasPromoterPro,
      status: subscriptionStatus,
      current_period_end: currentPeriodEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
