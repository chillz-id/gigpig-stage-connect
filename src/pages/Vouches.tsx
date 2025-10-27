import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VouchSystemEnhanced } from '@/components/VouchSystemEnhanced';
import { Award, ThumbsUp, UserPlus } from 'lucide-react';

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
            <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
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
          <Award className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Vouches</h1>
        </div>
        <p className="text-muted-foreground">
          Manage endorsements and recommendations from your network
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="received" className="gap-2">
            <ThumbsUp className="h-4 w-4" />
            Received
          </TabsTrigger>
          <TabsTrigger value="given" className="gap-2">
            <Award className="h-4 w-4" />
            Given
          </TabsTrigger>
          <TabsTrigger value="give" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Give Vouch
          </TabsTrigger>
        </TabsList>

        {/* Received Vouches Tab */}
        <TabsContent value="received" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vouches You've Received</CardTitle>
              <CardDescription>
                Endorsements and recommendations from other users in your network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VouchSystemEnhanced
                userId={user.id}
                mode="received"
                showStats={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Given Vouches Tab */}
        <TabsContent value="given" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vouches You've Given</CardTitle>
              <CardDescription>
                Your endorsements and recommendations for others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VouchSystemEnhanced
                userId={user.id}
                mode="given"
                showStats={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Give Vouch Tab */}
        <TabsContent value="give" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Give a Vouch</CardTitle>
              <CardDescription>
                Endorse someone in your network by giving them a vouch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VouchSystemEnhanced
                userId={user.id}
                mode="create"
                showStats={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
