
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ComedianAvatar from './ComedianAvatar';
import ComedianBasicInfo from './ComedianBasicInfo';
import ComedianActions from './ComedianActions';
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
    // Open upload dialog to upload new banner
    setIsBannerUploadOpen(true);
  };

  const handleBannerUploaded = async (bannerUrl: string) => {
    setLocalBannerUrl(bannerUrl);
    setIsBannerUploadOpen(false);

    // Invalidate query cache to refresh banner without page reload
    await queryClient.invalidateQueries({
      queryKey: ['comedian-profile-by-slug']
    });
  };

  const handleContact = () => {
    setIsBookingModalOpen(true);
    onContact();
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl">
        {/* Banner Section - shorter on mobile (3:1), 16:9 on larger screens */}
        <div className="relative w-full aspect-[3/1] sm:aspect-[21/9] md:aspect-video">
          <BannerImage
            banner_url={localBannerUrl || comedian.banner_url || null}
            isOwnProfile={isOwnProfile}
            onEditClick={handleBannerUpload}
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

        {/* Content Section - centered layout */}
        <CardContent className="relative p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
          <div className="flex flex-col items-center">
            {/* Avatar - centered, 50% over banner */}
            <div className="-mt-16 sm:-mt-20 md:-mt-24 mb-4">
              <div className="relative">
                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                  <ComedianAvatar
                    name={comedian.name}
                    avatar_url={comedian.avatar_url}
                    size="large"
                    priority
                  />
                </div>
                {/* Glow effect */}
                <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl -z-10" />
              </div>
            </div>

            {/* Name, Location, Tagline - centered */}
            <div className="text-center text-white w-full max-w-xl">
              <ComedianBasicInfo
                name={comedian.name}
                location={comedian.location}
                tagline={comedian.profile_tagline}
                is_verified={comedian.is_verified}
              />

              {/* Book Now - centered under name */}
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
