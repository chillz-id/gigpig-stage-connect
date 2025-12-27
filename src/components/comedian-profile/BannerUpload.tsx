import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BannerImageEditor } from './BannerImageEditor';

interface BannerUploadProps {
  onBannerUploaded: (bannerUrl: string) => void;
  currentBannerUrl?: string | null;
}

export const BannerUpload: React.FC<BannerUploadProps> = ({
  onBannerUploaded,
  currentBannerUrl
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [originalFileName, setOriginalFileName] = useState<string>('banner.jpg');

  // Use unified media-library bucket with path matching useMediaStorage's virtual folder structure
  // Path: {userId}/my-files/profile/Profile Banners maps to MediaBrowser's my-files/profile/Profile Banners
  const { uploadFile } = useFileUpload({
    bucket: 'media-library',
    folder: `${user?.id}/my-files/profile/Profile Banners`,
    maxSize: 10 * 1024 * 1024, // 10MB max
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    onProgress: setUploadProgress
  });

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPG, PNG, or WebP image.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Banner image must be less than 10MB.',
        variant: 'destructive'
      });
      return;
    }

    setOriginalFileName(file.name);

    // Create preview and open editor immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setShowEditor(true);
    };
    reader.readAsDataURL(file);

    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  // Handler for cropped image - auto-uploads after cropping
  const handleImageSave = useCallback(async (imageDataUrl: string, blob?: Blob) => {
    if (!blob || !user) {
      setShowEditor(false);
      return;
    }

    setShowEditor(false);
    setIsUploading(true);

    try {
      // Create file from blob and upload directly
      const fileToUpload = new File([blob], originalFileName, { type: blob.type });
      const fileUrl = await uploadFile(fileToUpload);

      if (!fileUrl) {
        toast({
          title: 'Upload failed',
          description: 'Failed to upload banner image. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      // Update profiles table with new banner URL
      const { error } = await supabase
        .from('profiles')
        .update({ banner_url: fileUrl })
        .eq('id', user.id);

      if (error) {
        console.error('Database update error:', error);
        toast({
          title: 'Failed to save banner',
          description: 'The image was uploaded but failed to save. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Banner uploaded successfully',
        description: 'Your profile banner has been updated.'
      });

      onBannerUploaded(fileUrl);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your banner. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setPreviewUrl(null);
    }
  }, [user, originalFileName, uploadFile, toast, onBannerUploaded]);

  return (
    <div className="space-y-4">
      {/* Current Banner Preview */}
      {currentBannerUrl && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Banner</label>
          <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
            <img
              src={currentBannerUrl}
              alt="Current banner"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
        <input
          type="file"
          id="banner-upload-input"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelection}
          className="hidden"
          disabled={isUploading}
        />
        <label htmlFor="banner-upload-input">
          <Button
            type="button"
            onClick={() => document.getElementById('banner-upload-input')?.click()}
            disabled={isUploading}
            className="professional-button"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Choose Banner Image'}
          </Button>
        </label>
        <p className="text-sm text-gray-500 mt-2">
          You'll crop to 16:9 ratio after selecting
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Supported: JPG, PNG, WebP (max 10MB)
        </p>
      </div>

      {/* Uploading indicator */}
      {isUploading && (
        <div className="flex items-center justify-center p-4 bg-slate-800 rounded-lg">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-3" />
          <span className="text-sm text-gray-300">Uploading banner... {Math.round(uploadProgress)}%</span>
        </div>
      )}

      {/* Banner Image Editor - opens immediately after file selection */}
      {showEditor && previewUrl && (
        <BannerImageEditor
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setPreviewUrl(null);
          }}
          onImageSave={handleImageSave}
          imageUrl={previewUrl}
        />
      )}
    </div>
  );
};
