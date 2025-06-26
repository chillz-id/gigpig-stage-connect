
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Loader2, Search, MapPin, Star, Zap, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Comedian {
  id: string;
  name: string;
  stage_name: string;
  bio: string;
  location: string;
  avatar_url: string;
  is_verified: boolean;
  email: string;
}

const ComedianMarketplace = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [comedians, setComedians] = useState<Comedian[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacting, setContacting] = useState<string | null>(null);

  const fetchComedians = async () => {
    try {
      // Fetch comedians who have the comedian role
      const { data: comedianRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'comedian');

      if (rolesError) throw rolesError;

      if (!comedianRoles || comedianRoles.length === 0) {
        setComedians([]);
        return;
      }

      const comedianIds = comedianRoles.map(role => role.user_id);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, stage_name, bio, location, avatar_url, is_verified, email')
        .in('id', comedianIds)
        .not('stage_name', 'is', null);

      if (error) throw error;
      setComedians(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load comedians from marketplace",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (comedianId: string, comedianEmail: string) => {
    setContacting(comedianId);
    try {
      // Send a message to the comedian
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: comedianId,
          subject: 'Marketplace Inquiry from Promoter',
          content: `Hi! I'm interested in booking you for an upcoming show. I found your profile on the Comedian Marketplace. Please let me know if you're available to discuss opportunities.`,
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your inquiry has been sent to the comedian.",
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
    if (hasRole('promoter') || hasRole('admin')) {
      fetchComedians();
    }
  }, [hasRole]);

  if (!hasRole('promoter') && !hasRole('admin')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comedian Marketplace</CardTitle>
          <CardDescription>Access requires Promoter role</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The Comedian Marketplace is available exclusively to promoters. 
            Contact an administrator to get promoter access.
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredComedians = comedians.filter(comedian =>
    comedian.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comedian.stage_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comedian.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Comedian Marketplace
          </CardTitle>
          <CardDescription>
            Browse and connect with professional comedians available for booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search comedians by name, stage name, or location..."
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
          {filteredComedians.map((comedian) => (
            <Card key={comedian.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={comedian.avatar_url} />
                    <AvatarFallback>
                      {comedian.name?.charAt(0) || comedian.stage_name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{comedian.stage_name || comedian.name}</h3>
                      {comedian.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    {comedian.stage_name && comedian.name && (
                      <p className="text-sm text-muted-foreground">{comedian.name}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {comedian.location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    {comedian.location}
                  </div>
                )}
                
                {comedian.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {comedian.bio}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={contacting === comedian.id}
                    onClick={() => handleContact(comedian.id, comedian.email)}
                  >
                    {contacting === comedian.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredComedians.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'No comedians found matching your search.' : 'No comedians available in the marketplace at the moment.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComedianMarketplace;
