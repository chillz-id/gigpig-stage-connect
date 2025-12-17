/**
 * VenuePhotosPage
 *
 * Photo gallery for claimed venues.
 * Venues can browse and download photos from events at their location.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Images,
  Search,
  Loader2,
  Download,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  Building2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { venueClaimService } from '@/services/venue';
import type { VenueAccessiblePhoto, VenueWithClaim, VenueMediaAccess } from '@/types/directory';

export default function VenuePhotosPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [venue, setVenue] = useState<VenueWithClaim | null>(null);
  const [access, setAccess] = useState<VenueMediaAccess | null>(null);
  const [photos, setPhotos] = useState<VenueAccessiblePhoto[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [canAccessPhotos, setCanAccessPhotos] = useState(false);
  const [page, setPage] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');

  const PAGE_SIZE = 24;

  // Load venue data and photos
  useEffect(() => {
    const load = async () => {
      if (!venueId || !user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await venueClaimService.getVenueWithPhotoAccess(venueId, user.id);

        if (!data) {
          toast({
            title: 'Venue Not Found',
            description: 'This venue does not exist',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setVenue(data.venue);
        setAccess(data.access);
        setCanAccessPhotos(data.canAccessPhotos);
        setTotalPhotos(data.photoCount);

        if (data.canAccessPhotos) {
          const { photos: venuePhotos, total } = await venueClaimService.getVenueAccessiblePhotos(
            venueId,
            PAGE_SIZE,
            0
          );
          setPhotos(venuePhotos);
          setTotalPhotos(total);
        }
      } catch (error) {
        console.error('Failed to load venue data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load venue photos',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [venueId, user]);

  // Load more photos when page changes
  useEffect(() => {
    const loadPage = async () => {
      if (!venueId || !canAccessPhotos || page === 0) return;

      try {
        const { photos: venuePhotos } = await venueClaimService.getVenueAccessiblePhotos(
          venueId,
          PAGE_SIZE,
          page * PAGE_SIZE
        );
        setPhotos(venuePhotos);
      } catch (error) {
        console.error('Failed to load photos:', error);
      }
    };
    loadPage();
  }, [page]);

  // Filter photos
  const filteredPhotos = photos.filter(photo => {
    if (dateFilter && photo.event_date) {
      const photoMonth = photo.event_date.substring(0, 7);
      if (photoMonth !== dateFilter) return false;
    }
    return true;
  });

  // Get photo URL
  const getPhotoUrl = (photo: VenueAccessiblePhoto) => {
    if (photo.public_url) return photo.public_url;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/directory-media/${photo.storage_path}`;
  };

  // Download photo
  const handleDownload = async (photo: VenueAccessiblePhoto) => {
    if (!access?.can_download) {
      toast({
        title: 'Download Disabled',
        description: 'Photo downloads are not enabled for this venue',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = getPhotoUrl(photo);
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `venue-photo-${photo.media_id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download the photo',
        variant: 'destructive',
      });
    }
  };

  // Lightbox navigation
  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxIndex === null) return;
    const newIndex = direction === 'prev'
      ? (lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length
      : (lightboxIndex + 1) % filteredPhotos.length;
    setLightboxIndex(newIndex);
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown date';
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get unique months for filter
  const uniqueMonths = Array.from(
    new Set(
      photos
        .filter(p => p.event_date)
        .map(p => p.event_date!.substring(0, 7))
    )
  ).sort().reverse();

  // Page styles
  const getPageStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 min-h-screen';
    }
    return 'bg-gray-950 min-h-screen';
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center min-h-screen", getPageStyles())}>
        <Loader2 className="h-12 w-12 animate-spin text-white/50" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className={cn("flex items-center justify-center min-h-screen", getPageStyles())}>
        <p className="text-white/60">Venue not found</p>
      </div>
    );
  }

  if (!canAccessPhotos) {
    return (
      <div className={cn("flex flex-col items-center justify-center min-h-screen p-8", getPageStyles())}>
        <Card className="max-w-md w-full bg-white/5 border-white/10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-white/10 rounded-full w-fit">
              <Lock className="h-8 w-8 text-white/60" />
            </div>
            <CardTitle className="text-white text-xl">{venue.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-white/60">
              {venue.claimed_by
                ? "This venue's photos are only accessible to the verified venue owner."
                : "Claim this venue to access photos from events at your location."
              }
            </p>
            {!venue.claimed_by && (
              <Button onClick={() => navigate(`/claim-venue/${venueId}`)}>
                <Building2 className="h-4 w-4 mr-2" />
                Claim This Venue
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("p-6", getPageStyles())}>
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Building2 className="h-7 w-7" />
              {venue.name}
            </h1>
            <p className="text-white/60 mt-1">
              {totalPhotos} photos from events at your venue
            </p>
          </div>

          {/* Access info */}
          {access && (
            <div className="flex items-center gap-2">
              {access.can_download && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                  <Download className="h-3 w-3 mr-1" />
                  Downloads Enabled
                </Badge>
              )}
              {access.requires_attribution && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                  <Info className="h-3 w-3 mr-1" />
                  Attribution Required
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All dates</SelectItem>
              {uniqueMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateFilter('')}
              className="text-white/60"
            >
              Clear filters
              <X className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Photo Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50">
            <Images className="h-16 w-16 mb-4" />
            <p className="text-lg">No photos found</p>
            <p className="text-sm mt-2">
              {dateFilter ? 'Try changing the date filter' : 'Photos from events will appear here'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.media_id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-white/5 cursor-pointer"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={getPhotoUrl(photo)}
                    alt="Event photo"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Overlay with date */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs text-white/80 truncate">
                        {formatDate(photo.event_date)}
                      </p>
                    </div>
                  </div>

                  {/* Download button */}
                  {access?.can_download && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(photo);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPhotos > PAGE_SIZE && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="secondary"
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="flex items-center px-4 text-white/60">
                  Page {page + 1} of {Math.ceil(totalPhotos / PAGE_SIZE)}
                </span>
                <Button
                  variant="secondary"
                  disabled={(page + 1) * PAGE_SIZE >= totalPhotos}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <Dialog open onOpenChange={() => setLightboxIndex(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none [&>button]:hidden">
            <div className="relative w-full h-[90vh] flex items-center justify-center">
              {/* Close button */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={() => setLightboxIndex(null)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={() => navigateLightbox('prev')}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={() => navigateLightbox('next')}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>

              {/* Image */}
              <img
                src={getPhotoUrl(filteredPhotos[lightboxIndex])}
                alt="Event photo"
                className="max-w-full max-h-full object-contain"
              />

              {/* Info bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="font-medium">
                      {formatDate(filteredPhotos[lightboxIndex].event_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {access?.can_download && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownload(filteredPhotos[lightboxIndex])}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    <span className="text-sm text-white/60">
                      {lightboxIndex + 1} / {filteredPhotos.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
