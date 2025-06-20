
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, Plus, Shield, Eye, EyeOff, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Vouch {
  id: string;
  from: { name: string; avatar: string; verified: boolean; role: 'comedian' | 'promoter' };
  to: { name: string; avatar: string; verified: boolean; role: 'comedian' | 'promoter' };
  message: string;
  isPublic: boolean;
  date: string;
  category: 'professionalism' | 'talent' | 'reliability' | 'communication';
}

const mockVouches: Vouch[] = [
  {
    id: '1',
    from: { name: 'Sarah Johnson', avatar: '/placeholder.svg', verified: true, role: 'promoter' },
    to: { name: 'Mike Chen', avatar: '/placeholder.svg', verified: true, role: 'comedian' },
    message: 'Outstanding performer with incredible stage presence. Always professional and reliable.',
    isPublic: true,
    date: '2024-12-15',
    category: 'talent'
  },
  {
    id: '2',
    from: { name: 'David Williams', avatar: '/placeholder.svg', verified: true, role: 'comedian' },
    to: { name: 'Emma Davis', avatar: '/placeholder.svg', verified: true, role: 'promoter' },
    message: 'Fantastic promoter who really cares about the comedians. Great communication throughout.',
    isPublic: true,
    date: '2024-12-14',
    category: 'professionalism'
  }
];

export const VouchSystem: React.FC = () => {
  const { toast } = useToast();
  const [vouches, setVouches] = useState<Vouch[]>(mockVouches);
  const [newVouch, setNewVouch] = useState({
    to: '',
    message: '',
    isPublic: true,
    category: 'professionalism' as const
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateVouch = () => {
    const vouch: Vouch = {
      id: Date.now().toString(),
      from: { name: 'You', avatar: '/placeholder.svg', verified: true, role: 'comedian' },
      to: { name: newVouch.to, avatar: '/placeholder.svg', verified: true, role: 'promoter' },
      message: newVouch.message,
      isPublic: newVouch.isPublic,
      date: new Date().toISOString().split('T')[0],
      category: newVouch.category
    };

    setVouches(prev => [vouch, ...prev]);
    setNewVouch({ to: '', message: '', isPublic: true, category: 'professionalism' });
    setIsCreateDialogOpen(false);

    toast({
      title: "Vouch Created",
      description: `Your ${newVouch.isPublic ? 'public' : 'private'} vouch has been submitted.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="professional-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5" />
                Current Vouches
              </CardTitle>
              <CardDescription>
                Give and receive recommendations from verified comedians and promoters
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="professional-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Vouch
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create a Vouch</DialogTitle>
                  <DialogDescription>
                    Recommend someone you've worked with to the community
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Vouching for</label>
                    <Select value={newVouch.to} onValueChange={(value) => setNewVouch(prev => ({ ...prev, to: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select person to vouch for" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sarah Johnson">Sarah Johnson (Promoter)</SelectItem>
                        <SelectItem value="Mike Chen">Mike Chen (Comedian)</SelectItem>
                        <SelectItem value="Emma Davis">Emma Davis (Promoter)</SelectItem>
                        <SelectItem value="David Williams">David Williams (Comedian)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newVouch.category} onValueChange={(value) => setNewVouch(prev => ({ ...prev, category: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professionalism">Professionalism</SelectItem>
                        <SelectItem value="talent">Talent</SelectItem>
                        <SelectItem value="reliability">Reliability</SelectItem>
                        <SelectItem value="communication">Communication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Your recommendation</label>
                    <Textarea
                      placeholder="Share your experience working with this person..."
                      value={newVouch.message}
                      onChange={(e) => setNewVouch(prev => ({ ...prev, message: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={newVouch.isPublic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewVouch(prev => ({ ...prev, isPublic: true }))}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Public
                    </Button>
                    <Button
                      type="button"
                      variant={!newVouch.isPublic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewVouch(prev => ({ ...prev, isPublic: false }))}
                    >
                      <EyeOff className="w-4 h-4 mr-1" />
                      Private
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleCreateVouch}
                      disabled={!newVouch.to || !newVouch.message}
                      className="flex-1 professional-button"
                    >
                      Submit Vouch
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="received">Received</TabsTrigger>
              <TabsTrigger value="given">Given</TabsTrigger>
              <TabsTrigger value="public">Public Feed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="received" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Vouches you've received from other verified users
              </div>
              {vouches.filter(v => v.to.name === 'You').map((vouch) => (
                <Card key={vouch.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={vouch.from.avatar} />
                      <AvatarFallback>{vouch.from.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{vouch.from.name}</span>
                        {vouch.from.verified && <Shield className="w-4 h-4 text-blue-500" />}
                        <Badge variant="outline">{vouch.from.role}</Badge>
                        <Badge variant="outline">{vouch.category}</Badge>
                        {!vouch.isPublic && <Badge variant="secondary"><EyeOff className="w-3 h-3 mr-1" />Private</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{vouch.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{vouch.date}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="given" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Vouches you've given to other users
              </div>
              {vouches.filter(v => v.from.name === 'You').map((vouch) => (
                <Card key={vouch.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={vouch.to.avatar} />
                      <AvatarFallback>{vouch.to.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{vouch.to.name}</span>
                        {vouch.to.verified && <Shield className="w-4 h-4 text-blue-500" />}
                        <Badge variant="outline">{vouch.to.role}</Badge>
                        <Badge variant="outline">{vouch.category}</Badge>
                        {!vouch.isPublic && <Badge variant="secondary"><EyeOff className="w-3 h-3 mr-1" />Private</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{vouch.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{vouch.date}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="public" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Public vouches from the community
              </div>
              {vouches.filter(v => v.isPublic).map((vouch) => (
                <Card key={vouch.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={vouch.from.avatar} />
                      <AvatarFallback>{vouch.from.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{vouch.from.name}</span>
                        {vouch.from.verified &&  <Shield className="w-4 h-4 text-blue-500" />}
                        <Badge variant="outline">{vouch.from.role}</Badge>
                        <span className="text-sm text-muted-foreground">vouched for</span>
                        <span className="font-medium">{vouch.to.name}</span>
                        {vouch.to.verified && <Shield className="w-4 h-4 text-blue-500" />}
                        <Badge variant="outline">{vouch.to.role}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{vouch.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{vouch.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{vouch.date}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
