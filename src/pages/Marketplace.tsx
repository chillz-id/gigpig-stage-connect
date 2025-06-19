
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Crown, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ComedianMarketplace from '@/components/ComedianMarketplace';
import PromoterMarketplace from '@/components/PromoterMarketplace';

const Marketplace = () => {
  const { profile } = useAuth();

  const hasComedianPro = profile?.has_comedian_pro_badge || false;
  const hasPromoterPro = profile?.has_promoter_pro_badge || false;

  if (!hasComedianPro && !hasPromoterPro) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🎭 Marketplace Access</CardTitle>
            <CardDescription>
              Professional networking for the comedy industry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold">Comedian Marketplace</h3>
                  <Badge variant="secondary">Promoter Pro</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse and contact talented comedians for your shows and events.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  Requires Promoter Pro subscription
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-pink-600" />
                  <h3 className="font-semibold">Promoter Marketplace</h3>
                  <Badge variant="secondary">Comedian Pro</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with promoters and venues looking for comedy talent.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  Requires Comedian Pro subscription
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground">
                Upgrade to Pro to access exclusive marketplace features and connect with industry professionals.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableTabs = [];
  if (hasPromoterPro) {
    availableTabs.push({
      value: 'comedians',
      label: 'Comedian Marketplace',
      icon: Zap,
      component: <ComedianMarketplace />
    });
  }
  if (hasComedianPro) {
    availableTabs.push({
      value: 'promoters',
      label: 'Promoter Marketplace',
      icon: Crown,
      component: <PromoterMarketplace />
    });
  }

  if (availableTabs.length === 1) {
    return (
      <div className="container mx-auto px-4 py-8">
        {availableTabs[0].component}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">🎭 Marketplace</h1>
        <p className="text-muted-foreground">
          Connect with comedy industry professionals
        </p>
      </div>

      <Tabs defaultValue={availableTabs[0]?.value} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {availableTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Marketplace;
