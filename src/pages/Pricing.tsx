
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, Star, Zap, Crown, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Pricing = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');

  const handleSubscribe = async (planType: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    setLoading(planType);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType, discountCode: discountCode || undefined },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const hasComedianPro = profile?.has_comedian_pro_badge || false;
  const hasPromoterPro = profile?.has_promoter_pro_badge || false;

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
        'Community access',
      ],
      limitations: [
        'No paid gig applications',
        'Limited to 5 applications/month',
        'No verified badge',
        'No marketplace access',
      ],
      buttonText: 'Current Plan',
      isCurrentPlan: !hasComedianPro && !hasPromoterPro,
      popular: false,
      planType: 'free',
    },
    {
      name: 'Comedian Pro',
      price: '$20',
      currency: 'AUD',
      period: 'month',
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
        'Comedian Marketplace access',
        'Invoice management',
        'Add Promoter Pro for +$20/month',
        '14-day free trial',
      ],
      buttonText: hasComedianPro ? 'Current Plan' : 'Start Free Trial',
      isCurrentPlan: hasComedianPro,
      popular: true,
      planType: 'comedian_pro',
    },
    {
      name: 'Promoter Pro',
      price: '$20',
      currency: 'AUD',
      period: 'month',
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
        'Promoter Marketplace access',
        'Invoice management',
        'Add Comedian Pro for +$20/month',
        '14-day free trial',
      ],
      buttonText: hasPromoterPro ? 'Current Plan' : 'Start Free Trial',
      isCurrentPlan: hasPromoterPro,
      popular: false,
      planType: 'promoter_pro',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto">
            Whether you're just starting out or running multiple venues, we have the perfect plan for your comedy career.
          </p>
          <p className="text-sm text-purple-200 mt-2">
            All paid plans include a 14-day free trial • Prices in AUD • Mix and match Pro plans
          </p>
        </div>

        {/* Current Plan Status */}
        {(hasComedianPro || hasPromoterPro) && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-center">Your Current Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-4 flex-wrap">
                  {hasComedianPro && (
                    <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2">
                      <Zap className="w-4 h-4 mr-2" />
                      Comedian Pro
                    </Badge>
                  )}
                  {hasPromoterPro && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
                      <Crown className="w-4 h-4 mr-2" />
                      Promoter Pro
                    </Badge>
                  )}
                </div>
                <p className="text-center text-purple-200 mt-4">
                  Total: ${((hasComedianPro ? 20 : 0) + (hasPromoterPro ? 20 : 0))} AUD/month
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Discount Code Input */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <label htmlFor="discount" className="block text-sm font-medium text-white mb-2">
              Have a discount code?
            </label>
            <Input
              id="discount"
              type="text"
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={plan.name}
                className={`relative bg-white/10 backdrop-blur-sm border-white/20 text-white ${
                  plan.popular ? 'ring-2 ring-purple-400' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-purple-100">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.currency && <span className="text-sm text-purple-200"> {plan.currency}</span>}
                    {plan.period && <span className="text-purple-200">/{plan.period}</span>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.limitations && (
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-xs text-purple-200 mb-2">Limitations:</p>
                      {plan.limitations.map((limitation, index) => (
                        <p key={index} className="text-xs text-purple-300">• {limitation}</p>
                      ))}
                    </div>
                  )}

                  <Button 
                    className={`w-full ${
                      plan.isCurrentPlan 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : plan.popular 
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                          : 'bg-white/20 hover:bg-white/30'
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

                  {/* Add-on option for dual subscriptions */}
                  {plan.planType !== 'free' && (
                    <div className="border-t border-white/10 pt-4">
                      {plan.planType === 'comedian_pro' && !hasPromoterPro && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
                          disabled={loading === 'promoter_pro_addon'}
                          onClick={() => handleSubscribe('promoter_pro_addon')}
                        >
                          {loading === 'promoter_pro_addon' ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Promoter Pro (+$20/mo)
                            </>
                          )}
                        </Button>
                      )}
                      {plan.planType === 'promoter_pro' && !hasComedianPro && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
                          disabled={loading === 'comedian_pro_addon'}
                          onClick={() => handleSubscribe('comedian_pro_addon')}
                        >
                          {loading === 'comedian_pro_addon' ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Comedian Pro (+$20/mo)
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dual Plan Offer */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm border-pink-300/30 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">🎭 Ultimate Comedy Package</CardTitle>
              <CardDescription className="text-purple-100 text-lg">
                Get both Comedian Pro + Promoter Pro for the complete comedy experience
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="text-4xl font-bold">
                $40 <span className="text-lg text-purple-200">AUD/month</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Comedian Pro Features
                  </h4>
                  <ul className="text-sm space-y-1 text-purple-200">
                    <li>• Verified comedian badge</li>
                    <li>• Unlimited gig applications</li>
                    <li>• Comedian Marketplace access</li>
                    <li>• Invoice management</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Crown className="w-4 h-4 mr-2" />
                    Promoter Pro Features
                  </h4>
                  <ul className="text-sm space-y-1 text-purple-200">
                    <li>• Create unlimited events</li>
                    <li>• Advanced booking management</li>
                    <li>• Promoter Marketplace access</li>
                    <li>• Custom branding & API access</li>
                  </ul>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                disabled={hasComedianPro && hasPromoterPro || loading === 'dual_pro'}
                onClick={() => handleSubscribe('dual_pro')}
              >
                {loading === 'dual_pro' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : hasComedianPro && hasPromoterPro ? (
                  'You Have Both Plans!'
                ) : (
                  'Get Ultimate Package'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Can I have both Comedian Pro and Promoter Pro?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100">Absolutely! You can subscribe to both plans for $40 AUD/month total, or add one to the other for just +$20/month.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">What's included in the free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100">All paid plans include a 14-day free trial with full access to all features. No credit card required upfront.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100">Yes! You can upgrade, downgrade, or add/remove plan features at any time. Changes take effect immediately and billing is prorated.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">What are the Marketplaces?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100">The Comedian Marketplace connects you with gig opportunities, while the Promoter Marketplace helps you find and book talent. Each is exclusive to their respective Pro plan.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
