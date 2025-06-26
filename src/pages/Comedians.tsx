import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Loader2, Search, MapPin, Star, Mail, Calendar, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Comedian {
  id: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  email: string | null;
  years_experience?: number;
  show_count?: number;
  specialties?: string[];
}

// Separate interface for database results
interface DatabaseProfile {
  id: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  email: string | null;
}

const Comedians = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comedians, setComedians] = useState<Comedian[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacting, setContacting] = useState<string | null>(null);

  const fetchComedians = async () => {
    try {
      // Fetch comedians who have Comedian Pro and opted for public profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, bio, location, avatar_url, is_verified, email')
        .eq('has_comedian_pro_badge', true)
        .eq('public_profile', true)

      if (error) throw error;
      
      // Add mock data for demonstration
      const mockComedians: Comedian[] = [
        {
          id: '1',
          name: 'Sarah Mitchell',
          bio: 'Award-winning comedian specializing in observational humor and witty takes on modern life. 5+ years performing at top venues across Sydney.',
          location: 'Sydney CBD, NSW',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b793?w=150&h=150&fit=crop&crop=face',
          is_verified: true,
          email: 'sarah@example.com',
          years_experience: 5,
          show_count: 120,
          specialties: ['Observational', 'Storytelling', 'Crowd Work']
        },
        {
          id: '2',
          name: 'Jake Thompson',
          bio: 'High-energy comedian known for his improvisation skills and audience interaction. Regular performer at comedy clubs and festivals.',
          location: 'Newtown, NSW',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          is_verified: true,
          email: 'jake@example.com',
          years_experience: 3,
          show_count: 85,
          specialties: ['Improvisation', 'Crowd Work', 'Physical Comedy']
        },
        {
          id: '3',
          name: 'Emma Chen',
          bio: 'Rising star in the Sydney comedy scene with a unique blend of cultural humor and sharp social commentary.',
          location: 'Surry Hills, NSW',
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
          is_verified: true,
          email: 'emma@example.com',
          years_experience: 2,
          show_count: 45,
          specialties: ['Cultural Comedy', 'Social Commentary', 'Storytelling']
        },
        {
          id: '4',
          name: 'Marcus Williams',
          bio: 'Veteran comedian with over 8 years of experience. Known for his clever wordplay and engaging stage presence.',
          location: 'Bondi Beach, NSW',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          is_verified: true,
          email: 'marcus@example.com',
          years_experience: 8,
          show_count: 200,
          specialties: ['Wordplay', 'Observational', 'Clean Comedy']
        },
        {
          id: '5',
          name: 'Lisa Rodriguez',
          bio: 'Dynamic performer bringing fresh perspectives to the comedy stage. Specializes in relatable humor about everyday situations.',
          location: 'Darlinghurst, NSW',
          avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
          is_verified: true,
          email: 'lisa@example.com',
          years_experience: 4,
          show_count: 95,
          specialties: ['Relatable Humor', 'Storytelling', 'Observational']
        }
      ];
      
      const dbComedians: Comedian[] = (data || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        bio: profile.bio,
        location: profile.location,
        avatar_url: profile.avatar_url,
        is_verified: profile.is_verified,
        email: profile.email
      }));
      
      setComedians([...dbComedians, ...mockComedians]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load comedians",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (comedianId: string, comedianEmail: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to contact comedians.",
        variant: "destructive",
      });
      return;
    }

    setContacting(comedianId);
    try {
      // Send a message to the comedian
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: comedianId,
          subject: 'Booking Inquiry from Stand Up Sydney',
          content: `Hi! I'm interested in booking you for a comedy show. I found your profile on Stand Up Sydney and would love to discuss potential opportunities.`,
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
    fetchComedians();
  }, []);

  const filteredComedians = comedians.filter(comedian =>
    comedian.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comedian.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comedian.specialties?.some(specialty => 
      specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Stand Up Sydney Comedians</h1>
          <p className="text-muted-foreground">
            Discover talented comedians in Sydney's vibrant comedy scene
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search comedians by name, location, or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card/50 border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredComedians.map((comedian) => (
              <Card key={comedian.id} className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={comedian.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {comedian.name?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <CardTitle className="text-lg">{comedian.name || 'Unknown'}</CardTitle>
                        {comedian.is_verified && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                            <Star className="w-3 h-3 mr-1" />
                            Pro
                          </Badge>
                        )}
                      </div>
                      {comedian.location && (
                        <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3 mr-1" />
                          {comedian.location}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comedian.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {comedian.bio}
                    </p>
                  )}
                  
                  {comedian.specialties && comedian.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {comedian.specialties.slice(0, 3).map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-muted-foreground">
                    {comedian.years_experience && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {comedian.years_experience}y exp
                      </div>
                    )}
                    {comedian.show_count && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {comedian.show_count} shows
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    disabled={contacting === comedian.id}
                    onClick={() => handleContact(comedian.id, comedian.email || '')}
                  >
                    {contacting === comedian.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Contact
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredComedians.length === 0 && (
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No comedians found matching your search.' : 'No comedians available at the moment.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Comedians;
