
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Crown, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ComedianMarketplace from '@/components/ComedianMarketplace';

const Marketplace = () => {
  const { hasRole } = useAuth();

  const hasComedianAccess = hasRole('comedian') || hasRole('comedian_lite');

  if (!hasComedianAccess) {
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
                  <Badge variant="secondary">Comedian Access</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse and connect with other comedians in the industry.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  Requires Comedian role
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground">
                Contact an administrator to get the appropriate role for marketplace access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Comedians have access to the Comedian Marketplace
  if (hasComedianAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ComedianMarketplace />
      </div>
    );
  }

  // This should never be reached due to the check above, but TypeScript requires a return
  return null;
};

export default Marketplace;
