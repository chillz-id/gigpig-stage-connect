
import { useState, useEffect } from 'react';
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

export const useComedians = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comedians, setComedians] = useState<Comedian[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState<string | null>(null);

  const fetchComedians = async (): Promise<void> => {
    try {
      // Fetch comedians who have Comedian Pro badge
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, name, bio, location, avatar_url, is_verified, email')
        .eq('has_comedian_pro_badge', true);

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
      
      const dbComedians: Comedian[] = (profilesData || []).map((profile): Comedian => ({
        id: profile.id,
        name: profile.name,
        bio: profile.bio,
        location: profile.location,
        avatar_url: profile.avatar_url,
        is_verified: profile.is_verified || false,
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

  const handleContact = async (comedianId: string, comedianEmail: string): Promise<void> => {
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

  return {
    comedians,
    loading,
    contacting,
    handleContact
  };
};
