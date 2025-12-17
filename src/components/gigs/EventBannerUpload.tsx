import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAuth } from '@/contexts/AuthContext';

interface EventBannerUploadProps {
  onBannerSelected: (bannerUrl: string) => void;
  currentBannerUrl?: string | null;
}

export const EventBannerUpload: React.FC<EventBannerUploadProps> = ({
  onBannerSelected,
  currentBannerUrl
}) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentBannerUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dimensionWarning, setDimensionWarning] = useState<string | null>(null);

  // Use unified media-library bucket with path matching useMediaStorage's virtual folder structure
  // Path: {userId}/my-files/events/Event Banners maps to MediaBrowser's my-files/events/Event Banners
  const { uploadFile } = useFileUpload({
    bucket: 'media-library',
    folder: `${user?.id}/my-files/events/Event Banners`,
    maxSize: 10 * 1024 * 1024, // 10MB max
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    onProgress: setUploadProgress
  });

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setDimensionWarning(null);

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please select a JPG, PNG, or WebP image.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Event banner must be less than 10MB.');
      return;
    }

    setSelectedFile(file);

    // Create preview and check dimensions
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewUrl(result);

      // Check image dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width !== 1920 || img.height !== 1080) {
          setDimensionWarning(
            `Image is ${img.width}×${img.height}. Recommended: 1920×1080 for best quality.`
          );
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);

    // Auto-upload the file
    try {
      setIsUploading(true);
      const fileUrl = await uploadFile(file);

      if (fileUrl) {
        onBannerSelected(fileUrl);
      } else {
        setError('Failed to upload banner. Please try again.');
      }
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setError('There was an error uploading your banner. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    onBannerSelected('');
  };

  return (
    <div className="space-y-4">
      {/* Current/Preview Banner */}
      {previewUrl && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">
            {selectedFile ? 'Selected Banner' : 'Current Banner'}
          </label>
          <div className="relative">
            <div className="aspect-[16/9] rounded-lg overflow-hidden border border-white/20">
              <img
                src={previewUrl}
                alt="Event banner"
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeFile}
              disabled={isUploading}
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 border border-white/20 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white truncate">{selectedFile.name}</span>
              </div>
              <span className="text-xs text-gray-300">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          )}

          {isUploading && (
            <div className="text-sm text-purple-400">
              Uploading... {Math.round(uploadProgress)}%
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      {!previewUrl && (
        <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center bg-white/5">
          <input
            type="file"
            id="event-banner-upload"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelection}
            className="hidden"
            disabled={isUploading}
          />
          <label htmlFor="event-banner-upload">
            <Button
              type="button"
              onClick={() => document.getElementById('event-banner-upload')?.click()}
              disabled={isUploading}
              className="professional-button"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Choose Event Banner'}
            </Button>
          </label>
          <p className="text-sm text-gray-300 mt-2">
            Recommended: 1920×1080px (16:9 ratio)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, or WebP (max 10MB)
          </p>
          <p className="text-xs text-gray-400 mt-2">
            If no banner is uploaded, your first horizontal headshot will be used
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
          {error}
        </div>
      )}

      {/* Dimension Warning */}
      {dimensionWarning && !error && (
        <div className="text-sm text-yellow-400 bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
          {dimensionWarning}
        </div>
      )}
    </div>
  );
};
