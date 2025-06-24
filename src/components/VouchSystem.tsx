
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Award, Star, Plus } from 'lucide-react';
import { VouchCard } from './VouchCard';
import { useToast } from '@/hooks/use-toast';

export const VouchSystem: React.FC = () => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const mockReceivedVouches = [
    {
      id: '1',
      fromUser: {
        name: 'Sarah Chen',
        avatar: '',
        role: 'Promoter'
      },
      rating: 5,
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
      rating: 5,
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
      rating: 4,
      comment: 'Solid performance and very professional. Alex was easy to work with and drew good laughs from the audience.',
      date: '2024-01-05',
      type: 'received' as const
    }
  ];

  const mockGivenVouches = [
    {
      id: '4',
      toUser: {
        name: 'Jenny Walsh',
        avatar: '',
        role: 'Comedian'
      },
      rating: 5,
      comment: 'Jenny was fantastic to work with! Great energy on stage and very supportive backstage. A true professional.',
      date: '2024-01-12',
      type: 'given' as const
    },
    {
      id: '5',
      toUser: {
        name: 'The Laugh Track',
        avatar: '',
        role: 'Promoter'
      },
      rating: 5,
      comment: 'Excellent venue with a great team. Well organized event and they really look after their comedians. Highly recommend!',
      date: '2024-01-08',
      type: 'given' as const
    }
  ];

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmitVouch = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Vouch Submitted!",
      description: "Your vouch has been submitted successfully.",
    });
    
    setRating(0);
    setComment('');
  };

  const renderStars = (interactive = false, currentRating = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-6 h-6 cursor-pointer transition-colors ${
          i < currentRating ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-200'
        }`}
        onClick={interactive ? () => handleStarClick(i + 1) : undefined}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Give a Vouch */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Give a Vouch
          </CardTitle>
          <CardDescription>
            Vouch for a comedian or promoter you've worked with
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="vouchUser">User to Vouch For</Label>
            <Input
              id="vouchUser"
              placeholder="Search for comedian or promoter..."
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Rating</Label>
            <div className="flex items-center gap-1 mt-2">
              {renderStars(true, rating)}
            </div>
          </div>

          <div>
            <Label htmlFor="vouchComment">Comment</Label>
            <Textarea
              id="vouchComment"
              placeholder="Share your experience working with this person..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <Button onClick={handleSubmitVouch} className="professional-button">
            Submit Vouch
          </Button>
        </CardContent>
      </Card>

      {/* Vouch History */}
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
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
                <VouchCard key={vouch.id} vouch={vouch} />
              ))}
            </TabsContent>
            
            <TabsContent value="given" className="space-y-4 mt-4">
              {mockGivenVouches.map((vouch) => (
                <VouchCard key={vouch.id} vouch={vouch} />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
