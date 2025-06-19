import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Check, Star, Zap, Crown, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
const Pricing = () => {
  const {
    profile,
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
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
      const {
        data,
        error
      } = await supabase.functions.invoke('create-checkout', {
        body: {
          planType: isAnnual ? `${planType}_annual` : planType,
          discountCode: discountCode || undefined
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
  const plans = [{
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    icon: Star,
    features: ['Apply to open mic nights', 'Basic profile', 'View public shows', 'Email notifications', 'Community access'],
    limitations: ['No paid gig applications', 'Limited to 5 applications/month', 'No verified badge', 'No marketplace access'],
    buttonText: 'Current Plan',
    isCurrentPlan: !hasComedianPro && !hasPromoterPro,
    popular: false,
    planType: 'free'
  }, {
    name: 'Comedian Pro',
    price: `$${comedianPrice.price}`,
    originalPrice: comedianPrice.originalPrice ? `$${comedianPrice.originalPrice}` : null,
    currency: 'AUD',
    period: comedianPrice.period,
    billing: comedianPrice.billing,
    description: 'For serious comedians',
    icon: Zap,
    features: ['Everything in Free', 'Apply to all paid gigs', 'Verified comedian badge', 'Unlimited applications', 'Priority support', 'Advanced analytics', 'Professional profile', 'Promoter Marketplace access', 'Invoice management', '14-day free trial'],
    buttonText: hasComedianPro ? 'Current Plan' : 'Start Free Trial',
    isCurrentPlan: hasComedianPro,
    popular: true,
    planType: 'comedian_pro'
  }, {
    name: 'Promoter Pro',
    price: `$${promoterPrice.price}`,
    originalPrice: promoterPrice.originalPrice ? `$${promoterPrice.originalPrice}` : null,
    currency: 'AUD',
    period: promoterPrice.period,
    billing: promoterPrice.billing,
    description: 'For promoters and venues',
    icon: Crown,
    features: ['Create unlimited events', 'Advanced booking management', 'Revenue analytics', 'Comedian group management', 'Custom branding', 'API access', 'Priority listing', 'Comedian Marketplace access', 'Invoice management', '14-day free trial'],
    buttonText: hasPromoterPro ? 'Current Plan' : 'Start Free Trial',
    isCurrentPlan: hasPromoterPro,
    popular: false,
    planType: 'promoter_pro'
  }];
  return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
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

        {/* Billing Toggle */}
        <div className="flex justify-center items-center space-x-4 mb-8">
          <span className={`text-white ${!isAnnual ? 'font-semibold' : ''}`}>Monthly</span>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} className="data-[state=checked]:bg-purple-500" />
          <span className={`text-white ${isAnnual ? 'font-semibold' : ''}`}>
            Annual
            <Badge className="ml-2 bg-green-500">Save 25%</Badge>
          </span>
        </div>

        {/* Current Plan Status */}
        {(hasComedianPro || hasPromoterPro) && <div className="max-w-2xl mx-auto mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-center">Your Current Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-4 flex-wrap">
                  {hasComedianPro && <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2">
                      <Zap className="w-4 h-4 mr-2" />
                      Comedian Pro
                    </Badge>}
                  {hasPromoterPro && <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
                      <Crown className="w-4 h-4 mr-2" />
                      Promoter Pro
                    </Badge>}
                </div>
                <p className="text-center text-purple-200 mt-4">
                  Total: ${(hasComedianPro ? comedianPrice.price : 0) + (hasPromoterPro ? promoterPrice.price : 0)} AUD/month
                  {isAnnual && <span className="block text-sm">{comedianPrice.billing}</span>}
                </p>
              </CardContent>
            </Card>
          </div>}

        {/* Discount Code Input */}
        <div className="max-w-md mx-auto mb-8">
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map(plan => {
          const Icon = plan.icon;
          return <Card key={plan.name} className={`relative bg-white/10 backdrop-blur-sm border-white/20 text-white ${plan.popular ? 'ring-2 ring-purple-400' : ''}`}>
                {plan.popular && <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500">
                    Most Popular
                  </Badge>}
                
                <CardHeader className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-purple-100">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="flex items-center justify-center gap-2">
                      {plan.originalPrice && <span className="text-2xl text-purple-300 line-through">{plan.originalPrice}</span>}
                      <span className="text-4xl font-bold">{plan.price}</span>
                    </div>
                    {plan.currency && <span className="text-sm text-purple-200"> {plan.currency}</span>}
                    {plan.period && <span className="text-purple-200">/{plan.period}</span>}
                    {plan.billing && <div className="text-sm text-purple-200 mt-1">{plan.billing}</div>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => <div key={index} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>)}
                  </div>

                  {plan.limitations && <div className="border-t border-white/10 pt-4">
                      <p className="text-xs text-purple-200 mb-2">Limitations:</p>
                      {plan.limitations.map((limitation, index) => <p key={index} className="text-xs text-purple-300">• {limitation}</p>)}
                    </div>}

                  <Button className={`w-full ${plan.isCurrentPlan ? 'bg-gray-600 cursor-not-allowed' : plan.popular ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600' : 'bg-white/20 hover:bg-white/30'}`} disabled={plan.isCurrentPlan || loading === plan.planType} onClick={() => plan.planType !== 'free' && handleSubscribe(plan.planType)}>
                    {loading === plan.planType ? <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </> : plan.buttonText}
                  </Button>

                  {/* Add-on option for dual subscriptions */}
                  {plan.planType !== 'free' && <div className="border-t border-white/10 pt-4">
                      {plan.planType === 'comedian_pro' && !hasPromoterPro && <div className="space-y-2">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isAnnual && <span className="text-sm text-purple-300 line-through">${25}</span>}
                              <span className="text-lg font-bold">${promoterPrice.price}</span>
                              <span className="text-sm text-purple-200">/month</span>
                            </div>
                            <p className="text-xs text-purple-200">Add Promoter Pro</p>
                          </div>
                          <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20" disabled={loading === 'dual_pro'} onClick={() => handleSubscribe('dual_pro')}>
                            {loading === 'dual_pro' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <>
                                <Plus className="w-4 h-4 mr-2" />
                                Get Both Plans
                              </>}
                          </Button>
                        </div>}
                      {plan.planType === 'promoter_pro' && !hasComedianPro && <div className="space-y-2">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isAnnual && <span className="text-sm text-purple-300 line-through">${20}</span>}
                              <span className="text-lg font-bold">${comedianPrice.price}</span>
                              <span className="text-sm text-purple-200">/month</span>
                            </div>
                            <p className="text-xs text-purple-200">Add Comedian Pro</p>
                          </div>
                          <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20" disabled={loading === 'dual_pro'} onClick={() => handleSubscribe('dual_pro')}>
                            {loading === 'dual_pro' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <>
                                <Plus className="w-4 h-4 mr-2" />
                                Get Both Plans
                              </>}
                          </Button>
                        </div>}
                    </div>}
                </CardContent>
              </Card>;
        })}
        </div>

        {/* Dual Plan Offer */}
        {!hasComedianPro || !hasPromoterPro ? <div className="max-w-2xl mx-auto mt-12">
            <Card className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm border-pink-300/30 text-white">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">🎭 Get Both Plans & Save</CardTitle>
                <CardDescription className="text-purple-100 text-lg">
                  Subscribe to both Comedian Pro + Promoter Pro and save $5/month
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div>
                  <div className="flex items-center justify-center gap-2">
                    {isAnnual && <span className="text-2xl text-purple-300 line-through">$45</span>}
                    <span className="text-4xl font-bold">${dualPrice.price}</span>
                    <span className="text-lg text-purple-200">AUD/month</span>
                  </div>
                  <p className="text-sm text-purple-200">{dualPrice.billing}</p>
                  <p className="text-green-300 font-medium">Save $5/month compared to separate plans</p>
                </div>
                <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" disabled={hasComedianPro && hasPromoterPro || loading === 'dual_pro'} onClick={() => handleSubscribe('dual_pro')}>
                  {loading === 'dual_pro' ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </> : 'Get Both Plans'}
                </Button>
              </CardContent>
            </Card>
          </div> : null}

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Can I have both Comedian Pro and Promoter Pro?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100">Yes! You can subscribe to both plans for $40 AUD/month total (saving $5/month), or add one to the other as an add-on.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">What's the difference between monthly and annual billing?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100">Annual subscriptions save you 25% compared to monthly billing. You'll be billed once per year at the discounted rate.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">What are the Marketplaces?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-purple-100">
                  <div>
                    <h4 className="font-semibold text-white">Comedian Marketplace (Promoter Pro)</h4>
                    <p>Access to a curated list of comedians who have opted into the marketplace. Promoters can browse comedian profiles and make direct offers for shows and events.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Promoter Marketplace (Comedian Pro)</h4>
                    <p>Access to a directory of promoters and venues. Comedians can browse promoter profiles and request contact information to pitch themselves for shows.</p>
                  </div>
                </div>
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
          </div>
        </div>
      </div>
    </div>;
};
export default Pricing;