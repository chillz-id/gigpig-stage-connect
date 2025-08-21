// Promoter Profile Layout - Main layout component for promoter profiles
import React from 'react';
import { toast } from '@/hooks/use-toast';
import { Calendar, Share, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import PromoterHeader from './PromoterHeader';
import PromoterBio from './PromoterBio';
import PromoterStats from './PromoterStats';
import PromoterVenues from './PromoterVenues';
import PromoterTeamMembers from './PromoterTeamMembers';
import PromoterUpcomingEvents from './PromoterUpcomingEvents';
import PromoterPastEvents from './PromoterPastEvents';
import PromoterReviews from './PromoterReviews';
import PromoterMedia from './PromoterMedia';
import PromoterAchievements from './PromoterAchievements';
import PromoterContact from './PromoterContact';
import { cn } from '@/lib/utils';

interface PromoterProfileLayoutProps {
  promoter: any; // Will be properly typed once we have the promoter service
}

const PromoterProfileLayout: React.FC<PromoterProfileLayoutProps> = ({ promoter }) => {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  
  // Check if this is the user's own profile
  const isOwnProfile = user?.id === promoter.id;

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${promoter.company_name || promoter.name} - Event Promoter`;
    const text = `Check out ${promoter.company_name || promoter.name}'s profile on Stand Up Sydney`;

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

  const handleContact = () => {
    if (promoter.contact_email || promoter.email) {
      const email = promoter.contact_email || promoter.email;
      const subject = `Collaboration Inquiry with ${promoter.company_name || promoter.name}`;
      const body = `Hi ${promoter.name},\\n\\nI'm interested in collaborating with you on upcoming comedy events. Let's discuss potential opportunities.\\n\\nBest regards,`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleBookEvent = () => {
    // Navigate to event booking/inquiry form
    toast({
      title: "Event Booking",
      description: "Event booking system coming soon!",
    });
  };

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-blue-900';
  };

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8 relative">
          {/* Admin Actions */}
          {hasRole('admin') && (
            <div className="absolute top-0 right-0 z-10 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          )}

          {/* Header Section with Company Info */}
          <PromoterHeader 
            promoter={promoter} 
            onShare={handleShare} 
            onContact={handleContact}
            onBookEvent={handleBookEvent}
          />
          
          {/* Bio and Company Information */}
          <PromoterBio promoter={promoter} />
          
          {/* Statistics Dashboard */}
          <PromoterStats promoterId={promoter.id} />

          {/* Two-column layout for detailed information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming Events */}
              <PromoterUpcomingEvents promoterId={promoter.id} />
              
              {/* Venue Portfolio */}
              <PromoterVenues promoterId={promoter.id} isOwnProfile={isOwnProfile} />
              
              {/* Past Events & Success Stories */}
              <PromoterPastEvents promoterId={promoter.id} />
              
              {/* Media Gallery */}
              <PromoterMedia promoterId={promoter.id} isOwnProfile={isOwnProfile} />
            </div>

            {/* Right column - Sidebar */}
            <div className="space-y-8">
              {/* Contact Information */}
              <PromoterContact promoter={promoter} />
              
              {/* Team Members */}
              <PromoterTeamMembers promoterId={promoter.id} isOwnProfile={isOwnProfile} />
              
              {/* Achievements & Milestones */}
              <PromoterAchievements promoterId={promoter.id} isOwnProfile={isOwnProfile} />
              
              {/* Reviews & Testimonials */}
              <PromoterReviews promoterId={promoter.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoterProfileLayout;