
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ComedianAvatar from './ComedianAvatar';
import ComedianBasicInfo from './ComedianBasicInfo';
import ComedianActions from './ComedianActions';
import ComedianSocialLinks from './ComedianSocialLinks';
import { BannerImage } from './BannerImage';
import { BannerUpload } from './BannerUpload';
import { BookingInquiryModal } from './BookingInquiryModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ComedianHeaderProps {
  comedian: {
    id: string;
    name: string | null;
    bio: string | null;
    profile_tagline?: string | null;
    location: string | null;
    avatar_url: string | null;
    banner_url?: string | null;
    banner_position?: { x: number; y: number; scale: number } | null;
    is_verified: boolean;
    email: string | null;
    instagram_url?: string | null;
    twitter_url?: string | null;
    facebook_url?: string | null;
    youtube_url?: string | null;
    tiktok_url?: string | null;
  };
  isOwnProfile: boolean;
  onShare: () => void;
  onContact: () => void;
}

const ComedianHeader: React.FC<ComedianHeaderProps> = ({ comedian, isOwnProfile, onShare, onContact }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBannerUploadOpen, setIsBannerUploadOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [localBannerUrl, setLocalBannerUrl] = useState(comedian.banner_url);

  const handleBannerUpload = () => {
    // Always open upload dialog to upload new banner
    setIsBannerUploadOpen(true);
  };

  const handleBannerSave = async (position: { x: number; y: number; scale: number }) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          banner_position: position
        })
        .eq('id', comedian.id);

      if (error) throw error;

      // Invalidate query cache to trigger refetch and update UI
      await queryClient.invalidateQueries({
        queryKey: ['comedian-profile-by-slug']
      });

      toast({
        title: 'Banner position saved',
        description: 'Your banner has been repositioned successfully.'
      });
    } catch (error) {
      console.error('Error saving banner position:', error);
      toast({
        title: 'Failed to save position',
        description: 'There was an error saving your banner position. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleBannerUploaded = (bannerUrl: string) => {
    setLocalBannerUrl(bannerUrl);
    setIsBannerUploadOpen(false);

    // TEMPORARY: Disabled to debug infinite refresh
    // window.location.reload();
  };

  const handleContact = () => {
    setIsBookingModalOpen(true);
    onContact();
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl">
        {/* Banner Section - 8:3 aspect ratio (1200x450) */}
        <div className="relative w-full aspect-[8/3]">
          <BannerImage
            banner_url={localBannerUrl || comedian.banner_url || null}
            banner_position={comedian.banner_position || null}
            isOwnProfile={isOwnProfile}
            onEditClick={handleBannerUpload}
            onRepositionSave={handleBannerSave}
          />

          {/* Fallback gradient background if no banner */}
          {!localBannerUrl && !comedian.banner_url && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />
              {/* Background pattern */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='60' cy='60' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
              />
            </>
          )}
        </div>

        {/* Content Section - gradient background continues */}
        <CardContent className="relative p-6 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Avatar with negative margin to overlap banner */}
            <div className="flex-shrink-0 -mt-8 lg:-mt-16 mx-auto lg:mx-0">
              <div className="relative">
                <div className="w-32 h-32">
                  <ComedianAvatar
                    name={comedian.name}
                    avatar_url={comedian.avatar_url}
                    size="large"
                    priority
                  />
                </div>
                {/* Glow effect */}
                <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl -z-10" />
              </div>
            </div>

            <div className="flex-1 text-center lg:text-left text-white">
              <ComedianBasicInfo
                name={comedian.name}
                location={comedian.location}
                tagline={comedian.profile_tagline}
                is_verified={comedian.is_verified}
              />

              {/* Reduced space for actions */}
              <div className="mt-4">
                <ComedianActions
                  email={comedian.email}
                  name={comedian.name}
                  onShare={onShare}
                  onContact={handleContact}
                />
              </div>
            </div>
          </div>

          {/* Social Links positioned at bottom right */}
          <ComedianSocialLinks
            instagram_url={comedian.instagram_url}
            twitter_url={comedian.twitter_url}
            facebook_url={comedian.facebook_url}
            youtube_url={comedian.youtube_url}
            tiktok_url={comedian.tiktok_url}
          />
        </CardContent>
      </div>

      {/* Upload Modal */}
      <Dialog open={isBannerUploadOpen} onOpenChange={setIsBannerUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Cover Banner</DialogTitle>
          </DialogHeader>
          <BannerUpload
            onBannerUploaded={handleBannerUploaded}
            currentBannerUrl={localBannerUrl || comedian.banner_url}
          />
        </DialogContent>
      </Dialog>

      <BookingInquiryModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        comedianId={comedian.id}
        comedianName={comedian.name || 'this comedian'}
      />
    </>
  );
};

export default ComedianHeader;
