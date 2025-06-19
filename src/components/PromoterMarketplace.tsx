
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Loader2, Search, MapPin, Crown, Mail, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Promoter {
  id: string;
  name: string;
  bio: string;
  location: string;
  avatar_url: string;
  is_verified: boolean;
  email: string;
}

const PromoterMarketplace = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacting, setContacting] = useState<string | null>(null);

  const fetchPromoters = async () => {
    try {
      // Fetch promoters who have opted into the marketplace
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, bio, location, avatar_url, is_verified, email')
        .eq('has_promoter_pro_badge', true);

      if (error) throw error;
      setPromoters(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load promoters from marketplace",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (promoterId: string, promoterEmail: string) => {
    setContacting(promoterId);
    try {
      // Send a message to the promoter
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: promoterId,
          subject: 'Marketplace Inquiry from Comedian',
          content: `Hi! I'm a comedian interested in performing at your shows. I found your profile on the Promoter Marketplace. I'd love to discuss potential opportunities to perform at your events.`,
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your inquiry has been sent to the promoter.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setContacting(null);
    }
  };

  useEffect(() => {
    if (profile?.has_comedian_pro_badge) {
      fetchPromoters();
    }
  }, [profile]);

  if (!profile?.has_comedian_pro_badge) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Promoter Marketplace</CardTitle>
          <CardDescription>Access requires Comedian Pro subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The Promoter Marketplace is available exclusively to Comedian Pro subscribers. 
            Upgrade your plan to browse and contact promoters for gig opportunities.
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredPromoters = promoters.filter(promoter =>
    promoter.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promoter.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Promoter Marketplace
          </CardTitle>
          <CardDescription>
            Connect with promoters and venues looking for comedy talent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search promoters by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromoters.map((promoter) => (
            <Card key={promoter.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={promoter.avatar_url} />
                    <AvatarFallback>
                      {promoter.name?.charAt(0) || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{promoter.name}</h3>
                      {promoter.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Building className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {promoter.location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    {promoter.location}
                  </div>
                )}
                
                {promoter.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {promoter.bio}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={contacting === promoter.id}
                    onClick={() => handleContact(promoter.id, promoter.email)}
                  >
                    {contacting === promoter.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Request Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredPromoters.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'No promoters found matching your search.' : 'No promoters available in the marketplace at the moment.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PromoterMarketplace;
