
import React from 'react';
import { toast } from '@/hooks/use-toast';
import { Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import ComedianHeader from './ComedianHeader';
import ComedianBio from './ComedianBio';
import ComedianMedia from './ComedianMedia';
import ComedianUpcomingShows from './ComedianUpcomingShows';
import ComedianAccomplishments from './ComedianAccomplishments';
import ComedianContact from './ComedianContact';
import { cn } from '@/lib/utils';

interface ComedianProfileLayoutProps {
  comedian: any;
}

const ComedianProfileLayout: React.FC<ComedianProfileLayoutProps> = ({ comedian }) => {
  const { hasRole } = useAuth();
  const { theme } = useTheme();

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

  const handleContact = () => {
    if (comedian.email) {
      const subject = `Booking Inquiry for ${comedian.name}`;
      const body = `Hi ${comedian.name},\n\nI'm interested in booking you for an upcoming show. Let's discuss the details.\n\nBest regards,`;
      window.location.href = `mailto:${comedian.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8 relative">
          {/* Action Buttons positioned absolutely */}
          {hasRole('admin') && (
            <div className="absolute top-0 left-0 z-10 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          )}

          {/* Header Section */}
          <ComedianHeader comedian={comedian} onShare={handleShare} onContact={handleContact} />
          
          {/* Bio Section */}
          <ComedianBio comedian={comedian} />
          
          {/* Contact Information */}
          <ComedianContact comedian={comedian} />
          
          {/* Media Showcase */}
          <ComedianMedia comedianId={comedian.id} />
          
          {/* Upcoming Shows */}
          <ComedianUpcomingShows comedianId={comedian.id} />
          
          {/* Accomplishments & Reviews */}
          <ComedianAccomplishments comedianId={comedian.id} />
        </div>
      </div>
    </div>
  );
};

export default ComedianProfileLayout;
