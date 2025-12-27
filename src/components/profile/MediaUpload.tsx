import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Youtube, X } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { YouTubeUploadGuide } from './YouTubeUploadGuide';

interface MediaUploadProps {
  mediaType: 'photo' | 'video';
  onMediaAdded: () => void;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ mediaType, onMediaAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [externalUrl, setExternalUrl] = useState('');

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

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMultipleFileUpload = async () => {
    if (!user || selectedFiles.length === 0) return;

    try {
      setIsUploading(true);

      let successCount = 0;
      const failedFiles: string[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        console.log(`Uploading file ${i + 1}/${selectedFiles.length}: ${file.name}, size: ${file.size}, type: ${file.type}`);

        // Upload file to Headshots folder (folder is set in useFileUpload config)
        const fileUrl = await uploadFile(file);

        if (!fileUrl) {
          console.error(`Failed to upload: ${file.name}`);
          failedFiles.push(file.name);
          continue; // Skip to next file, useFileUpload already showed error toast
        }

        console.log(`Successfully uploaded: ${file.name} -> ${fileUrl}`);

        // Save media record to database
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
            is_headshot: true  // Auto-mark as headshot since this component uploads to Headshots folder
          });

        if (error) {
          console.error('Database insert error:', error);
          failedFiles.push(file.name);
          continue;
        }

        successCount++;
      }

      if (successCount > 0) {
        toast({
          title: `${successCount} headshot${successCount > 1 ? 's' : ''} uploaded successfully`,
          description: failedFiles.length > 0
            ? `Failed: ${failedFiles.join(', ')}. Check file size (max 10MB) and format.`
            : "Your headshots have been added to your portfolio."
        });
      } else if (failedFiles.length > 0) {
        toast({
          title: "Upload failed",
          description: `Failed files: ${failedFiles.join(', ')}. Check file size (max 10MB) and format.`,
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
        description: "There was an error uploading your headshots. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const fetchYouTubeTitle = async (videoUrl: string): Promise<string> => {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
      if (!response.ok) {
        throw new Error('Failed to fetch video metadata');
      }
      const data = await response.json();
      return data.title || 'YouTube Video';
    } catch (error) {
      console.error('Error fetching YouTube title:', error);
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

      // Fetch the actual video title from YouTube
      const videoTitle = await fetchYouTubeTitle(externalUrl);
      const thumbnailUrl = `https://img.youtube.com/vi/${externalId}/maxresdefault.jpg`;

      // Save media record to database
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
          url: externalUrl
        });

      if (error) throw error;

      toast({
        title: "YouTube video added successfully",
        description: "Your YouTube video has been added to your portfolio."
      });

      setExternalUrl('');
      onMediaAdded();
    } catch (error) {
      console.error('YouTube link error:', error);
      toast({
        title: "Failed to add video",
        description: "There was an error adding your YouTube video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (mediaType === 'video') {
    return (
      <div className="space-y-4">
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
            Paste your unlisted YouTube video URL. Click the info icon above for step-by-step instructions.
          </p>
        </div>
        <Button
          onClick={handleYouTubeSubmit}
          disabled={isUploading || !externalUrl.trim()}
          className="w-full professional-button"
        >
          <Youtube className="w-4 h-4 mr-2" />
          Add YouTube Video
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
        <input
          type="file"
          id="headshot-upload-input"
          accept="image/*"
          multiple
          onChange={handleFileSelection}
          className="hidden"
          disabled={isUploading}
        />
        <label htmlFor="headshot-upload-input">
          <Button
            type="button"
            onClick={() => document.getElementById('headshot-upload-input')?.click()}
            disabled={isUploading}
            className="professional-button"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Headshots
          </Button>
        </label>
        <p className="text-sm text-gray-500 mt-2">
          Supported: JPG, PNG, WebP (max 10MB each)
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Files ({selectedFiles.length})</Label>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
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
              <>
                <span>Uploading... {Math.round(uploadProgress)}%</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {selectedFiles.length} Headshot{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};