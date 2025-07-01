
import React from 'react';
import { toast } from '@/hooks/use-toast';
import ComedianHeader from './ComedianHeader';
import ComedianBio from './ComedianBio';
import ComedianMedia from './ComedianMedia';
import ComedianAccomplishments from './ComedianAccomplishments';
import ComedianUpcomingShows from './ComedianUpcomingShows';
import ComedianProducingEvents from './ComedianProducingEvents';
import ComedianReviews from './ComedianReviews';
import ComedianStats from './ComedianStats';
import ComedianContact from './ComedianContact';

interface ComedianProfileLayoutProps {
  comedian: any;
}

const ComedianProfileLayout: React.FC<ComedianProfileLayoutProps> = ({ comedian }) => {
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

export default ComedianProfileLayout;
