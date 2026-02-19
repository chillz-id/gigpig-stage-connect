/**
 * DirectoryProfileCard Component
 *
 * Display detailed view of a directory profile with photos.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  MapPin,
  Calendar,
  Edit,
  Image as ImageIcon,
  X,
  MoreVertical,
  Star,
  User,
  Images,
  Upload,
  Clock,
  Music2,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { directoryService } from '@/services/directory';
import type { DirectoryProfile, DirectoryMedia } from '@/types/directory';
import { PendingPhotoTags } from './PendingPhotoTags';
import { PhotoUploadDialog } from './PhotoUploadDialog';

interface DirectoryProfileCardProps {
  profile: DirectoryProfile;
  onClose: () => void;
  onEdit: () => void;
}

export function DirectoryProfileCard({
  profile,
  onClose,
  onEdit,
}: DirectoryProfileCardProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [media, setMedia] = useState<DirectoryMedia[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingTagCount, setPendingTagCount] = useState(0);
  const [showPendingTags, setShowPendingTags] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  useEffect(() => {
    loadMedia();
    loadPendingTagCount();
  }, [profile.id]);

  const loadPendingTagCount = async () => {
    try {
      const count = await directoryService.getPendingTagCount(profile.id);
      setPendingTagCount(count);
    } catch (error) {
      console.error('Failed to load pending tag count:', error);
    }
  };

  const loadMedia = async () => {
    setIsLoadingMedia(true);
    try {
      const mediaItems = await directoryService.getMedia(profile.id);
      setMedia(mediaItems);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  // Set primary headshot (profile avatar)
  const handleSetPrimary = async (photo: DirectoryMedia) => {
    setIsSaving(true);
    try {
      await directoryService.setPrimaryHeadshot(profile.id, photo.id);
      toast({
        title: 'Profile Avatar Set',
        description: `${photo.file_name} is now the profile avatar`,
      });
      loadMedia();
    } catch (error) {
      console.error('Failed to set primary:', error);
      toast({
        title: 'Error',
        description: 'Failed to set profile avatar',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle headshot status
  const handleToggleHeadshot = async (photo: DirectoryMedia) => {
    setIsSaving(true);
    try {
      await directoryService.updateMedia(photo.id, { is_headshot: !photo.is_headshot });
      toast({
        title: photo.is_headshot ? 'Moved to Gallery' : 'Marked as Headshot',
        description: `${photo.file_name} updated`,
      });
      loadMedia();
    } catch (error) {
      console.error('Failed to toggle headshot:', error);
      toast({
        title: 'Error',
        description: 'Failed to update photo',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDialogStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-purple-900/95 border-white/20 text-white';
    }
    return 'bg-gray-900 border-gray-700 text-gray-100';
  };

  return (
    <>
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", getDialogStyles())}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">{profile.stage_name}</DialogTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header with photo */}
            <div className="flex items-start gap-6">
              <div className="h-32 w-32 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                {profile.primary_headshot_url ? (
                  <img
                    src={profile.primary_headshot_url}
                    alt={profile.stage_name}
                    className="h-full w-full object-cover cursor-pointer"
                    onClick={() => setSelectedImage(profile.primary_headshot_url)}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white/40">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  {profile.claimed_at ? (
                    <Badge variant="secondary" className="text-green-400 border-green-400/50">
                      Claimed
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-yellow-400 border-yellow-400/50">
                      Unclaimed
                    </Badge>
                  )}
                  <Badge variant="secondary">{profile.source}</Badge>
                </div>

                {/* Contact info */}
                <div className="space-y-1 text-sm">
                  {profile.email && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${profile.email}`} className="hover:underline">
                        {profile.email}
                      </a>
                    </div>
                  )}
                  {profile.booking_email && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Phone className="h-4 w-4" />
                      <span>{profile.booking_email}</span>
                    </div>
                  )}
                  {profile.origin_city && (
                    <div className="flex items-center gap-2 text-white/80">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.origin_city}{profile.origin_country ? `, ${profile.origin_country}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Bio */}
            {(profile.short_bio || profile.long_bio) && (
              <div>
                <h4 className="text-sm font-medium text-white/60 mb-2">Bio</h4>
                <p className="text-sm text-white/80 whitespace-pre-wrap">{profile.long_bio ?? profile.short_bio}</p>
              </div>
            )}

            {/* Tags */}
            {profile.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white/60 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Social links */}
            {(profile.website || profile.instagram_url || profile.facebook_url || profile.tiktok_url || profile.youtube_url || profile.twitter_url) && (
              <div>
                <h4 className="text-sm font-medium text-white/60 mb-2">Social</h4>
                <div className="flex flex-wrap gap-3">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-400 hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  {profile.instagram_url && (
                    <a
                      href={profile.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-pink-400 hover:underline"
                    >
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </a>
                  )}
                  {profile.tiktok_url && (
                    <a
                      href={profile.tiktok_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-white hover:underline"
                    >
                      <Music2 className="h-4 w-4" />
                      TikTok
                    </a>
                  )}
                  {profile.youtube_url && (
                    <a
                      href={profile.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-red-500 hover:underline"
                    >
                      <Youtube className="h-4 w-4" />
                      YouTube
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a
                      href={profile.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-sky-400 hover:underline"
                    >
                      <Twitter className="h-4 w-4" />
                      X / Twitter
                    </a>
                  )}
                  {profile.facebook_url && (
                    <a
                      href={profile.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                    >
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* Pending Tags */}
            {pendingTagCount > 0 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      {pendingTagCount} pending photo tag{pendingTagCount !== 1 ? 's' : ''} to review
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowPendingTags(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    Review Tags
                  </Button>
                </div>
              </div>
            )}

            {/* Photos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-white/60">
                  Photos ({media.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploadDialog(true)}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              </div>

              {isLoadingMedia ? (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-white/10 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : media.length === 0 ? (
                <p className="text-sm text-white/50">No photos uploaded</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {media.map((photo) => (
                    <div
                      key={photo.id}
                      className={cn(
                        "aspect-square rounded-lg overflow-hidden relative group",
                        photo.is_primary && "ring-2 ring-yellow-400"
                      )}
                    >
                      {/* Image */}
                      {photo.public_url ? (
                        <img
                          src={photo.public_url}
                          alt={photo.file_name}
                          className="h-full w-full object-cover cursor-pointer"
                          onClick={() => setSelectedImage(photo.public_url)}
                        />
                      ) : (
                        <div className="h-full w-full bg-white/10 flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-white/40" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-1 left-1 flex flex-col gap-1">
                        {photo.is_primary && (
                          <Badge className="bg-yellow-500 text-black text-[10px] px-1">
                            <Star className="h-2 w-2 mr-0.5" />
                            Avatar
                          </Badge>
                        )}
                        {photo.is_headshot && !photo.is_primary && (
                          <Badge className="bg-blue-500 text-white text-[10px] px-1">
                            <User className="h-2 w-2 mr-0.5" />
                            Headshot
                          </Badge>
                        )}
                      </div>

                      {/* Action menu */}
                      <div className="absolute bottom-1 right-1 z-20">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-6 w-6 bg-black/70 hover:bg-black/90 text-white border-0"
                              disabled={isSaving}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-[10001]">
                            {!photo.is_primary && (
                              <DropdownMenuItem onClick={() => handleSetPrimary(photo)}>
                                <Star className="h-4 w-4 mr-2" />
                                Set as Profile Avatar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleToggleHeadshot(photo)}>
                              {photo.is_headshot ? (
                                <>
                                  <Images className="h-4 w-4 mr-2" />
                                  Move to Gallery
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4 mr-2" />
                                  Mark as Headshot
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="bg-white/10" />

            {/* Metadata */}
            <div className="text-xs text-white/40 space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>Created: {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              {profile.claimed_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Claimed: {new Date(profile.claimed_at).toLocaleDateString()}</span>
                </div>
              )}
              {profile.slug && (
                <div>
                  <span>Slug: {profile.slug}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image lightbox */}
      {selectedImage && (
        <Dialog open onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-black/90 border-none">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={selectedImage}
              alt="Full size"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Pending photo tags review */}
      {showPendingTags && (
        <PendingPhotoTags
          profile={profile}
          onClose={() => {
            setShowPendingTags(false);
            loadPendingTagCount();
          }}
        />
      )}

      {/* Photo upload dialog with metadata */}
      {showUploadDialog && (
        <PhotoUploadDialog
          profileId={profile.id}
          onClose={() => setShowUploadDialog(false)}
          onSuccess={() => {
            setShowUploadDialog(false);
            loadMedia();
          }}
        />
      )}
    </>
  );
}
