import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Image as ImageIcon, Play, Download, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useComedianMedia } from '@/hooks/useComedianMedia';
import { MediaUpload } from '@/components/profile/MediaUpload';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface ComedianMediaProps {
  comedianId: string;
  isOwnProfile?: boolean;
  trackInteraction?: (action: string, details?: any) => void;
}

const ComedianMedia: React.FC<ComedianMediaProps> = ({ comedianId, isOwnProfile = false, trackInteraction }) => {
  const { user } = useAuth();
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingType, setUploadingType] = useState<'photo' | 'video'>('photo');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { 
    photos, 
    videos, 
    loading, 
    error, 
    deleteMedia, 
    fetchMedia, 
    getThumbnailUrl, 
    getEmbedUrl, 
    getMediaUrl 
  } = useComedianMedia({ userId: comedianId });

  const handleUploadClick = (type: 'photo' | 'video') => {
    setUploadingType(type);
    setShowUploadDialog(true);
  };

  const handleMediaAdded = () => {
    setShowUploadDialog(false);
    fetchMedia(); // Refresh the media list
  };

  const handleDelete = async (mediaId: string) => {
    if (confirm('Are you sure you want to delete this media item?')) {
      await deleteMedia(mediaId);
    }
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Error loading media: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="professional-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Media Portfolio
            </CardTitle>
            {isOwnProfile && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleUploadClick('photo')} 
                  size="sm" 
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Photo
                </Button>
                <Button 
                  onClick={() => handleUploadClick('video')} 
                  size="sm" 
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Videos ({videos.length})
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Photos ({photos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-6">
              {videos.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No videos uploaded yet</p>
                  {isOwnProfile && (
                    <Button onClick={() => handleUploadClick('video')} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Your First Video
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {videos.map((video) => {
                    const embedUrl = getEmbedUrl(video);
                    const thumbnailUrl = getThumbnailUrl(video);
                    const mediaUrl = getMediaUrl(video);
                    
                    return (
                      <div
                        key={video.id}
                        className={cn(
                          "relative bg-gray-900 rounded-lg overflow-hidden transition-all duration-300",
                          "hover:scale-[1.02] hover:shadow-xl"
                        )}
                        onMouseEnter={() => setHoveredVideo(video.id)}
                        onMouseLeave={() => setHoveredVideo(null)}
                      >
                        <div className="relative aspect-video">
                          <OptimizedImage
                            src={thumbnailUrl}
                            alt={video.title || 'Video thumbnail'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          
                          {/* Overlay */}
                          <div className={cn(
                            "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity",
                            hoveredVideo === video.id ? "opacity-100" : "opacity-0"
                          )}>
                            <div className="flex gap-2">
                              {embedUrl ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" className="bg-white/20 backdrop-blur-sm">
                                      <Play className="w-4 h-4 mr-2" />
                                      Play
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl">
                                    <DialogHeader>
                                      <DialogTitle>{video.title}</DialogTitle>
                                    </DialogHeader>
                                    <div className="aspect-video">
                                      <iframe
                                        src={embedUrl}
                                        className="w-full h-full rounded-lg"
                                        allowFullScreen
                                        title={video.title || 'Video'}
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                <Button 
                                  size="sm" 
                                  className="bg-white/20 backdrop-blur-sm"
                                  onClick={() => openExternalLink(mediaUrl)}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                              )}
                              
                              {isOwnProfile && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDelete(video.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Featured badge */}
                          {video.is_featured && (
                            <Badge className="absolute top-2 left-2 bg-yellow-500">
                              Featured
                            </Badge>
                          )}

                          {/* Video type indicator */}
                          {video.external_type && (
                            <Badge className="absolute top-2 right-2" variant="secondary">
                              {video.external_type === 'youtube' ? 'YouTube' : 
                               video.external_type === 'google_drive' ? 'Google Drive' : 
                               video.external_type}
                            </Badge>
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className="font-semibold text-white mb-1">
                            {video.title || 'Untitled Video'}
                          </h3>
                          {video.description && (
                            <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                              {video.description}
                            </p>
                          )}
                          {video.tags && video.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {video.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos" className="mt-6">
              {photos.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No photos uploaded yet</p>
                  {isOwnProfile && (
                    <Button onClick={() => handleUploadClick('photo')} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Your First Photo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => {
                    const photoUrl = getMediaUrl(photo);
                    
                    return (
                      <Dialog key={photo.id}>
                        <DialogTrigger asChild>
                          <div
                            className={cn(
                              "relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300",
                              "hover:scale-[1.02] hover:shadow-lg"
                            )}
                            onMouseEnter={() => setHoveredPhoto(photo.id)}
                            onMouseLeave={() => setHoveredPhoto(null)}
                          >
                            <div className="aspect-square">
                              <OptimizedImage
                                src={photoUrl}
                                alt={photo.title || 'Photo'}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              
                              {/* Overlay */}
                              <div className={cn(
                                "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity",
                                hoveredPhoto === photo.id ? "opacity-100" : "opacity-0"
                              )}>
                                <div className="flex gap-2">
                                  {isOwnProfile && (
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(photo.id);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Featured badge */}
                              {photo.is_featured && (
                                <Badge className="absolute top-2 left-2 bg-yellow-500">
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{photo.title}</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-[80vh] overflow-auto">
                            <OptimizedImage
                              src={photoUrl}
                              alt={photo.title || 'Photo'}
                              className="w-full h-auto rounded-lg"
                            />
                            {photo.description && (
                              <p className="mt-4 text-gray-600">{photo.description}</p>
                            )}
                            {photo.tags && photo.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {photo.tags.map((tag) => (
                                  <Badge key={tag} variant="outline">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <MediaUpload 
            mediaType={uploadingType} 
            onMediaAdded={handleMediaAdded}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComedianMedia;