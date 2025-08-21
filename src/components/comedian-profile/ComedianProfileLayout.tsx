
import React from 'react';
import { toast } from '@/hooks/use-toast';
import { Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';
import { useProfileAnalytics } from '@/hooks/useProfileAnalytics';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import ComedianHeader from './ComedianHeader';
import ComedianBio from './ComedianBio';
import ComedianMedia from './ComedianMedia';
import ComedianUpcomingShows from './ComedianUpcomingShows';
import ComedianAccomplishments from './ComedianAccomplishments';
import ComedianContact from './ComedianContact';
import ComedianAvailabilityCalendar from './ComedianAvailabilityCalendar';
import PublicAvailabilityCalendar from './PublicAvailabilityCalendar';
import ComedianCalendarSync from './ComedianCalendarSync';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ComedianProfileLayoutProps {
  comedian: any;
}

const ComedianProfileLayout: React.FC<ComedianProfileLayoutProps> = ({ comedian }) => {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  
  // Check if this is the user's own profile
  const isOwnProfile = user?.id === comedian.id;

  // Track analytics for profile views
  const { trackInteraction } = useAnalyticsTracking({
    profileId: comedian.id,
    trackView: !isOwnProfile, // Don't track own profile views
    trackEngagement: !isOwnProfile,
  });

  const handleShare = async () => {
    trackInteraction('share');
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
    trackInteraction('contact_view');
    if (comedian.email) {
      trackInteraction('booking_request', { method: 'email' });
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
          
          {/* Show tabs for own profile to include analytics */}
          {isOwnProfile ? (
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-8">
                {/* Bio Section */}
                <ComedianBio comedian={comedian} />
                
                {/* Contact Information */}
                <ComedianContact comedian={comedian} />
                
                {/* Media Showcase */}
                <ComedianMedia comedianId={comedian.id} isOwnProfile={isOwnProfile} trackInteraction={trackInteraction} />
                
                {/* Upcoming Shows */}
                <ComedianUpcomingShows comedianId={comedian.id} />
                
                {/* Public Availability Calendar */}
                <PublicAvailabilityCalendar 
                  comedianId={comedian.id} 
                  comedianName={comedian.stage_name || comedian.name}
                />
                
                {/* Calendar Sync */}
                <ComedianCalendarSync comedianId={comedian.id} />
                
                {/* Accomplishments & Reviews */}
                <ComedianAccomplishments comedianId={comedian.id} />
              </TabsContent>
              
              <TabsContent value="analytics">
                <AnalyticsDashboard profileId={comedian.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {/* Bio Section */}
              <ComedianBio comedian={comedian} />
              
              {/* Contact Information */}
              <ComedianContact comedian={comedian} trackInteraction={trackInteraction} />
              
              {/* Media Showcase */}
              <ComedianMedia comedianId={comedian.id} isOwnProfile={isOwnProfile} trackInteraction={trackInteraction} />
              
              {/* Upcoming Shows */}
              <ComedianUpcomingShows comedianId={comedian.id} />
              
              {/* Public Availability Calendar */}
              <PublicAvailabilityCalendar 
                comedianId={comedian.id} 
                comedianName={comedian.stage_name || comedian.name}
              />
              
              {/* Accomplishments & Reviews */}
              <ComedianAccomplishments comedianId={comedian.id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComedianProfileLayout;
