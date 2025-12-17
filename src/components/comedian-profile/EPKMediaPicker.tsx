import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Youtube, X, Image, Check, FolderOpen, Globe, Users, Lock } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { YouTubeUploadGuide } from '@/components/profile/YouTubeUploadGuide';
import { cn } from '@/lib/utils';
import { ImageEditorModal } from '@/components/ui/ImageEditorModal';
import { MediaBrowser } from '@/components/media/MediaBrowser';
import type { StorageFile } from '@/hooks/useMediaStorage';
import type { MediaVisibility } from '@/hooks/useComedianMedia';

interface MediaItem {
  id: string;
  file_url: string | null;
  thumbnail_url: string | null;
  title: string | null;
  media_type: string;
  show_in_epk: boolean;
}

interface EPKMediaPickerProps {
  mediaType: 'photo' | 'video';
  onMediaAdded: () => void;
}

// Visibility options with icons and descriptions
const VISIBILITY_OPTIONS: { value: MediaVisibility; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'public', label: 'Public', description: 'Visible to everyone', icon: <Globe className="w-4 h-4" /> },
  { value: 'promoters', label: 'Promoters/Industry', description: 'Visible to logged-in users', icon: <Users className="w-4 h-4" /> },
  { value: 'private', label: 'Private', description: 'Only visible to you', icon: <Lock className="w-4 h-4" /> },
];

