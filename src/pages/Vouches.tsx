import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GiveVouchForm } from '@/components/GiveVouchForm';
import { VouchHistory } from '@/components/VouchHistory';
import { Crown } from 'lucide-react';

/**
 * Vouches Page
 * Central hub for managing vouches (endorsements/recommendations)
 *
 * Tabs:
 * - Received: Vouches received from other users
 * - Given: Vouches given to other users
 * - Give Vouch: Create a new vouch for someone
 */
export default function Vouches() {
  const { user, profile, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('received');

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Crown className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
            <p className="text-muted-foreground">
              Please sign in to view and manage vouches.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Vouches</h1>
        </div>
        <p className="text-muted-foreground">
          Manage endorsements and recommendations from your network
        </p>
      </div>

      {/* Give a Vouch Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Give a Vouch
          </CardTitle>
          <CardDescription>
            Endorse someone in your network by giving them a vouch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GiveVouchForm userId={user.id} />
        </CardContent>
      </Card>

      {/* Vouch History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Vouch History
          </CardTitle>
          <CardDescription>
            View vouches you've received and given
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received" className="gap-2">
                <Crown className="h-4 w-4" />
                Received
              </TabsTrigger>
              <TabsTrigger value="given" className="gap-2">
                <Crown className="h-4 w-4" />
                Given
              </TabsTrigger>
            </TabsList>

            {/* Received Vouches Tab */}
            <TabsContent value="received" className="space-y-4">
              <VouchHistory userId={user.id} mode="received" />
            </TabsContent>

            {/* Given Vouches Tab */}
            <TabsContent value="given" className="space-y-4">
              <VouchHistory userId={user.id} mode="given" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">About Vouches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Vouches</strong> are endorsements that help build trust and credibility within the comedy community.
          </p>
          <p>
            When you vouch for someone, you're recommending their work, professionalism, or talent to others in the network.
          </p>
          <p>
            Vouches appear on user profiles and help promoters, venues, and other comedians make informed decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
