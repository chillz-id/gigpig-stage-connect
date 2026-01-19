/**
 * ComedianEPKModal Component
 *
 * A modal showing a mini EPK (Electronic Press Kit) preview for a comedian.
 * Used in the Applications tab to quickly review a comedian before shortlisting/confirming.
 *
 * Layout:
 * - Header: Avatar | Name, Location, Bio | Social Icons
 * - Sections: Vouches, Career Highlights, Videos, Reviews, Headshots
 */

import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  MapPin,
  ExternalLink,
  Star,
  CheckCircle,
  Instagram,
  Youtube,
  Globe,
  Award,
  Quote,
  Play,
  Image as ImageIcon,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TikTokIcon } from '@/components/icons/TikTokIcon';
import { XIcon } from '@/components/icons/XIcon';

interface ComedianEPKModalProps {
  isOpen: boolean;
  onClose: () => void;
  comedianId: string;
  comedianName?: string;
  isShortlisted?: boolean;
  onShortlist?: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
}

interface ComedianProfile {
  id: string;
  name: string;
  bio?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  twitter_url?: string | null;
  youtube_url?: string | null;
  website_url?: string | null;
  years_experience?: number | null;
  is_verified?: boolean;
  profile_slug?: string | null;
}

interface Vouch {
  id: string;
  voucher_id: string;
  message?: string | null;
  rating?: number | null;
  created_at: string;
  voucher?: {
    name: string;
    avatar_url?: string | null;
  };
}

interface Accomplishment {
  id: string;
  accomplishment: string;
  display_order?: number | null;
}

interface ComedianMedia {
  id: string;
  media_type: string;
  file_url?: string | null;
  external_url?: string | null;
  external_type?: string | null;
  external_id?: string | null;
  thumbnail_url?: string | null;
  title?: string | null;
  is_headshot?: boolean;
}

