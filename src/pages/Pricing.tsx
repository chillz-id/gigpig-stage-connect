
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Pricing = () => {
  const { profile } = useAuth();

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
      isCurrentPlan: profile?.membership === 'free',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$19',
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
      ],
      buttonText: profile?.membership === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      isCurrentPlan: profile?.membership === 'pro',
      popular: true,
    },
    {
      name: 'Premium',
      price: '$49',
      period: 'month',
      description: 'For promoters and venues',
      icon: Crown,
      features: [
        'Everything in Pro',
        'Create unlimited events',
        'Advanced booking management',
        'Revenue analytics',
        'Comedian group management',
        'Custom branding',
        'API access',
        'Priority listing',
      ],
      buttonText: profile?.membership === 'premium' ? 'Current Plan' : 'Upgrade to Premium',
      isCurrentPlan: profile?.membership === 'premium',
      popular: false,
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
                    disabled={plan.isCurrentPlan}
                  >
                    {plan.buttonText}
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
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
