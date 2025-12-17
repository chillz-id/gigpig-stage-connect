import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAuth } from '@/contexts/AuthContext';

interface LinkThumbnailUploadProps {
  onThumbnailSelected: (thumbnailUrl: string) => void;
  currentThumbnailUrl?: string | null;
  linkId?: string; // Optional link ID for better file organization
  layout?: 'stacked' | 'grid'; // Determines recommended dimensions
}

export const LinkThumbnailUpload: React.FC<LinkThumbnailUploadProps> = ({
  onThumbnailSelected,
  currentThumbnailUrl,
  linkId,
  layout = 'grid',
}) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentThumbnailUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dimensionWarning, setDimensionWarning] = useState<string | null>(null);

  // Recommended dimensions based on layout
  const recommendedDimensions = layout === 'stacked'
    ? { width: 400, height: 400, ratio: '1:1' }
    : { width: 800, height: 400, ratio: '2:1' };

  // Use unified media-library bucket with path matching useMediaStorage's virtual folder structure
  // Path: {userId}/my-files/profile/Link Thumbnails maps to MediaBrowser's my-files/profile/Link Thumbnails
  const { uploadFile } = useFileUpload({
    bucket: 'media-library',
    folder: `${user?.id}/my-files/profile/Link Thumbnails${linkId ? `/${linkId}` : ''}`,
    maxSize: 5 * 1024 * 1024, // 5MB max
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

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Thumbnail must be less than 5MB.');
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
        const { width: recWidth, height: recHeight } = recommendedDimensions;
        if (img.width !== recWidth || img.height !== recHeight) {
          setDimensionWarning(
            `Image is ${img.width}×${img.height}. Recommended: ${recWidth}×${recHeight} (${recommendedDimensions.ratio}) for best quality.`
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
        onThumbnailSelected(fileUrl);
      } else {
        setError('Failed to upload thumbnail. Please try again.');
      }
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setError('There was an error uploading your thumbnail. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setDimensionWarning(null);
    onThumbnailSelected('');
  };

  return (
    <div className="space-y-3">
      {/* Current/Preview Thumbnail */}
      {previewUrl && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">
            {selectedFile ? 'Selected Thumbnail' : 'Current Thumbnail'}
          </label>
          <div className="relative">
            <div className={`${layout === 'stacked' ? 'aspect-square' : 'aspect-[2/1]'} rounded-lg overflow-hidden border border-white/20 max-w-sm`}>
              <img
                src={previewUrl}
                alt="Link thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={removeFile}
              disabled={isUploading}
              className="absolute top-2 right-2 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-2 border border-white/20 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-white truncate max-w-[200px]">{selectedFile.name}</span>
              </div>
              <span className="text-xs text-gray-300">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          )}

          {isUploading && (
            <div className="text-xs text-purple-400">
              Uploading... {Math.round(uploadProgress)}%
            </div>
          )}
        </div>
      )}

      {/* Upload Button */}
      {!previewUrl && (
        <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center bg-white/5">
          <input
            type="file"
            id={`link-thumbnail-upload-${linkId || 'new'}`}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelection}
            className="hidden"
            disabled={isUploading}
          />
          <label htmlFor={`link-thumbnail-upload-${linkId || 'new'}`}>
            <Button
              type="button"
              onClick={() => document.getElementById(`link-thumbnail-upload-${linkId || 'new'}`)?.click()}
              disabled={isUploading}
              className="professional-button"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Custom Thumbnail'}
            </Button>
          </label>
          <p className="text-xs text-gray-300 mt-2">
            Recommended: {recommendedDimensions.width}×{recommendedDimensions.height}px ({recommendedDimensions.ratio})
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, or WebP (max 5MB)
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
          {error}
        </div>
      )}

      {/* Dimension Warning */}
      {dimensionWarning && !error && (
        <div className="text-xs text-yellow-400 bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20">
          {dimensionWarning}
        </div>
      )}
    </div>
  );
};
