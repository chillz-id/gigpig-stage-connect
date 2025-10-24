import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Crown, Plus } from 'lucide-react';
import { VouchCardSimple } from './VouchCardSimple';
import { useToast } from '@/hooks/use-toast';

/**
 * VouchSystemSimple - Binary Crown-based Vouch System
 *
 * This component replaces the star rating system with a simple binary vouch:
 * - You are either vouched for or not (represented by a Crown)
 * - No rating scale - just the crown badge of approval
 */
export const VouchSystemSimple: React.FC = () => {
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const mockReceivedVouches = [
    {
      id: '1',
      fromUser: {
        name: 'Sarah Chen',
        avatar: '',
        role: 'Promoter'
      },
      comment: 'Alex delivered an outstanding performance at our venue. Professional, punctual, and had the crowd in stitches all night. Would definitely book again!',
      date: '2024-01-15',
      type: 'received' as const
    },
    {
      id: '2',
      fromUser: {
        name: 'Mike Rodriguez',
        avatar: '',
        role: 'Comedian'
      },
      comment: 'Great to work with Alex on the same bill. Supportive fellow comedian and knows how to work a crowd. Highly recommend!',
      date: '2024-01-10',
      type: 'received' as const
    },
    {
      id: '3',
      fromUser: {
        name: 'Comedy Central Venue',
        avatar: '',
        role: 'Promoter'
      },
      comment: 'Solid performance and very professional. Alex was easy to work with and drew good laughs from the audience.',
      date: '2024-01-05',
      type: 'received' as const
    }
  ];

  const mockGivenVouches = [
    {
      id: '4',
      fromUser: {
        name: 'Alex Johnson',
        avatar: '',
        role: 'Comedian'
      },
      toUser: {
        name: 'Jenny Walsh',
        avatar: '',
        role: 'Comedian'
      },
      comment: 'Jenny was fantastic to work with! Great energy on stage and very supportive backstage. A true professional.',
      date: '2024-01-12',
      type: 'given' as const
    },
    {
      id: '5',
      fromUser: {
        name: 'Alex Johnson',
        avatar: '',
        role: 'Comedian'
      },
      toUser: {
        name: 'The Laugh Track',
        avatar: '',
        role: 'Promoter'
      },
      comment: 'Excellent venue with a great team. Well organized event and they really look after their comedians. Highly recommend!',
      date: '2024-01-08',
      type: 'given' as const
    }
  ];

  const handleSubmitVouch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "User Required",
        description: "Please select a user to vouch for.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Vouch Submitted!",
      description: `You have vouched for ${searchQuery}. They now have your crown of approval!`,
    });

    setSearchQuery('');
    setComment('');
  };

  return (
    <div className="space-y-6">
      {/* Give a Vouch */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Give a Vouch
          </CardTitle>
          <CardDescription>
            Vouch for a comedian or promoter you've worked with - award them your crown of approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="vouchUser">User to Vouch For</Label>
            <Input
              id="vouchUser"
              placeholder="Search for comedian or promoter..."
              className="mt-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="vouchComment">Comment (Optional)</Label>
            <Textarea
              id="vouchComment"
              placeholder="Share your experience working with this person..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <Button onClick={handleSubmitVouch} className="professional-button w-full">
            <Crown className="w-4 h-4 mr-2" />
            Award Vouch
          </Button>
        </CardContent>
      </Card>

      {/* Vouch History */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Vouch History
          </CardTitle>
          <CardDescription>
            View vouches you've received and given
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received">
                Received ({mockReceivedVouches.length})
              </TabsTrigger>
              <TabsTrigger value="given">
                Given ({mockGivenVouches.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-4 mt-4">
              {mockReceivedVouches.map((vouch) => (
                <VouchCardSimple key={vouch.id} vouch={vouch} />
              ))}
            </TabsContent>

            <TabsContent value="given" className="space-y-4 mt-4">
              {mockGivenVouches.map((vouch) => (
                <VouchCardSimple key={vouch.id} vouch={vouch} />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
