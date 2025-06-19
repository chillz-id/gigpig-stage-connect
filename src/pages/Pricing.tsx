import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Star, Zap, Crown, Loader2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Pricing = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  const handleSubscribe = async (planType: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to subscribe to a plan.",
        variant: "destructive"
      });
      return;
    }

    setLoading(planType);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planType: isAnnual ? `${planType}_annual` : planType
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const hasComedianPro = profile?.has_comedian_pro_badge || false;
  const hasPromoterPro = profile?.has_promoter_pro_badge || false;

  const getPrice = (monthlyPrice: number) => {
    if (isAnnual) {
      const annualPrice = monthlyPrice * 12 * 0.75; // 25% discount
      return {
        price: Math.round(annualPrice / 12),
        originalPrice: monthlyPrice,
        period: 'month',
        billing: 'Billed annually'
      };
    }
    return {
      price: monthlyPrice,
      originalPrice: null,
      period: 'month',
      billing: 'Billed monthly'
    };
  };

  const comedianPrice = getPrice(20);
  const promoterPrice = getPrice(25);
  const dualPrice = getPrice(40);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      icon: Star,
      features: [
        'Apply to open mic nights',
        'Basic profile',
        'View public shows',
        'Email notifications',
        'Community access'
      ],
      limitations: [
        'No paid gig applications',
        'Limited to 5 applications/month',
        'No verified badge',
        'No marketplace access'
      ],
      buttonText: 'Current Plan',
      isCurrentPlan: !hasComedianPro && !hasPromoterPro,
      popular: false,
      planType: 'free'
    },
    {
      name: 'Comedian Pro',
      price: `$${comedianPrice.price}`,
      originalPrice: comedianPrice.originalPrice ? `$${comedianPrice.originalPrice}` : null,
      currency: 'AUD',
      period: comedianPrice.period,
      billing: comedianPrice.billing,
      description: 'For serious comedians',
      icon: Zap,
      features: [
        'Everything in Free',
        'Apply to all paid gigs',
        'Verified comedian badge',
        'Unlimited applications',
        'Priority support',
        'Advanced analytics',
        'Professional profile',
        'Promoter Marketplace access',
        'Team group management',
        'Invoice management',
        '14-day free trial'
      ],
      buttonText: hasComedianPro ? 'Current Plan' : 'Start Free Trial',
      isCurrentPlan: hasComedianPro,
      popular: true,
      planType: 'comedian_pro'
    },
    {
      name: 'Promoter Pro',
      price: `$${promoterPrice.price}`,
      originalPrice: promoterPrice.originalPrice ? `$${promoterPrice.originalPrice}` : null,
      currency: 'AUD',
      period: promoterPrice.period,
      billing: promoterPrice.billing,
      description: 'For promoters and venues',
      icon: Crown,
      features: [
        'Create unlimited events',
        'Advanced booking management',
        'Revenue analytics',
        'Comedian group management',
        'Custom branding',
        'API access',
        'Priority listing',
        'Comedian Marketplace access',
        'Invoice management',
        '14-day free trial'
      ],
      buttonText: hasPromoterPro ? 'Current Plan' : 'Start Free Trial',
      isCurrentPlan: hasPromoterPro,
      popular: false,
      planType: 'promoter_pro'
    },
    {
      name: 'Get Both Plans & Save',
      price: `$${dualPrice.price}`,
      originalPrice: dualPrice.originalPrice ? `$${dualPrice.originalPrice}` : null,
      currency: 'AUD',
      period: dualPrice.period,
      billing: dualPrice.billing,
      description: 'Best value for professionals',
      icon: Users,
      features: [
        'Everything in Comedian Pro',
        'Everything in Promoter Pro',
        'Access to both marketplaces',
        'Full platform features',
        'Maximum networking potential',
        'Save $5/month',
        '14-day free trial'
      ],
      buttonText: hasComedianPro && hasPromoterPro ? 'Current Plan' : 'Get Both Plans',
      isCurrentPlan: hasComedianPro && hasPromoterPro,
      popular: false,
      planType: 'dual_pro',
      savings: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're just starting out or running multiple venues, we have the perfect plan for your comedy career.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            All paid plans include a 14-day free trial • Prices in AUD • Mix and match Pro plans
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center space-x-4 mb-8">
          <span className={`text-foreground ${!isAnnual ? 'font-semibold' : ''}`}>Monthly</span>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} className="data-[state=checked]:bg-primary" />
          <span className={`text-foreground ${isAnnual ? 'font-semibold' : ''}`}>
            Annual
            <Badge className="ml-2 bg-green-500">Save 25%</Badge>
          </span>
        </div>

        {/* Current Plan Status */}
        {(hasComedianPro || hasPromoterPro) && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-center text-foreground">Your Current Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-4 flex-wrap">
                  {hasComedianPro && (
                    <Badge className="bg-primary text-primary-foreground px-4 py-2">
                      <Zap className="w-4 h-4 mr-2" />
                      Comedian Pro
                    </Badge>
                  )}
                  {hasPromoterPro && (
                    <Badge className="bg-primary text-primary-foreground px-4 py-2">
                      <Crown className="w-4 h-4 mr-2" />
                      Promoter Pro
                    </Badge>
                  )}
                </div>
                <p className="text-center text-muted-foreground mt-4">
                  Total: ${(hasComedianPro ? comedianPrice.price : 0) + (hasPromoterPro ? promoterPrice.price : 0)} AUD/month
                  {isAnnual && <span className="block text-sm">{comedianPrice.billing}</span>}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative bg-card border-border text-foreground ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                } ${plan.savings ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                {plan.savings && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white">
                    Best Value
                  </Badge>
                )}

                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="flex items-center justify-center gap-2">
                      {plan.originalPrice && (
                        <span className="text-2xl text-muted-foreground line-through">{plan.originalPrice}</span>
                      )}
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    </div>
                    {plan.currency && <span className="text-sm text-muted-foreground"> {plan.currency}</span>}
                    {plan.period && <span className="text-muted-foreground">/{plan.period}</span>}
                    {plan.billing && <div className="text-sm text-muted-foreground mt-1">{plan.billing}</div>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.limitations && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground mb-2">Limitations:</p>
                      {plan.limitations.map((limitation, index) => (
                        <p key={index} className="text-xs text-muted-foreground">• {limitation}</p>
                      ))}
                    </div>
                  )}

                  <Button
                    className={`w-full ${
                      plan.isCurrentPlan
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : plan.popular || plan.savings
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                    disabled={plan.isCurrentPlan || loading === plan.planType}
                    onClick={() => plan.planType !== 'free' && handleSubscribe(plan.planType)}
                  >
                    {loading === plan.planType ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Can I have both Comedian Pro and Promoter Pro?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Yes! You can subscribe to both plans for $40 AUD/month total (saving $5/month), or add one to the other as an add-on.</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">What's the difference between monthly and annual billing?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Annual subscriptions save you 25% compared to monthly billing. You'll be billed once per year at the discounted rate.</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">What are the Marketplaces?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-muted-foreground">
                  <div>
                    <h4 className="font-semibold text-foreground">Comedian Marketplace (Promoter Pro)</h4>
                    <p>Access to a curated list of comedians who have opted into the marketplace. Promoters can browse comedian profiles and make direct offers for shows and events.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Promoter Marketplace (Comedian Pro)</h4>
                    <p>Access to a directory of promoters and venues. Comedians can browse promoter profiles, request contact information to pitch themselves for shows, and list their own shows for promoter offers.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">What's included in the free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">All paid plans include a 14-day free trial with full access to all features. No credit card required upfront.</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Yes! You can upgrade, downgrade, or add/remove plan features at any time. Changes take effect immediately and billing is prorated.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