export const EPKMediaPicker: React.FC<EPKMediaPickerProps> = ({ mediaType, onMediaAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [externalUrl, setExternalUrl] = useState('');
  const [libraryItems, setLibraryItems] = useState<MediaItem[]>([]);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<string>>(new Set());
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [selectedVisibility, setSelectedVisibility] = useState<MediaVisibility>('public');

  // Image editor state
  const [pendingEditUrl, setPendingEditUrl] = useState<string | null>(null);
  const [pendingEditFile, setPendingEditFile] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Use unified media-library bucket with path matching useMediaStorage's virtual folder structure
  // Path: {userId}/my-files/profile/Headshots maps to MediaBrowser's my-files/profile/Headshots
  const { uploadFile, isUploading: fileUploading } = useFileUpload({
    bucket: 'media-library',
    folder: `${user?.id}/my-files/profile/Headshots`,
    maxSize: mediaType === 'photo' ? 10 * 1024 * 1024 : 100 * 1024 * 1024,
    allowedTypes: mediaType === 'photo'
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'],
    onProgress: setUploadProgress
  });

  // Fetch existing media from library (not yet in EPK)
  useEffect(() => {
    if (!user?.id || activeTab !== 'library') return;

    const fetchLibraryItems = async () => {
      setIsLoadingLibrary(true);
      try {
        const { data, error } = await supabase
          .from('comedian_media')
          .select('id, file_url, thumbnail_url, title, media_type, show_in_epk')
          .eq('user_id', user.id)
          .eq('media_type', mediaType)
          .eq('show_in_epk', false) // Only show items NOT currently in EPK
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLibraryItems(data || []);
      } catch (error) {
        console.error('Error fetching library:', error);
        toast({
          title: "Failed to load library",
          description: "Could not retrieve your media files.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingLibrary(false);
      }
    };

    fetchLibraryItems();
  }, [user?.id, activeTab, mediaType, toast]);

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2]?.length === 11) ? match[2] : null;
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // For photos, open the image editor for the first file
    if (mediaType === 'photo' && files.length === 1 && files[0]) {
      const file = files[0];
      // Create preview URL and open editor
      const previewUrl = URL.createObjectURL(file);
      setPendingEditFile(file);
      setPendingEditUrl(previewUrl);
      setIsEditorOpen(true);
    } else {
      // Multiple files: add to queue for batch upload
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  // Handle save from image editor
  const handleEditorSave = async (imageDataUrl: string, blob?: Blob) => {
    if (!user || !pendingEditFile) return;

    try {
      setIsUploading(true);
      setIsEditorOpen(false);

      // Create a new file from the edited blob or convert dataUrl
      let fileToUpload: File;
      if (blob) {
        fileToUpload = new File([blob], pendingEditFile.name, { type: blob.type || 'image/jpeg' });
      } else {
        // Convert data URL to blob
        const response = await fetch(imageDataUrl);
        const convertedBlob = await response.blob();
        fileToUpload = new File([convertedBlob], pendingEditFile.name, { type: convertedBlob.type });
      }

      // Upload to storage
      const fileUrl = await uploadFile(fileToUpload);

      if (!fileUrl) {
        toast({
          title: "Upload failed",
          description: "Failed to upload the edited image.",
          variant: "destructive"
        });
        return;
      }

      // Save to database
      const { error } = await supabase
        .from('comedian_media')
        .insert({
          user_id: user.id,
          media_type: 'photo',
          title: pendingEditFile.name,
          file_url: fileUrl,
          url: fileUrl,
          file_size: fileToUpload.size,
          file_type: fileToUpload.type,
          is_headshot: true,
          show_in_epk: true,
          visibility: selectedVisibility
        });

      if (error) throw error;

      toast({
        title: "Photo added",
        description: `Your photo has been added to your EPK (${selectedVisibility}).`
      });

      // Clean up and refresh
      if (pendingEditUrl) {
        URL.revokeObjectURL(pendingEditUrl);
      }
      setPendingEditFile(null);
      setPendingEditUrl(null);
      onMediaAdded();
    } catch (error) {
      console.error('Editor save error:', error);
      toast({
        title: "Failed to save",
        description: "There was an error saving your edited photo.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection from MediaBrowser
  const handleMediaBrowserSelect = async (file: StorageFile) => {
    if (!user) return;

    try {
      setIsUploading(true);

      // Check if this file already exists in comedian_media
      const { data: existing } = await supabase
        .from('comedian_media')
        .select('id')
        .eq('user_id', user.id)
        .eq('file_url', file.publicUrl)
        .single();

      if (existing) {
        // File already exists, just update show_in_epk and visibility
        const { error } = await supabase
          .from('comedian_media')
          .update({ show_in_epk: true, visibility: selectedVisibility })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new comedian_media record from the storage file
        const { error } = await supabase
          .from('comedian_media')
          .insert({
            user_id: user.id,
            media_type: 'photo',
            title: file.name,
            file_url: file.publicUrl,
            url: file.publicUrl,
            file_size: file.size,
            file_type: file.mimeType,
            is_headshot: true,
            show_in_epk: true,
            visibility: selectedVisibility
          });

        if (error) throw error;
      }

      toast({
        title: "Photo added to EPK",
        description: `${file.name} has been added to your EPK.`
      });

      onMediaAdded();
    } catch (error) {
      console.error('Media browser select error:', error);
      toast({
        title: "Failed to add photo",
        description: "There was an error adding the selected photo.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleLibrarySelection = (id: string) => {
    setSelectedLibraryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAddFromLibrary = async () => {
    if (selectedLibraryIds.size === 0) return;

    try {
      setIsUploading(true);

      // Update selected items to show_in_epk = true
      const { error } = await supabase
        .from('comedian_media')
        .update({ show_in_epk: true })
        .in('id', Array.from(selectedLibraryIds));

      if (error) throw error;

      toast({
        title: `Added ${selectedLibraryIds.size} item${selectedLibraryIds.size > 1 ? 's' : ''} to EPK`,
        description: "Selected media is now visible on your EPK."
      });

      setSelectedLibraryIds(new Set());
      onMediaAdded();
    } catch (error) {
      console.error('Error adding from library:', error);
      toast({
        title: "Failed to add media",
        description: "There was an error adding selected media to your EPK.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultipleFileUpload = async () => {
    if (!user || selectedFiles.length === 0) return;

    try {
      setIsUploading(true);

      let successCount = 0;
      const failedFiles: string[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (!file) continue;

        const fileUrl = await uploadFile(file);

        if (!fileUrl) {
          failedFiles.push(file.name);
          continue;
        }

        // Save media record to database with show_in_epk = true
        const { error } = await supabase
          .from('comedian_media')
          .insert({
            user_id: user.id,
            media_type: mediaType,
            title: file.name,
            file_url: fileUrl,
            url: fileUrl,
            file_size: file.size,
            file_type: file.type,
            is_headshot: true,
            show_in_epk: true, // Auto-add to EPK when uploading through EPK picker
            visibility: selectedVisibility
          });

        if (error) {
          failedFiles.push(file.name);
          continue;
        }

        successCount++;
      }

      if (successCount > 0) {
        toast({
          title: `${successCount} photo${successCount > 1 ? 's' : ''} uploaded`,
          description: failedFiles.length > 0
            ? `Failed: ${failedFiles.join(', ')}`
            : "Photos have been added to your EPK."
        });
      } else if (failedFiles.length > 0) {
        toast({
          title: "Upload failed",
          description: `Failed files: ${failedFiles.join(', ')}`,
          variant: "destructive"
        });
      }

      if (successCount > 0) {
        setSelectedFiles([]);
        onMediaAdded();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your photos.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const fetchYouTubeTitle = async (videoUrl: string): Promise<string> => {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
      if (!response.ok) throw new Error('Failed to fetch video metadata');
      const data = await response.json();
      return data.title || 'YouTube Video';
    } catch (error) {
      return 'YouTube Video';
    }
  };

  const handleYouTubeSubmit = async () => {
    if (!user || !externalUrl.trim()) return;

    try {
      setIsUploading(true);

      const externalId = extractYouTubeId(externalUrl);
      if (!externalId) {
        toast({
          title: "Invalid YouTube URL",
          description: "Please enter a valid YouTube video URL.",
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }

      const videoTitle = await fetchYouTubeTitle(externalUrl);
      const thumbnailUrl = `https://img.youtube.com/vi/${externalId}/maxresdefault.jpg`;

      const { error } = await supabase
        .from('comedian_media')
        .insert({
          user_id: user.id,
          media_type: mediaType,
          title: videoTitle,
          external_url: externalUrl,
          external_type: 'youtube',
          external_id: externalId,
          thumbnail_url: thumbnailUrl,
          url: externalUrl,
          show_in_epk: true, // Auto-add to EPK
          visibility: selectedVisibility
        });

      if (error) throw error;

      toast({
        title: "YouTube video added",
        description: `Your video has been added to your EPK (${selectedVisibility}).`
      });

      setExternalUrl('');
      onMediaAdded();
    } catch (error) {
      console.error('YouTube link error:', error);
      toast({
        title: "Failed to add video",
        description: "There was an error adding your YouTube video.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Video mode - YouTube URL only
  if (mediaType === 'video') {
    return (
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'library')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Add New</TabsTrigger>
          <TabsTrigger value="library">From Library</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <YouTubeUploadGuide variant="icon" />
            </div>
            <Input
              id="youtube-url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-sm text-muted-foreground mt-1">
              Paste your unlisted YouTube video URL.
            </p>
          </div>

          {/* Visibility Selector */}
          <div>
            <Label htmlFor="video-visibility">Who can see this?</Label>
            <Select value={selectedVisibility} onValueChange={(v) => setSelectedVisibility(v as MediaVisibility)}>
              <SelectTrigger id="video-visibility" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{opt.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleYouTubeSubmit}
            disabled={isUploading || !externalUrl.trim()}
            className="w-full professional-button"
          >
            <Youtube className="w-4 h-4 mr-2" />
            Add YouTube Video
          </Button>
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          {isLoadingLibrary ? (
            <div className="text-center py-8 text-muted-foreground">Loading library...</div>
          ) : libraryItems.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No videos available to add</p>
              <p className="text-sm text-muted-foreground mt-1">All your videos are already on your EPK</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {libraryItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleLibrarySelection(item.id)}
                    className={cn(
                      "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                      selectedLibraryIds.has(item.id)
                        ? "border-green-500 ring-2 ring-green-500/30"
                        : "border-transparent hover:border-white/30"
                    )}
                  >
                    <img
                      src={item.thumbnail_url || item.file_url || '/placeholder-video.jpg'}
                      alt={item.title || 'Video'}
                      className="w-full h-full object-cover"
                    />
                    {selectedLibraryIds.has(item.id) && (
                      <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleAddFromLibrary}
                disabled={isUploading || selectedLibraryIds.size === 0}
                className="w-full professional-button"
              >
                Add {selectedLibraryIds.size} Video{selectedLibraryIds.size !== 1 ? 's' : ''} to EPK
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    );
  }

  // Photo mode - Upload or select from library
  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'library')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload New</TabsTrigger>
          <TabsTrigger value="library">From Library</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <input
              type="file"
              id="epk-photo-upload-input"
              accept="image/*"
              onChange={handleFileSelection}
              className="hidden"
              disabled={isUploading}
            />
            <label htmlFor="epk-photo-upload-input">
              <Button
                type="button"
                onClick={() => document.getElementById('epk-photo-upload-input')?.click()}
                disabled={isUploading}
                className="professional-button"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Photo
              </Button>
            </label>
            <p className="text-sm text-gray-500 mt-2">
              JPG, PNG, WebP (max 10MB)
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Photo will open in editor for cropping/adjustments
            </p>
          </div>

          {/* Visibility Selector for photos */}
          <div>
            <Label htmlFor="photo-visibility">Who can see this?</Label>
            <Select value={selectedVisibility} onValueChange={(v) => setSelectedVisibility(v as MediaVisibility)}>
              <SelectTrigger id="photo-visibility" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{opt.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({selectedFiles.length})</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border border-border rounded-lg bg-card">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleMultipleFileUpload}
                disabled={isUploading || selectedFiles.length === 0}
                className="w-full professional-button"
              >
                {isUploading ? (
                  <span>Uploading... {Math.round(uploadProgress)}%</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <div className="h-[500px] border rounded-lg overflow-hidden">
            <MediaBrowser
              initialPath="my-files/profile/Headshots"
              mode="picker"
              onFileSelect={handleMediaBrowserSelect}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Click on any photo to add it to your EPK
          </p>
        </TabsContent>
      </Tabs>

      {/* Image Editor Modal */}
      {pendingEditUrl && (
        <ImageEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            if (pendingEditUrl) {
              URL.revokeObjectURL(pendingEditUrl);
            }
            setPendingEditUrl(null);
            setPendingEditFile(null);
          }}
          onSave={handleEditorSave}
          imageUrl={pendingEditUrl}
          title="Edit Photo"
          aspectRatio="free"
          quality={0.92}
          format="jpeg"
        />
      )}
    </>
  );
};
