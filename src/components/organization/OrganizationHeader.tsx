import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import OrganizationBasicInfo from './OrganizationBasicInfo';
import OrganizationActions from './OrganizationActions';
import OrganizationSocialLinks from './OrganizationSocialLinks';
import { BannerImage } from '@/components/comedian-profile/BannerImage';
import { BannerUpload } from '@/components/comedian-profile/BannerUpload';
import { Button } from '@/components/ui/button';
import { Upload, Camera } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';

interface OrganizationHeaderProps {
  organization: {
    id: string;
    organization_name: string | null;
    bio: string | null;
    tagline?: string | null;
    location: string | null;
    logo_url: string | null;
    banner_url?: string | null;
    banner_position?: { x: number; y: number; scale: number } | null;
    is_verified: boolean;
    email: string | null;
    instagram_url?: string | null;
    twitter_url?: string | null;
    facebook_url?: string | null;
    youtube_url?: string | null;
    tiktok_url?: string | null;
    linkedin_url?: string | null;
    url_slug: string | null;
  };
  isOwnProfile: boolean;
  onShare: () => void;
  onContact: () => void;
}

const OrganizationHeader: React.FC<OrganizationHeaderProps> = ({ organization, isOwnProfile, onShare, onContact }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBannerUploadOpen, setIsBannerUploadOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [localBannerUrl, setLocalBannerUrl] = useState(organization.banner_url);
  const [localLogoUrl, setLocalLogoUrl] = useState(organization.logo_url);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const { uploadFile } = useFileUpload({
    bucket: 'organization-media',
    folder: `organization-logos/${organization.id}`,
    maxSize: 5 * 1024 * 1024, // 5MB max
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  const handleBannerUpload = () => {
    // Always open upload dialog to upload new banner
    setIsBannerUploadOpen(true);
  };

  const handleBannerSave = async (position: { x: number; y: number; scale: number }) => {
    try {
      const { error } = await supabase
        .from('organization_profiles')
        .update({
          banner_position: position
        })
        .eq('id', organization.id);

      if (error) throw error;

      // Invalidate query cache to trigger refetch and update UI
      await queryClient.invalidateQueries({
        queryKey: ['organization-profile']
      });

      toast({
        title: 'Banner position saved',
        description: 'Banner has been repositioned successfully.'
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
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, or WebP)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingLogo(true);

      // Upload file
      const fileUrl = await uploadFile(file);

      if (!fileUrl) {
        toast({
          title: 'Upload failed',
          description: 'Failed to upload logo. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Update organization profile
      const { error: updateError } = await supabase
        .from('organization_profiles')
        .update({ logo_url: fileUrl })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      setLocalLogoUrl(fileUrl);

      // Invalidate cache
      await queryClient.invalidateQueries({
        queryKey: ['organization-profile']
      });

      toast({
        title: 'Logo uploaded',
        description: 'Organization logo has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleContact = () => {
    setIsContactModalOpen(true);
    onContact();
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl">
        {/* Banner Section - 8:3 aspect ratio (1200x450) */}
        <div className="relative w-full aspect-[8/3]">
          <BannerImage
            banner_url={localBannerUrl || organization.banner_url || null}
            banner_position={organization.banner_position || null}
            isOwnProfile={isOwnProfile}
            onEditClick={handleBannerUpload}
            onRepositionSave={handleBannerSave}
          />

          {/* Fallback gradient background if no banner */}
          {!localBannerUrl && !organization.banner_url && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900" />
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
        <CardContent className="relative p-6 bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Logo with negative margin to overlap banner */}
            <div className="flex-shrink-0 -mt-8 lg:-mt-16 mx-auto lg:mx-0">
              <div className="relative group">
                <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl bg-white">
                  {localLogoUrl || organization.logo_url ? (
                    <OptimizedImage
                      src={localLogoUrl || organization.logo_url || ''}
                      alt={organization.organization_name || 'Organization logo'}
                      className="w-full h-full"
                      objectFit="cover"
                      fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(organization.organization_name || 'Org')}&size=400&background=9333ea&color=ffffff&bold=true`}
                      blur
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                      <Camera className="h-12 w-12 text-white" />
                    </div>
                  )}

                  {/* Upload overlay for owners/admins */}
                  {isOwnProfile && (
                    <>
                      <input
                        type="file"
                        id="logo-upload-input"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={isUploadingLogo}
                      />
                      <label
                        htmlFor="logo-upload-input"
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Upload className="w-8 h-8 text-white" />
                      </label>
                    </>
                  )}
                </div>
                {/* Glow effect */}
                <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur-xl -z-10" />
              </div>
            </div>

            <div className="flex-1 text-center lg:text-left text-white">
              <OrganizationBasicInfo
                organization_name={organization.organization_name}
                location={organization.location}
                tagline={organization.tagline}
                is_verified={organization.is_verified}
                url_slug={organization.url_slug}
              />

              {/* Actions */}
              <div className="mt-4">
                <OrganizationActions
                  email={organization.email}
                  organization_name={organization.organization_name}
                  onShare={onShare}
                  onContact={handleContact}
                />
              </div>
            </div>
          </div>

          {/* Social Links positioned at bottom right */}
          <OrganizationSocialLinks
            instagram_url={organization.instagram_url}
            twitter_url={organization.twitter_url}
            facebook_url={organization.facebook_url}
            youtube_url={organization.youtube_url}
            tiktok_url={organization.tiktok_url}
            linkedin_url={organization.linkedin_url}
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
            currentBannerUrl={localBannerUrl || organization.banner_url}
          />
        </DialogContent>
      </Dialog>

      {/* TODO: Create OrganizationContactModal if needed */}
      {isContactModalOpen && (
        <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contact {organization.organization_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <p>Contact functionality coming soon!</p>
              {organization.email && (
                <Button asChild className="w-full">
                  <a href={`mailto:${organization.email}`}>
                    Send Email
                  </a>
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default OrganizationHeader;
