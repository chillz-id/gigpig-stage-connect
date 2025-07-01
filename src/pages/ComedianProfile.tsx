
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { mockComedians } from '@/data/mockComedians';
import ComedianHeader from '@/components/comedian-profile/ComedianHeader';
import ComedianBio from '@/components/comedian-profile/ComedianBio';
import ComedianMedia from '@/components/comedian-profile/ComedianMedia';
import ComedianAccomplishments from '@/components/comedian-profile/ComedianAccomplishments';
import ComedianUpcomingShows from '@/components/comedian-profile/ComedianUpcomingShows';
import ComedianProducingEvents from '@/components/comedian-profile/ComedianProducingEvents';
import ComedianReviews from '@/components/comedian-profile/ComedianReviews';
import ComedianStats from '@/components/comedian-profile/ComedianStats';
import ComedianContact from '@/components/comedian-profile/ComedianContact';

const ComedianProfile = () => {
  const { slug } = useParams<{ slug: string }>();

  // Query comedian data by slug
  const { data: comedian, isLoading, error } = useQuery({
    queryKey: ['comedian-profile', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No comedian slug provided');
      
      // Convert slug back to name for database query
      const name = slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      // First try to find in database - query all fields including contact info
      const { data: dbData, error: dbError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          stage_name,
          bio,
          location,
          avatar_url,
          is_verified,
          email,
          created_at,
          phone,
          website_url,
          instagram_url,
          twitter_url,
          youtube_url,
          facebook_url,
          tiktok_url,
          show_contact_in_epk,
          custom_show_types
        `)
        .or(`name.ilike.%${name}%,stage_name.ilike.%${name}%`)
        .maybeSingle();
      
      if (dbData) {
        return dbData;
      }
      
      // If not found in database, check mock data and add missing fields
      const mockComedian = mockComedians.find(comedian => {
        if (!comedian.name) return false;
        const comedianSlug = comedian.name.toLowerCase().replace(/\s+/g, '-');
        return comedianSlug === slug;
      });
      
      if (mockComedian) {
        // Add missing contact fields to mock data
        return {
          ...mockComedian,
          phone: null,
          website_url: null,
          instagram_url: null,
          twitter_url: null,
          youtube_url: null,
          facebook_url: null,
          tiktok_url: null,
          show_contact_in_epk: false
        };
      }
      
      throw new Error(`Comedian not found: ${name}`);
    },
    enabled: !!slug,
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-8">
              {/* Header skeleton */}
              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-32 h-32 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-4">
                      <div className="h-8 bg-muted rounded w-64"></div>
                      <div className="h-4 bg-muted rounded w-48"></div>
                      <div className="flex gap-2">
                        <div className="h-10 bg-muted rounded w-32"></div>
                        <div className="h-10 bg-muted rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Content skeletons */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-4/6"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !comedian) {
    console.error('Error loading comedian:', error);
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Comedian Not Found</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find a comedian with the name "{slug?.replace(/-/g, ' ')}"
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${comedian.name} - Comedian Profile`;
    const text = `Check out ${comedian.name}'s comedy profile on Stand Up Sydney`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: "Profile link has been copied to clipboard",
        });
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Profile link has been copied to clipboard",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Section */}
          <ComedianHeader comedian={comedian} onShare={handleShare} />
          
          {/* Performance Statistics */}
          <ComedianStats comedianId={comedian.id} />
          
          {/* Bio Section */}
          <ComedianBio comedian={comedian} />
          
          {/* Reviews & Testimonials */}
          <ComedianReviews comedianId={comedian.id} />
          
          {/* Contact Information */}
          <ComedianContact comedian={comedian} />
          
          {/* Media Showcase */}
          <ComedianMedia comedianId={comedian.id} />
          
          {/* Accomplishments */}
          <ComedianAccomplishments comedianId={comedian.id} />
          
          {/* Upcoming Shows */}
          <ComedianUpcomingShows comedianId={comedian.id} />
          
          {/* Co-Producing Events */}
          <ComedianProducingEvents comedianId={comedian.id} />
        </div>
      </div>
    </div>
  );
};

export default ComedianProfile;