export function ComedianEPKModal({
  isOpen,
  onClose,
  comedianId,
  comedianName,
  isShortlisted = false,
  onShortlist,
  onConfirm,
  isLoading = false,
}: ComedianEPKModalProps) {
  // Fetch comedian profile
  const { data: comedian, isLoading: profileLoading } = useQuery({
    queryKey: ['comedian-epk-preview', comedianId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, name, bio, location, avatar_url, banner_url,
          instagram_url, tiktok_url, twitter_url, youtube_url, website_url,
          years_experience, is_verified, profile_slug
        `)
        .eq('id', comedianId)
        .single();

      if (error) throw error;
      return data as ComedianProfile;
    },
    enabled: isOpen && !!comedianId,
  });

  // Fetch vouches for this comedian
  const { data: vouches, isLoading: vouchesLoading } = useQuery({
    queryKey: ['comedian-vouches-preview', comedianId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vouches')
        .select(`
          id, voucher_id, message, rating, created_at,
          voucher:profiles!vouches_voucher_id_fkey(name, avatar_url)
        `)
        .eq('vouchee_id', comedianId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Vouch[];
    },
    enabled: isOpen && !!comedianId,
  });

  // Fetch career highlights/accomplishments
  const { data: accomplishments, isLoading: accomplishmentsLoading } = useQuery({
    queryKey: ['comedian-accomplishments-preview', comedianId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comedian_accomplishments')
        .select('id, accomplishment, display_order')
        .eq('user_id', comedianId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Accomplishment[];
    },
    enabled: isOpen && !!comedianId,
  });

  // Fetch comedian media (videos and photos) - uses user_id and show_in_epk filter
  const { data: media, isLoading: mediaLoading } = useQuery({
    queryKey: ['comedian-media-preview', comedianId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comedian_media')
        .select('id, media_type, file_url, external_url, external_type, external_id, thumbnail_url, title, is_headshot')
        .eq('user_id', comedianId)
        .eq('show_in_epk', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ComedianMedia[];
    },
    enabled: isOpen && !!comedianId,
  });

  const displayName = comedian?.name || comedianName || 'Comedian';

  // Split media into videos and photos
  const videos = media?.filter(m => m.media_type === 'video') || [];
  const photos = media?.filter(m => m.media_type === 'image' || m.media_type === 'photo') || [];

  // Helper to get media URL
  const getMediaUrl = (item: ComedianMedia): string => {
    if (item.external_url) return item.external_url;
    return item.file_url || '';
  };

  // Helper to get thumbnail URL (YouTube or file)
  const getThumbnailUrl = (item: ComedianMedia): string => {
    if (item.thumbnail_url) return item.thumbnail_url;
    if (item.external_type === 'youtube' && item.external_id) {
      return `https://img.youtube.com/vi/${item.external_id}/maxresdefault.jpg`;
    }
    return item.file_url || '';
  };

  // Helper to extract YouTube ID from URL if not already set
  const getYouTubeId = (item: ComedianMedia): string | null => {
    if (item.external_id) return item.external_id;
    if (item.external_url) {
      const match = item.external_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  // Build social links
  const socialLinks = [
    comedian?.instagram_url && { icon: Instagram, href: comedian.instagram_url, label: 'Instagram', color: 'text-pink-400 hover:text-pink-500' },
    comedian?.tiktok_url && { icon: TikTokIcon, href: comedian.tiktok_url, label: 'TikTok', color: 'text-foreground hover:text-muted-foreground' },
    comedian?.youtube_url && { icon: Youtube, href: comedian.youtube_url, label: 'YouTube', color: 'text-red-500 hover:text-red-600' },
    comedian?.twitter_url && { icon: XIcon, href: comedian.twitter_url, label: 'X', color: 'text-foreground hover:text-muted-foreground' },
    comedian?.website_url && { icon: Globe, href: comedian.website_url, label: 'Website', color: 'text-emerald-400 hover:text-emerald-500' },
  ].filter(Boolean) as Array<{ icon: React.FC<{ className?: string }>; href: string; label: string; color: string }>;

  // Handle view full profile
  const handleViewProfile = () => {
    if (comedian?.profile_slug) {
      window.open(`/comedian/${comedian.profile_slug}`, '_blank');
    }
  };

  const isDataLoading = profileLoading || vouchesLoading || accomplishmentsLoading || mediaLoading;

  // Video scroll ref and handlers
  const videoScrollRef = useRef<HTMLDivElement>(null);
  const scrollVideos = (direction: 'left' | 'right') => {
    if (videoScrollRef.current) {
      const scrollAmount = 180; // Width of one video card
      videoScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{displayName} - Profile Preview</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[90vh]">
          {/* Banner */}
          <div className="h-28 w-full bg-gradient-to-br from-purple-600 to-purple-900">
            {comedian?.banner_url && (
              <OptimizedImage
                src={comedian.banner_url}
                alt={`${displayName}'s banner`}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* Content */}
          <div className="px-5 pb-5">
            {profileLoading ? (
              <div className="space-y-4 pt-4">
                <div className="flex gap-4">
                  <Skeleton className="h-28 w-28 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Header: Info on left, Avatar on right */}
                <div className="-mt-14 flex items-start gap-3">
                  {/* Name, Location, Bio - takes most space */}
                  <div className="flex-1 pt-16">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">{displayName}</h2>
                      {comedian?.is_verified && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs px-1.5 py-0">
                          Verified
                        </Badge>
                      )}
                    </div>

                    {comedian?.location && (
                      <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{comedian.location}</span>
                        {comedian?.years_experience && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{comedian.years_experience}+ yrs</span>
                          </>
                        )}
                      </div>
                    )}

                    {comedian?.bio && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {comedian.bio}
                      </p>
                    )}
                  </div>

                  {/* Avatar - larger, on right */}
                  <div className="flex flex-col items-center gap-2">
                    <OptimizedAvatar
                      src={comedian?.avatar_url}
                      name={displayName}
                      className="h-28 w-28 border-4 border-background shadow-lg flex-shrink-0"
                    />

                    {/* Social Links - vertical stack */}
                    {socialLinks.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {socialLinks.map(({ icon: Icon, href, label, color }) => (
                          <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${color} transition-transform hover:scale-110`}
                            aria-label={label}
                          >
                            <Icon className="h-4 w-4" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vouches Section */}
                {!vouchesLoading && vouches && vouches.length > 0 && (
                  <div className="mt-5">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Quote className="h-4 w-4" />
                      Vouches ({vouches.length})
                    </h3>
                    <ScrollArea className="w-full whitespace-nowrap">
                      <div className="flex gap-2 pb-2">
                        {vouches.map((vouch) => (
                          <div
                            key={vouch.id}
                            className="flex w-52 flex-shrink-0 flex-col gap-1.5 rounded-lg border bg-muted/50 p-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <OptimizedAvatar
                                src={vouch.voucher?.avatar_url}
                                name={vouch.voucher?.name || 'Anonymous'}
                                className="h-6 w-6"
                              />
                              <span className="text-xs font-medium truncate">
                                {vouch.voucher?.name || 'Anonymous'}
                              </span>
                              {vouch.rating && (
                                <div className="ml-auto flex items-center gap-0.5">
                                  {[...Array(vouch.rating)].map((_, i) => (
                                    <Star key={i} className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </div>
                              )}
                            </div>
                            {vouch.message && (
                              <p className="text-xs text-muted-foreground line-clamp-2 whitespace-normal">
                                "{vouch.message}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                )}

                {/* Career Highlights Section */}
                {!accomplishmentsLoading && accomplishments && accomplishments.length > 0 && (
                  <div className="mt-5">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Award className="h-4 w-4" />
                      Career Highlights
                    </h3>
                    <ul className="space-y-1">
                      {accomplishments.slice(0, 4).map((acc) => (
                        <li
                          key={acc.id}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                          {acc.accomplishment}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Videos Section */}
                {!mediaLoading && videos.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Play className="h-4 w-4" />
                        Videos ({videos.length})
                      </h3>
                      {videos.length > 2 && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => scrollVideos('left')}
                            className="rounded-full p-1 hover:bg-muted transition-colors"
                            aria-label="Scroll left"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => scrollVideos('right')}
                            className="rounded-full p-1 hover:bg-muted transition-colors"
                            aria-label="Scroll right"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div
                      ref={videoScrollRef}
                      className="flex gap-2 overflow-x-auto scrollbar-hide"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {videos.map((video) => {
                        const youtubeId = getYouTubeId(video);
                        const thumbnailUrl = youtubeId
                          ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
                          : getThumbnailUrl(video);

                        return (
                          <a
                            key={video.id}
                            href={getMediaUrl(video)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-video w-44 flex-shrink-0 overflow-hidden rounded-lg bg-muted transition-transform hover:scale-[1.02]"
                          >
                            <OptimizedImage
                              src={thumbnailUrl}
                              alt={video.title || 'Video'}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
                                <div className="ml-0.5 border-l-6 border-y-[5px] border-y-transparent border-l-gray-800" />
                              </div>
                            </div>
                            {video.title && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                                <p className="truncate text-xs text-white">{video.title}</p>
                              </div>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Headshots Section - 4 column grid with forced square crop */}
                {!mediaLoading && photos.length > 0 && (
                  <div className="mt-5">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <ImageIcon className="h-4 w-4" />
                      Headshots ({photos.length})
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {photos.slice(0, 8).map((photo) => (
                        <div
                          key={photo.id}
                          className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                        >
                          <OptimizedImage
                            src={photo.file_url || ''}
                            alt={photo.title || 'Photo'}
                            className="absolute inset-0 h-full w-full object-cover transition-transform hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews Section */}
                <div className="mt-5">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MessageSquare className="h-4 w-4" />
                    Reviews
                  </h3>
                  <p className="text-xs text-muted-foreground">No reviews yet</p>
                </div>

                {/* Empty State */}
                {!isDataLoading &&
                  (!vouches || vouches.length === 0) &&
                  (!accomplishments || accomplishments.length === 0) &&
                  (!media || media.length === 0) && (
                  <div className="mt-6 rounded-lg border border-dashed p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No additional profile information available yet.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex items-center gap-2 border-t pt-4">
                  <Button
                    variant="secondary"
                    onClick={handleViewProfile}
                    className="flex-1 gap-2"
                    disabled={!comedian?.profile_slug}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Full Profile
                  </Button>

                  {onShortlist && !isShortlisted && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        onShortlist();
                        onClose();
                      }}
                      disabled={isLoading}
                      className="flex-1 gap-2"
                    >
                      <Star className="h-4 w-4" />
                      Add to Shortlist
                    </Button>
                  )}

                  {isShortlisted && (
                    <Badge
                      variant="secondary"
                      className="flex-1 justify-center bg-yellow-100 py-2 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    >
                      <Star className="mr-1 h-4 w-4 fill-current" />
                      Shortlisted
                    </Badge>
                  )}

                  {onConfirm && (
                    <Button
                      onClick={() => {
                        onConfirm();
                        onClose();
                      }}
                      disabled={isLoading}
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default ComedianEPKModal;
