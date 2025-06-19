
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, Star, Zap, Crown, Loader2 } from 'lucide-react';
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
      ],
      buttonText: 'Current Plan',
      isCurrentPlan: !profile?.membership || profile?.membership === 'free',
      popular: false,
      planType: 'free',
    },
    {
      name: 'Verified Comedian',
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
        '14-day free trial',
      ],
      buttonText: profile?.membership === 'verified_comedian' ? 'Current Plan' : 'Start Free Trial',
      isCurrentPlan: profile?.membership === 'verified_comedian',
      popular: true,
      planType: 'verified_comedian',
    },
    {
      name: 'Promoter',
      price: '$25',
      currency: 'AUD',
      period: 'month',
      description: 'For promoters and venues',
      icon: Crown,
      features: [
        'Everything in Verified Comedian',
        'Create unlimited events',
        'Advanced booking management',
        'Revenue analytics',
        'Comedian group management',
        'Custom branding',
        'API access',
        'Priority listing',
        '14-day free trial',
      ],
      buttonText: profile?.membership === 'promoter' ? 'Current Plan' : 'Start Free Trial',
      isCurrentPlan: profile?.membership === 'promoter',
      popular: false,
      planType: 'promoter',
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
            All paid plans include a 14-day free trial • Prices in AUD
          </p>
        </div>

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
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
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
                <p className="text-purple-100">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">What happens if I cancel?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100">You'll keep access to your current plan until the end of your billing period, then automatically switch to our Free plan.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Do you accept discount codes?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100">Yes! Enter your discount code above before selecting a plan. Codes can provide percentage discounts or extended trial periods.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
