
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, AlertCircle, Zap, Crown, Check, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  has_comedian_pro: boolean;
  has_promoter_pro: boolean;
  status: string;
  current_period_end?: string;
}

const SubscriptionManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const checkSubscription = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      setSubscription(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check subscription status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user || !subscription?.subscribed) return;
    
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const createCheckoutSession = async (planType: 'comedian' | 'promoter') => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType }
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
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trialing': return 'bg-blue-500';
      case 'past_due': return 'bg-yellow-500';
      case 'canceled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTotalCost = () => {
    if (!subscription) return 0;
    const comedianCost = subscription.has_comedian_pro ? 20 : 0;
    const promoterCost = subscription.has_promoter_pro ? 25 : 0;
    return comedianCost + promoterCost;
  };

  const upgradeOptions = [
    {
      title: "Comedian Pro",
      price: "$19.99/month",
      icon: Star,
      features: [
        "Verified comedian badge",
        "Priority in search results",
        "Advanced analytics",
        "Custom profile themes",
        "Direct messaging",
        "Priority support"
      ],
      color: "from-blue-500 to-purple-500",
      planType: 'comedian' as const
    },
    {
      title: "Promoter Pro",
      price: "$24.99/month", 
      icon: Crown,
      features: [
        "Unlimited event creation",
        "Advanced event management",
        "Comedian recommendations",
        "Bulk messaging tools",
        "Analytics dashboard",
        "Priority support"
      ],
      color: "from-purple-500 to-pink-500",
      planType: 'promoter' as const
    },
    {
      title: "Bundle & Save",
      price: "$39.99/month",
      originalPrice: "$44.98",
      icon: Zap,
      features: [
        "All Comedian Pro features",
        "All Promoter Pro features", 
        "Cross-platform benefits",
        "Exclusive networking events",
        "Advanced insights",
        "24/7 premium support"
      ],
      color: "from-yellow-500 to-orange-500",
      badge: "Best Value",
      planType: 'comedian' as const
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="professional-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription Status
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSubscription}
              disabled={loading}
              className="professional-button"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="space-y-3">
                {/* Current Plans */}
                <div>
                  <p className="font-medium text-foreground mb-2">Current Plans:</p>
                  <div className="flex flex-wrap gap-2">
                    {subscription.has_comedian_pro && (
                      <Badge className="bg-gradient-to-r from-pink-500 to-purple-500">
                        <Zap className="w-3 h-3 mr-1" />
                        Comedian Pro - $20/month
                      </Badge>
                    )}
                    {subscription.has_promoter_pro && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                        <Crown className="w-3 h-3 mr-1" />
                        Promoter Pro - $25/month
                      </Badge>
                    )}
                    {!subscription.has_comedian_pro && !subscription.has_promoter_pro && (
                      <Badge variant="outline">Free Plan</Badge>
                    )}
                  </div>
                </div>

                {/* Total Cost */}
                {(subscription.has_comedian_pro || subscription.has_promoter_pro) && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Monthly Total:</p>
                    <p className="font-medium">
                      ${getTotalCost()} AUD/month
                      {subscription.has_comedian_pro && subscription.has_promoter_pro && (
                        <span className="text-green-600 text-xs ml-2">($5/month savings)</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Status and Period */}
                <div className="flex items-center justify-between">
                  <div>
                    {subscription.current_period_end && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {subscription.status === 'active' ? 'Renews' : 'Expires'} on{' '}
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {subscription.subscribed && subscription.status === 'active' && (
                <Button
                  onClick={openCustomerPortal}
                  disabled={portalLoading}
                  className="w-full professional-button"
                >
                  {portalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Manage Subscription'
                  )}
                </Button>
              )}

              {subscription.status === 'past_due' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm font-medium">Payment Required</p>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your subscription payment is past due. Please update your payment method to continue.
                  </p>
                  <Button
                    size="sm"
                    onClick={openCustomerPortal}
                    disabled={portalLoading}
                    className="mt-2 bg-yellow-600 hover:bg-yellow-700"
                  >
                    Update Payment Method
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading subscription status...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Your Account Section */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle>Upgrade Your Account</CardTitle>
          <CardDescription>
            Unlock premium features and grow your comedy career
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upgradeOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <div key={index} className="relative border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  {option.badge && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500">
                      {option.badge}
                    </Badge>
                  )}
                  
                  <div className="text-center mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">{option.title}</h3>
                    <div className="mt-2">
                      {option.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through mr-2">
                          {option.originalPrice}
                        </span>
                      )}
                      <span className="text-2xl font-bold">{option.price}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {option.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full bg-gradient-to-r ${option.color} hover:opacity-90 transition-opacity`}
                    onClick={() => createCheckoutSession(option.planType)}
                  >
                    Upgrade Now
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager;
